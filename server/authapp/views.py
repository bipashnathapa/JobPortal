from django.shortcuts import render
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from server.mongo import (
    users_collection,
    listings_collection,
    applications_collection,
    notifications_collection,
    interviews_collection,
)
from .utils import (
    send_verification_email,
    send_interview_proposed_email,
    send_interview_response_email,
)
from .cv_rating import extract_text_from_pdf, get_cv_feedback
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import hashlib
import jwt
from datetime import datetime, timedelta
import os

VALID_ROLES = ("student", "employer")



# JWT Helper

def get_user_from_token(request):
    auth = request.headers.get("Authorization")
    if not auth:
        return None

    try:
        token = auth.split(" ")[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except:
        return None


# AUTH


@csrf_exempt
@api_view(['POST'])
def register(request):
    data = request.data
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    email = data.get("email")

    if not all([username, password, role, email]):
        return Response({"error": "All fields are required"}, status=400)

    if role not in VALID_ROLES:
        return Response({"error": "Invalid role"}, status=400)

    if users_collection.find_one({"username": username}):
        return Response({"error": "Username already exists"}, status=400)

    hashed_pw = hashlib.sha256(password.encode()).hexdigest()


    profile = {}
    if role == "student":
        profile = {
            "full_name": data.get("fullName", ""),
            "university": data.get("university", ""),
        }
    elif role == "employer":
        profile = {
            "company_name": data.get("companyName", ""),
        }

    users_collection.insert_one({
        "username": username,
        "password": hashed_pw,
        "role": role,
        "email": email,
        "is_verified": False,
        "profile": profile
    })

    send_verification_email(username, email)

    return Response({"message": "Registered. Please verify your email."})


@csrf_exempt
@api_view(['POST'])
def login(request):
    data = request.data
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return Response({"error": "Username and password required"}, status=400)

    user = users_collection.find_one({"username": username})
    if not user:
        return Response({"error": "User not found"}, status=404)

    hashed_pw = hashlib.sha256(password.encode()).hexdigest()
    if hashed_pw != user["password"]:
        return Response({"error": "Invalid password"}, status=401)

    if not user.get("is_verified"):
        return Response({"error": "Email not verified"}, status=403)

    payload = {
        "username": username,
        "role": user["role"],
        "exp": datetime.utcnow() + timedelta(hours=1)
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    return Response({
        "access": token,
        "role": user["role"]
    })


#  CV RATING (simple: rate + suggestions via Groq)
@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def rate_cv(request):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)
    if user.get("role") != "student":
        return Response({"error": "Only students can use CV feedback"}, status=403)

    cv_text = (request.data.get("text") or "").strip()
    if "cv" in request.FILES:
        f = request.FILES["cv"]
        if not f.name.lower().endswith(".pdf"):
            return Response({"error": "CV must be a PDF"}, status=400)
        if f.size > 5 * 1024 * 1024:
            return Response({"error": "PDF must be under 5MB"}, status=400)
        extracted = extract_text_from_pdf(f)
        cv_text = extracted if not cv_text else cv_text + "\n\n" + extracted

    if not cv_text or len(cv_text) < 30:
        return Response({"error": "Provide a PDF and/or paste CV text (at least a few lines)."}, status=400)

    result = get_cv_feedback(cv_text)
    if result.get("error") and result["error"] != "GROQ_NOT_CONFIGURED":
        err = result["error"] if getattr(settings, "DEBUG", False) else "CV analysis failed. Try again."
        return Response({"error": err}, status=500)

    return Response({
        "rating": result["rating"],
        "suggestions": result["suggestions"],
        "summary": result["summary"],
        "message": result["summary"] if result.get("error") == "GROQ_NOT_CONFIGURED" else "Here’s your CV feedback.",
    })


#  STUDENT PROFILE


@api_view(["GET"])
def get_profile(request):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    db_user = users_collection.find_one({
        "username": user["username"],
        "role": "student"
    })

    if not db_user:
        return Response({"error": "Student not found"}, status=404)

    profile = db_user.get("profile", {})


    return Response({
        "profile": {
            "full_name": profile.get("full_name") or profile.get("fullName", ""),
            "university": profile.get("university", ""),
            "phone": profile.get("phone", ""),
            "bio": profile.get("bio", ""),
            "skills": profile.get("skills", ""),
            "profile_picture": profile.get("profile_picture", "")
        }
    })


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def update_profile(request):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    # Get the current profile to preserve existing profile picture if not updating
    db_user = users_collection.find_one({
        "username": user["username"],
        "role": "student"
    })
    
    current_profile = db_user.get("profile", {}) if db_user else {}
    profile_picture_path = current_profile.get("profile_picture", "")

    # Handle profile picture upload
    if 'profile_picture' in request.FILES:
        profile_picture = request.FILES['profile_picture']
        
        # Delete old profile picture if it exists
        if profile_picture_path:
            old_file_path = os.path.join(settings.MEDIA_ROOT, profile_picture_path.lstrip('/media/'))
            if os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                except Exception as e:
                    print(f"Error deleting old profile picture: {e}")
        
        # Create unique filename
        ext = profile_picture.name.split('.')[-1]
        filename = f"profile_pictures/{user['username']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
        
        # Save the file
        path = default_storage.save(filename, ContentFile(profile_picture.read()))
        profile_picture_path = f"/media/{path}"

    # Update profile with all fields
    updated_profile = {
        "full_name": request.data.get("full_name", ""),
        "university": request.data.get("university", ""),
        "phone": request.data.get("phone", ""),
        "bio": request.data.get("bio", ""),
        "skills": request.data.get("skills", ""),
        "profile_picture": profile_picture_path
    }

    users_collection.update_one(
        {"username": user["username"], "role": "student"},
        {"$set": {"profile": updated_profile}}
    )

    return Response({
        "message": "Profile saved",
        "profile_picture": profile_picture_path
    })



 #VIEW STUDENT PROFILE (for employers)


@api_view(["GET"])
def view_student_profile(request, username):
    """Allow anyone (especially employers) to view a student's profile"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    # Find the student by username
    db_user = users_collection.find_one({
        "username": username,
        "role": "student"
    })

    if not db_user:
        return Response({"error": "Student not found"}, status=404)

    profile = db_user.get("profile", {})

    # Support both snake_case (new) and camelCase (legacy)
    return Response({
        "profile": {
            "username": username,
            "full_name": profile.get("full_name") or profile.get("fullName", ""),
            "university": profile.get("university", ""),
            "phone": profile.get("phone", ""),
            "bio": profile.get("bio", ""),
            "skills": profile.get("skills", ""),
            "profile_picture": profile.get("profile_picture", "")
        }
    })



# EMPLOYER PROFILE


@api_view(["GET"])
def get_employer_profile(request):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    db_user = users_collection.find_one({
        "username": user["username"],
        "role": "employer"
    })

    if not db_user:
        return Response({"error": "Employer not found"}, status=404)

    profile = db_user.get("profile", {})

    
    return Response({
        "profile": {
            "company_name": profile.get("company_name") or profile.get("companyName", ""),
            "industry": profile.get("industry", ""),
            "location": profile.get("location", ""),
            "company_size": profile.get("company_size", ""),
            "website": profile.get("website", ""),
            "description": profile.get("description", ""),
            "profile_picture": profile.get("profile_picture", "")
        }
    })


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def update_employer_profile(request):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    # Get the current profile to preserve existing profile picture if not updating
    db_user = users_collection.find_one({
        "username": user["username"],
        "role": "employer"
    })
    
    current_profile = db_user.get("profile", {}) if db_user else {}
    profile_picture_path = current_profile.get("profile_picture", "")

    # Handle profile picture upload
    if 'profile_picture' in request.FILES:
        profile_picture = request.FILES['profile_picture']
        
        # Delete old profile picture if it exists
        if profile_picture_path:
            old_file_path = os.path.join(settings.MEDIA_ROOT, profile_picture_path.lstrip('/media/'))
            if os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                except Exception as e:
                    print(f"Error deleting old profile picture: {e}")
        
        # Create unique filename
        ext = profile_picture.name.split('.')[-1]
        filename = f"profile_pictures/{user['username']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
        
        # Save the file
        path = default_storage.save(filename, ContentFile(profile_picture.read()))
        profile_picture_path = f"/media/{path}"

    # Update profile with all fields
    updated_profile = {
        "company_name": request.data.get("company_name", ""),
        "industry": request.data.get("industry", ""),
        "location": request.data.get("location", ""),
        "company_size": request.data.get("company_size", ""),
        "website": request.data.get("website", ""),
        "description": request.data.get("description", ""),
        "profile_picture": profile_picture_path
    }

    users_collection.update_one(
        {"username": user["username"], "role": "employer"},
        {"$set": {"profile": updated_profile}}
    )

    return Response({
        "message": "Profile saved",
        "profile_picture": profile_picture_path
    })



# EMAIL VERIFICATION


@api_view(["GET"])
def verify_email(request):
    token = request.GET.get("token")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username = payload["username"]

        users_collection.update_one(
            {"username": username},
            {"$set": {"is_verified": True}}
        )

        return Response({"message": "Email verified"})

    except jwt.ExpiredSignatureError:
        return Response({"error": "Token expired"}, status=400)

    except:
        return Response({"error": "Invalid token"}, status=400)



# DASHBOARDS


def home(request):
    return render(request, "authapp/index.html")

def student_dashboard(request):
    return render(request, "authapp/student_dashboard.html")

def employer_dashboard(request):
    return render(request, "authapp/employer_dashboard.html")


# JOB LISTINGS


@api_view(["POST"])
def post_listing(request):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    if user["role"] != "employer":
        return Response({"error": "Only employers can post listings"}, status=403)

    data = request.data

    if not data.get("job_title") or not data.get("description"):
        return Response({"error": "Job title and description are required"}, status=400)

    listing = {
        "employer_username": user["username"],
        "job_title": data.get("job_title", ""),
        "description": data.get("description", ""),
        "salary": data.get("salary", ""),
        "location": data.get("location", ""),
        "deadline": data.get("deadline", ""),
        "required_skills": data.get("required_skills", ""),
        "job_type": data.get("job_type", ""),
        "work_mode": data.get("work_mode", ""),
        "posted_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "is_active": True
    }

    listings_collection.insert_one(listing)

    return Response({"message": "Listing posted successfully"})

# ADD THESE TWO FUNCTIONS to your views.py

@api_view(["GET"])
def get_employer_listings(request):
    """Get all listings posted by the logged-in employer"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    if user["role"] != "employer":
        return Response({"error": "Only employers can view their listings"}, status=403)

    # Get all listings by this employer
    listings = list(listings_collection.find({"employer_username": user["username"]}))
    
    # Convert ObjectId to string for JSON serialization
    for listing in listings:
        listing["_id"] = str(listing["_id"])
    
    return Response({"listings": listings})


@api_view(["DELETE"])
def delete_listing(request, listing_id):
    """Delete a specific listing"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    if user["role"] != "employer":
        return Response({"error": "Only employers can delete listings"}, status=403)

    # Find the listing
    from bson.objectid import ObjectId
    listing = listings_collection.find_one({"_id": ObjectId(listing_id)})
    
    if not listing:
        return Response({"error": "Listing not found"}, status=404)
    
    # Check if this employer owns the listing
    if listing["employer_username"] != user["username"]:
        return Response({"error": "You can only delete your own listings"}, status=403)
    
    # Delete the listing
    listings_collection.delete_one({"_id": ObjectId(listing_id)})
    
    return Response({"message": "Listing deleted successfully"})




@api_view(["GET"])
def get_listing_detail(request, listing_id):
    """Get details of a specific listing"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    from bson.objectid import ObjectId
    
    try:
        listing = listings_collection.find_one({"_id": ObjectId(listing_id)})
        
        if not listing:
            return Response({"error": "Listing not found"}, status=404)
        
        # Convert ObjectId to string
        listing["_id"] = str(listing["_id"])
        
        return Response({"listing": listing})
    except Exception as e:
        return Response({"error": "Invalid listing ID"}, status=400)
    
@api_view(["GET"])
def get_listing_detail(request, listing_id):
    """Get details of a specific listing"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    from bson.objectid import ObjectId
    
    try:
        listing = listings_collection.find_one({"_id": ObjectId(listing_id)})
        
        if not listing:
            return Response({"error": "Listing not found"}, status=404)
        
        # Convert ObjectId to string
        listing["_id"] = str(listing["_id"])
        
        # Get employer's company name
        employer = users_collection.find_one({
            "username": listing["employer_username"],
            "role": "employer"
        })
        
        company_name = "Unknown Company"
        if employer and employer.get("profile"):
            company_name = employer["profile"].get("company_name", "Unknown Company")
        
        listing["company_name"] = company_name
        
        return Response({"listing": listing})
    except Exception as e:
        return Response({"error": "Invalid listing ID"}, status=400)

@api_view(["GET"])
def get_all_listings(request):
    """Get all active job listings (for students to browse)"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    # Get all active listings
    listings = list(listings_collection.find({"is_active": True}))
    
    # Convert ObjectId to string and add company names
    for listing in listings:
        listing["_id"] = str(listing["_id"])
        
        # Get employer's company name
        employer = users_collection.find_one({
            "username": listing["employer_username"],
            "role": "employer"
        })
        
        if employer and employer.get("profile"):
            listing["company_name"] = employer["profile"].get("company_name", "Unknown Company")
        else:
            listing["company_name"] = "Unknown Company"
    
    return Response({"listings": listings})

@api_view(["POST"])
def save_job(request, listing_id):
    """Save a listing for the logged-in student"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    if user["role"] != "student":
        return Response({"error": "Only students can save jobs"}, status=403)

    from bson.objectid import ObjectId

    try:
        listing = listings_collection.find_one({"_id": ObjectId(listing_id)})
    except Exception:
        return Response({"error": "Invalid listing ID"}, status=400)

    if not listing:
        return Response({"error": "Listing not found"}, status=404)

    users_collection.update_one(
        {"username": user["username"], "role": "student"},
        {"$addToSet": {"saved_jobs": listing_id}}
    )

    return Response({"message": "Job saved"})


@api_view(["POST"])
def unsave_job(request, listing_id):
    """Remove a saved listing for the logged-in student"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    if user["role"] != "student":
        return Response({"error": "Only students can unsave jobs"}, status=403)

    users_collection.update_one(
        {"username": user["username"], "role": "student"},
        {"$pull": {"saved_jobs": listing_id}}
    )

    return Response({"message": "Job removed from saved jobs"})


@api_view(["GET"])
def get_saved_jobs(request):
    """Get all saved listings for the logged-in student"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    if user["role"] != "student":
        return Response({"error": "Only students can view saved jobs"}, status=403)

    student = users_collection.find_one(
        {"username": user["username"], "role": "student"},
        {"saved_jobs": 1}
    )

    saved_ids = student.get("saved_jobs", []) if student else []
    if not saved_ids:
        return Response({"saved_jobs": [], "saved_count": 0})

    from bson.objectid import ObjectId
    valid_object_ids = []
    id_order = []
    for listing_id in saved_ids:
        try:
            oid = ObjectId(listing_id)
            valid_object_ids.append(oid)
            id_order.append(str(oid))
        except Exception:
            continue

    if not valid_object_ids:
        return Response({"saved_jobs": [], "saved_count": 0})

    listings = list(
        listings_collection.find({"_id": {"$in": valid_object_ids}, "is_active": True})
    )

    listing_map = {}
    for listing in listings:
        listing["_id"] = str(listing["_id"])

        employer = users_collection.find_one({
            "username": listing["employer_username"],
            "role": "employer"
        })

        if employer and employer.get("profile"):
            listing["company_name"] = employer["profile"].get("company_name", "Unknown Company")
        else:
            listing["company_name"] = "Unknown Company"

        listing_map[listing["_id"]] = listing

    ordered_saved_jobs = [listing_map[lid] for lid in id_order if lid in listing_map]
    return Response({"saved_jobs": ordered_saved_jobs, "saved_count": len(ordered_saved_jobs)})

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def submit_application(request, listing_id):
    """Submit a job application"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    if user["role"] != "student":
        return Response({"error": "Only students can apply"}, status=403)

    from bson.objectid import ObjectId
    
    # Check if listing exists
    listing = listings_collection.find_one({"_id": ObjectId(listing_id)})
    if not listing:
        return Response({"error": "Listing not found"}, status=404)

    # Check if already applied
    existing = applications_collection.find_one({
        "listing_id": listing_id,
        "student_username": user["username"]
    })
    
    if existing:
        return Response({"error": "You have already applied to this job"}, status=400)

    # Handle CV upload
    cv_path = ""
    if 'cv' in request.FILES:
        cv_file = request.FILES['cv']
        
        # Validate file type (PDF only)
        if not cv_file.name.endswith('.pdf'):
            return Response({"error": "CV must be in PDF format"}, status=400)
        
        # Validate file size (max 5MB)
        if cv_file.size > 5 * 1024 * 1024:
            return Response({"error": "CV file size must be less than 5MB"}, status=400)
        
        # Save CV
        ext = cv_file.name.split('.')[-1]
        filename = f"cvs/{user['username']}_{listing_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
        path = default_storage.save(filename, ContentFile(cv_file.read()))
        cv_path = f"/media/{path}"
    else:
        return Response({"error": "CV is required"}, status=400)

    # Create application
    application = {
        "listing_id": listing_id,
        "job_title": listing["job_title"],
        "employer_username": listing["employer_username"],
        "student_username": user["username"],
        "full_name": request.data.get("full_name", ""),
        "university": request.data.get("university", ""),
        "email": request.data.get("email", ""),
        "phone": request.data.get("phone", ""),
        "field_of_study": request.data.get("field_of_study", ""),
        "previous_experience": request.data.get("previous_experience", ""),
        "cv_path": cv_path,
        "status": "pending",
        "applied_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }

    applications_collection.insert_one(application)
    
    # Create notification for employer
    notification = {
        "employer_username": listing["employer_username"],
        "type": "new_application",
        "student_name": request.data.get("full_name", ""),
        "job_title": listing["job_title"],
        "message": f"New application from {request.data.get('full_name', 'a student')} for {listing['job_title']}",
        "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "read": False
    }
    notifications_collection.insert_one(notification)

    return Response({"message": "Application submitted successfully"})





@api_view(["POST"])
def propose_interview(request, application_id):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)
    if user["role"] != "employer":
        return Response({"error": "Only employers can propose interviews"}, status=403)

    from bson.objectid import ObjectId

    try:
        application = applications_collection.find_one({"_id": ObjectId(application_id)})
    except Exception:
        return Response({"error": "Invalid application ID"}, status=400)

    if not application:
        return Response({"error": "Application not found"}, status=404)
    if application.get("employer_username") != user["username"]:
        return Response({"error": "Not authorized for this application"}, status=403)
    if application.get("status") != "accepted":
        return Response({"error": "Interview can only be scheduled for accepted applications"}, status=400)

    slot_start_raw = request.data.get("slot_start", "")
    slot_end_raw = request.data.get("slot_end", "")
    meeting_link = request.data.get("meeting_link", "").strip()
    interview_location = request.data.get("location", "").strip()
    notes = request.data.get("notes", "").strip()

    if not slot_start_raw or not slot_end_raw:
        return Response({"error": "slot_start and slot_end are required"}, status=400)

    try:
        slot_start_dt = datetime.fromisoformat(slot_start_raw)
        slot_end_dt = datetime.fromisoformat(slot_end_raw)
    except Exception:
        return Response({"error": "Invalid datetime format"}, status=400)

    if slot_end_dt <= slot_start_dt:
        return Response({"error": "slot_end must be after slot_start"}, status=400)
    if slot_start_dt <= datetime.utcnow():
        return Response({"error": "Interview slot must be in the future"}, status=400)

    active_interview = interviews_collection.find_one({
        "application_id": application_id,
        "status": {"$in": ["proposed", "confirmed"]},
    })
    if active_interview:
        return Response({"error": "An active interview already exists for this application"}, status=400)

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    interview_doc = {
        "application_id": application_id,
        "listing_id": application.get("listing_id"),
        "job_title": application.get("job_title", ""),
        "employer_username": user["username"],
        "student_username": application.get("student_username", ""),
        "student_full_name": application.get("full_name", "") or application.get("student_username", ""),
        "slot_start": slot_start_dt.isoformat(),
        "slot_end": slot_end_dt.isoformat(),
        "meeting_link": meeting_link,
        "location": interview_location,
        "notes": notes,
        "status": "proposed",
        "created_at": now_str,
        "updated_at": now_str,
    }

    result = interviews_collection.insert_one(interview_doc)

    notes_message = f" Notes: {notes}" if notes else ""
    notifications_collection.insert_one({
        "student_username": application.get("student_username", ""),
        "type": "interview_proposed",
        "job_title": application.get("job_title", ""),
        "message": f"Interview scheduled for {application.get('job_title', 'your application')}. Please confirm or decline.{notes_message}",
        "created_at": now_str,
        "read": False,
    })

    student_user = users_collection.find_one({
        "username": application.get("student_username", ""),
        "role": "student",
    })
    if student_user and student_user.get("email"):
        send_interview_proposed_email(
            student_user["email"],
            application.get("student_username", ""),
            application.get("job_title", ""),
            interview_doc["slot_start"],
            interview_doc["slot_end"],
            meeting_link,
            notes,
        )

    return Response({"message": "Interview proposed successfully", "interview_id": str(result.inserted_id)})


@api_view(["GET"])
def get_student_interviews(request):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)
    if user["role"] != "student":
        return Response({"error": "Only students can view interviews"}, status=403)

    interviews = list(
        interviews_collection.find({"student_username": user["username"]}).sort("slot_start", 1)
    )
    for interview in interviews:
        interview["_id"] = str(interview["_id"])
    return Response({"interviews": interviews})


