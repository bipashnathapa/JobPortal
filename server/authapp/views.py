from django.shortcuts import render
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from server.mongo import users_collection, listings_collection, applications_collection, notifications_collection
from .utils import send_verification_email
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

    users_collection.insert_one({
        "username": username,
        "password": hashed_pw,
        "role": role,
        "email": email,
        "is_verified": False,
        "profile": {}
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
            "full_name": profile.get("full_name", ""),
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


# ================================
# 👀 VIEW STUDENT PROFILE (for employers)
# ================================

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

    return Response({
        "profile": {
            "username": username,
            "full_name": profile.get("full_name", ""),
            "university": profile.get("university", ""),
            "phone": profile.get("phone", ""),
            "bio": profile.get("bio", ""),
            "skills": profile.get("skills", ""),
            "profile_picture": profile.get("profile_picture", "")
        }
    })


# ================================
# 🏢 EMPLOYER PROFILE
# ================================

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
            "company_name": profile.get("company_name", ""),
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


# ================================
# EMAIL VERIFICATION
# ================================

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


# ================================
# DASHBOARDS
# ================================

def home(request):
    return render(request, "authapp/index.html")

def student_dashboard(request):
    return render(request, "authapp/student_dashboard.html")

def employer_dashboard(request):
    return render(request, "authapp/employer_dashboard.html")

# ================================
# 📋 JOB LISTINGS
# ================================

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
    
    # Get remaining notifications for this student
    notifications = list(notifications_collection.find({
        "student_username": user["username"]
    }).sort("created_at", -1))
    
    # Convert ObjectId to string
    for notif in notifications:
        notif["_id"] = str(notif["_id"])
    
    return Response({"notifications": notifications})


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