@api_view(["GET"])
def get_employer_interviews(request):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)
    if user["role"] != "employer":
        return Response({"error": "Only employers can view interviews"}, status=403)
    from bson.objectid import ObjectId

    interviews = list(
        interviews_collection.find({"employer_username": user["username"]}).sort("slot_start", 1)
    )
    for interview in interviews:
        if not interview.get("student_full_name"):
            application = applications_collection.find_one(
                {"_id": ObjectId(interview["application_id"])}
            ) if interview.get("application_id") else None
            if application and application.get("full_name"):
                interview["student_full_name"] = application.get("full_name")
            else:
                student = users_collection.find_one(
                    {"username": interview.get("student_username", ""), "role": "student"}
                )
                profile_name = (
                    student.get("profile", {}).get("full_name")
                    if student and isinstance(student.get("profile"), dict)
                    else ""
                )
                interview["student_full_name"] = profile_name or interview.get("student_username", "")
        interview["_id"] = str(interview["_id"])
    return Response({"interviews": interviews})


@api_view(["POST"])
def confirm_interview(request, interview_id):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)
    if user["role"] != "student":
        return Response({"error": "Only students can confirm interviews"}, status=403)

    from bson.objectid import ObjectId

    try:
        interview = interviews_collection.find_one({"_id": ObjectId(interview_id)})
    except Exception:
        return Response({"error": "Invalid interview ID"}, status=400)

    if not interview:
        return Response({"error": "Interview not found"}, status=404)
    if interview.get("student_username") != user["username"]:
        return Response({"error": "Not authorized for this interview"}, status=403)
    if interview.get("status") != "proposed":
        return Response({"error": "Only proposed interviews can be confirmed"}, status=400)

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    interviews_collection.update_one(
        {"_id": ObjectId(interview_id)},
        {"$set": {"status": "confirmed", "updated_at": now_str}},
    )

    notifications_collection.insert_one({
        "employer_username": interview.get("employer_username", ""),
        "type": "interview_confirmed",
        "student_name": user["username"],
        "job_title": interview.get("job_title", ""),
        "message": f"{user['username']} confirmed the interview for {interview.get('job_title', 'the role')}.",
        "created_at": now_str,
        "read": False,
    })

    employer_user = users_collection.find_one({
        "username": interview.get("employer_username", ""),
        "role": "employer",
    })
    if employer_user and employer_user.get("email"):
        send_interview_response_email(
            employer_user["email"],
            interview.get("employer_username", ""),
            user["username"],
            interview.get("job_title", ""),
            "confirmed",
        )

    return Response({"message": "Interview confirmed"})


@api_view(["POST"])
def decline_interview(request, interview_id):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)
    if user["role"] != "student":
        return Response({"error": "Only students can decline interviews"}, status=403)

    from bson.objectid import ObjectId

    try:
        interview = interviews_collection.find_one({"_id": ObjectId(interview_id)})
    except Exception:
        return Response({"error": "Invalid interview ID"}, status=400)

    if not interview:
        return Response({"error": "Interview not found"}, status=404)
    if interview.get("student_username") != user["username"]:
        return Response({"error": "Not authorized for this interview"}, status=403)
    if interview.get("status") != "proposed":
        return Response({"error": "Only proposed interviews can be declined"}, status=400)

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    interviews_collection.update_one(
        {"_id": ObjectId(interview_id)},
        {"$set": {"status": "declined", "updated_at": now_str}},
    )

    notifications_collection.insert_one({
        "employer_username": interview.get("employer_username", ""),
        "type": "interview_declined",
        "student_name": user["username"],
        "job_title": interview.get("job_title", ""),
        "message": f"{user['username']} declined the interview for {interview.get('job_title', 'the role')}.",
        "created_at": now_str,
        "read": False,
    })

    employer_user = users_collection.find_one({
        "username": interview.get("employer_username", ""),
        "role": "employer",
    })
    if employer_user and employer_user.get("email"):
        send_interview_response_email(
            employer_user["email"],
            interview.get("employer_username", ""),
            user["username"],
            interview.get("job_title", ""),
            "declined",
        )

    return Response({"message": "Interview declined"})

@api_view(["GET"])
def get_employer_notifications(request):
    """Get all notifications for the logged-in employer"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    if user["role"] != "employer":
        return Response({"error": "Only employers can view notifications"}, status=403)

    # Delete notifications older than 7 days
    seven_days_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
    notifications_collection.delete_many({
        "employer_username": user["username"],
        "created_at": {"$lt": seven_days_ago}
    })
    
    # Get remaining notifications for this employer
    notifications = list(notifications_collection.find({
        "employer_username": user["username"]
    }).sort("created_at", -1))
    
    # Convert ObjectId to string
    for notif in notifications:
        notif["_id"] = str(notif["_id"])
    
    return Response({"notifications": notifications})

@api_view(["POST"])
def update_application_status(request, application_id):
    """Update application status (accept/reject)"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    if user["role"] != "employer":
        return Response({"error": "Only employers can update status"}, status=403)

    from bson.objectid import ObjectId
    
    application = applications_collection.find_one({"_id": ObjectId(application_id)})
    
    print("APPLICATION FOUND:", application)  # ADD THIS
    
    if not application:
        return Response({"error": "Application not found"}, status=404)
    
    if application["employer_username"] != user["username"]:
        return Response({"error": "Not authorized"}, status=403)
    
    status = request.data.get("status")
    if status not in ["accepted", "rejected"]:
        return Response({"error": "Invalid status"}, status=400)
    
    # Update application status
    applications_collection.update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {"status": status}}
    )
    
    print("CREATING NOTIFICATION FOR:", application["student_username"])  # ADD THIS
    
    # Create notification for student
    notification = {
        "student_username": application["student_username"],
        "type": "application_status",
        "status": status,
        "job_title": application["job_title"],
        "message": f"Your application for {application['job_title']} has been {status}",
        "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "read": False
    }
    
    result = notifications_collection.insert_one(notification)
    print("NOTIFICATION CREATED WITH ID:", result.inserted_id)  # ADD THIS
    
    return Response({"message": f"Application {status}"})

@api_view(["GET"])
def get_student_notifications(request):
    """Get all notifications for the logged-in student"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    if user["role"] != "student":
        return Response({"error": "Only students can view notifications"}, status=403)

    # Delete notifications older than 7 days
    seven_days_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
    notifications_collection.delete_many({
        "student_username": user["username"],
        "created_at": {"$lt": seven_days_ago}
    })

    # Parse pagination query params.
    try:
        page = int(request.GET.get("page", 1))
    except (TypeError, ValueError):
        page = 1

    try:
        page_size = int(request.GET.get("page_size", 8))
    except (TypeError, ValueError):
        page_size = 8

    page = max(1, page)
    page_size = max(1, min(page_size, 50))

    query = {"student_username": user["username"]}
    total_count = notifications_collection.count_documents(query)
    total_pages = max(1, (total_count + page_size - 1) // page_size)
    if page > total_pages:
        page = total_pages

    skip = (page - 1) * page_size

    # Get paginated notifications for this student.
    notifications = list(
        notifications_collection.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(page_size)
    )
    
    # Convert ObjectId to string
    for notif in notifications:
        notif["_id"] = str(notif["_id"])

    return Response({
        "notifications": notifications,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_previous": page > 1,
            "has_next": page < total_pages,
        },
    })


@api_view(["POST"])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    from bson.objectid import ObjectId
    from server.mongo import notifications_collection
    
    notifications_collection.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )
    
    return Response({"message": "Notification marked as read"})

@api_view(["GET"])
def get_employer_applications(request):
    """Fetch all applications for jobs posted by the logged-in employer"""
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    if user["role"] != "employer":
        return Response({"error": "Only employers can view applications"}, status=403)

    # Fetch applications where the employer_username matches the current user
    apps_cursor = applications_collection.find({"employer_username": user["username"]})
    
    applications = []
    for app in apps_cursor:
        applications.append({
            "_id": str(app["_id"]),
            "job_title": app.get("job_title"),
            "full_name": app.get("full_name"),
            "student_username": app.get("student_username"), # Required for the 'View Profile' button
            "email": app.get("email"),
            "phone": app.get("phone"),
            "university": app.get("university"),
            "field_of_study": app.get("field_of_study"),
            "previous_experience": app.get("previous_experience"),
            "cv_path": app.get("cv_path"),
            "status": app.get("status", "pending"),
            "applied_at": app.get("applied_at")
        })

    return Response({"applications": applications})


@api_view(["GET"])
def get_admin_dashboard(request):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)
    if user.get("role") != "admin":
        return Response({"error": "Admin access required"}, status=403)

    total_users = users_collection.count_documents({})
    total_students = users_collection.count_documents({"role": "student"})
    total_employers = users_collection.count_documents({"role": "employer"})
    verified_users = users_collection.count_documents({"is_verified": True})

    total_listings = listings_collection.count_documents({})
    active_listings = listings_collection.count_documents({"is_active": True})
    expired_active_listings = listings_collection.count_documents({
        "is_active": True,
        "deadline": {"$lt": datetime.utcnow().strftime("%Y-%m-%d")},
    })

    total_applications = applications_collection.count_documents({})
    pending_applications = applications_collection.count_documents({"status": "pending"})
    accepted_applications = applications_collection.count_documents({"status": "accepted"})
    rejected_applications = applications_collection.count_documents({"status": "rejected"})

    total_interviews = interviews_collection.count_documents({})
    proposed_interviews = interviews_collection.count_documents({"status": "proposed"})
    confirmed_interviews = interviews_collection.count_documents({"status": "confirmed"})

    recent_users = list(
        users_collection.find({}, {"username": 1, "role": 1, "email": 1, "is_verified": 1})
        .sort("_id", -1)
        .limit(8)
    )
    for item in recent_users:
        item["_id"] = str(item["_id"])

    recent_listings = list(
        listings_collection.find({}, {"job_title": 1, "employer_username": 1, "deadline": 1, "is_active": 1})
        .sort("_id", -1)
        .limit(8)
    )
    for item in recent_listings:
        item["_id"] = str(item["_id"])
        employer = users_collection.find_one(
            {"username": item.get("employer_username", ""), "role": "employer"},
            {"profile": 1},
        )
        if employer and isinstance(employer.get("profile"), dict):
            item["company_name"] = employer["profile"].get("company_name", "Unknown Company")
        else:
            item["company_name"] = "Unknown Company"

    recent_applications = list(
        applications_collection.find(
            {},
            {"job_title": 1, "full_name": 1, "student_username": 1, "status": 1, "applied_at": 1},
        )
        .sort("_id", -1)
        .limit(8)
    )
    for item in recent_applications:
        item["_id"] = str(item["_id"])

    return Response({
        "stats": {
            "users_total": total_users,
            "students_total": total_students,
            "employers_total": total_employers,
            "verified_users": verified_users,
            "listings_total": total_listings,
            "listings_active": active_listings,
            "listings_expired_active": expired_active_listings,
            "applications_total": total_applications,
            "applications_pending": pending_applications,
            "applications_accepted": accepted_applications,
            "applications_rejected": rejected_applications,
            "interviews_total": total_interviews,
            "interviews_proposed": proposed_interviews,
            "interviews_confirmed": confirmed_interviews,
        },
        "recent_users": recent_users,
        "recent_listings": recent_listings,
        "recent_applications": recent_applications,
    })


@api_view(["POST"])
def admin_toggle_listing(request, listing_id):
    user = get_user_from_token(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)
    if user.get("role") != "admin":
        return Response({"error": "Admin access required"}, status=403)

    from bson.objectid import ObjectId

    try:
        oid = ObjectId(listing_id)
    except Exception:
        return Response({"error": "Invalid listing ID"}, status=400)

    listing = listings_collection.find_one({"_id": oid})
    if not listing:
        return Response({"error": "Listing not found"}, status=404)

    is_active = request.data.get("is_active")
    if not isinstance(is_active, bool):
        return Response({"error": "is_active must be boolean"}, status=400)

    listings_collection.update_one({"_id": oid}, {"$set": {"is_active": is_active}})
    return Response({"message": "Listing status updated", "is_active": is_active})
