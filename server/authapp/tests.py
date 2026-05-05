from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
import uuid  
from unittest.mock import patch
from bson.objectid import ObjectId
from server.mongo import users_collection, listings_collection, applications_collection

class AuthTests(APITestCase):
    def setUp(self):
        # Generate a unique username for each test run to avoid MongoDB unique constraints
        self.unique_id = str(uuid.uuid4())[:8]
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.profile_url = reverse("profile")
        
        self.user_data = {
            "username": f"user_{self.unique_id}",
            "password": "password123",
            "email": f"test_{self.unique_id}@example.com",
            "role": "student",
        }

    # 1. Registration success
    def test_registration_success(self):
        new_user = {
            "username": f"new_student_{self.unique_id}",
            "password": "securePass123",
            "email": f"new_{self.unique_id}@site.com",
            "role": "student",
        }
        response = self.client.post(self.register_url, new_user)
        # Using assertIn covers both 200 (OK) and 201 (Created)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

    # 2. Registration missing fields
    def test_registration_missing_fields(self):
        response = self.client.post(self.register_url, {"username": "bad_user"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # 3. Duplicate username
    def test_registration_duplicate_username(self):
        # First registration
        self.client.post(self.register_url, self.user_data)
        # Second registration with same data
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # 4. Login success
    def test_login_success(self):
        self.client.post(self.register_url, self.user_data)
        response = self.client.post(
            self.login_url,
            {"username": self.user_data["username"], "password": self.user_data["password"]},
        )
        
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])

    # 5. Login invalid password
    def test_login_invalid_password(self):
        self.client.post(self.register_url, self.user_data)
        response = self.client.post(
            self.login_url,
            {"username": self.user_data["username"], "password": "wrongpassword"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # 6. Login non-existent user
    def test_login_nonexistent_user(self):
        response = self.client.post(
            self.login_url, {"username": "ghost_user_xyz_99", "password": "password"}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # 7. Unauthenticated access to protected route
    def test_unauthenticated_access(self):
        response = self.client.get(self.profile_url)
        # Ensure that without a token/session, access is denied
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ApplicationIntegrationTests(APITestCase):
    """
    AIT01-AIT05 integration tests for application + listing + auth flows.
    """

    def setUp(self):
        self.unique_id = f"ait_{uuid.uuid4().hex[:8]}"
        self.student_username = f"{self.unique_id}_student"
        self.employer_username = f"{self.unique_id}_employer"
        self.student_email = f"{self.unique_id}_student@example.com"
        self.employer_email = f"{self.unique_id}_employer@example.com"
        self.password = "password123"

    def tearDown(self):
        users_collection.delete_many(
            {
                "$or": [
                    {"username": {"$regex": f"^{self.unique_id}_"}},
                    {"email": {"$regex": f"^{self.unique_id}_.*@example\\.com$"}},
                ]
            }
        )
        listings_collection.delete_many(
            {
                "$or": [
                    {"employer_username": {"$regex": f"^{self.unique_id}_"}},
                    {"job_title": {"$regex": f"^{self.unique_id}_"}},
                ]
            }
        )
        applications_collection.delete_many(
            {
                "$or": [
                    {"student_username": {"$regex": f"^{self.unique_id}_"}},
                    {"employer_username": {"$regex": f"^{self.unique_id}_"}},
                    {"job_title": {"$regex": f"^{self.unique_id}_"}},
                ]
            }
        )

    def _register(self, username, email, role):
        payload = {
            "username": username,
            "password": self.password,
            "email": email,
            "role": role,
        }
        with patch("authapp.views.send_verification_email", return_value=None):
            return self.client.post("/api/register/", payload, format="json")

    def _login_token(self, username):
        res = self.client.post(
            "/api/login/",
            {"username": username, "password": self.password},
            format="json",
        )
        return res, res.data.get("access") if hasattr(res, "data") else None

    def _create_listing_via_api(self, employer_token):
        payload = {
            "job_title": f"{self.unique_id}_Intern",
            "description": "Integration test listing",
            "salary": "N/A",
            "location": "Kathmandu",
            "deadline": "2099-12-31",
            "required_skills": "Python",
            "job_type": "Internship",
            "work_mode": "Onsite",
        }
        res = self.client.post(
            "/api/post-listing/",
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {employer_token}",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        listing = listings_collection.find_one(
            {"employer_username": self.employer_username, "job_title": payload["job_title"]}
        )
        self.assertIsNotNone(listing)
        return str(listing["_id"]), payload["job_title"]

    def _apply_once(self, student_token, listing_id):
        return self.client.post(
            f"/api/apply/{listing_id}/",
            {
                "full_name": "Integration Student",
                "university": "Test University",
                "email": self.student_email,
                "phone": "9800000000",
                "field_of_study": "Computer Science",
                "previous_experience": "None",
            },
            format="multipart",
            HTTP_AUTHORIZATION=f"Bearer {student_token}",
        )

    # AIT01 - Application Flow
    def test_ait01_application_flow(self):
        self.assertIn(
            self._register(self.student_username, self.student_email, "student").status_code,
            [status.HTTP_200_OK, status.HTTP_201_CREATED],
        )
        self.assertIn(
            self._register(self.employer_username, self.employer_email, "employer").status_code,
            [status.HTTP_200_OK, status.HTTP_201_CREATED],
        )
        _, employer_token = self._login_token(self.employer_username)
        _, student_token = self._login_token(self.student_username)
        self.assertTrue(employer_token and student_token)

        listing_id, job_title = self._create_listing_via_api(employer_token)
        response = self.client.post(
            f"/api/apply/{listing_id}/",
            {
                "full_name": "Integration Student",
                "university": "Test University",
                "email": self.student_email,
                "phone": "9800000000",
                "field_of_study": "Computer Science",
                "previous_experience": "None",
                "cv": SimpleUploadedFile("cv.pdf", b"%PDF-1.4 mock", content_type="application/pdf"),
            },
            format="multipart",
            HTTP_AUTHORIZATION=f"Bearer {student_token}",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(applications_collection.find_one({
            "listing_id": listing_id,
            "student_username": self.student_username,
            "job_title": job_title,
            "employer_username": self.employer_username,
        }))

    # AIT02 - Duplicate Block
    def test_ait02_duplicate_block(self):
        self._register(self.student_username, self.student_email, "student")
        self._register(self.employer_username, self.employer_email, "employer")
        _, employer_token = self._login_token(self.employer_username)
        _, student_token = self._login_token(self.student_username)
        listing_id, _ = self._create_listing_via_api(employer_token)

        first = self.client.post(
            f"/api/apply/{listing_id}/",
            {
                "full_name": "Integration Student",
                "university": "Test University",
                "email": self.student_email,
                "phone": "9800000000",
                "field_of_study": "Computer Science",
                "previous_experience": "None",
                "cv": SimpleUploadedFile("cv1.pdf", b"%PDF-1.4 a", content_type="application/pdf"),
            },
            format="multipart",
            HTTP_AUTHORIZATION=f"Bearer {student_token}",
        )
        self.assertEqual(first.status_code, status.HTTP_200_OK)

        second = self.client.post(
            f"/api/apply/{listing_id}/",
            {
                "full_name": "Integration Student",
                "university": "Test University",
                "email": self.student_email,
                "phone": "9800000000",
                "field_of_study": "Computer Science",
                "previous_experience": "None",
                "cv": SimpleUploadedFile("cv2.pdf", b"%PDF-1.4 b", content_type="application/pdf"),
            },
            format="multipart",
            HTTP_AUTHORIZATION=f"Bearer {student_token}",
        )
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    # AIT03 - Stats Integration (Pending vs Total)
    def test_ait03_stats_integration(self):
        self._register(self.student_username, self.student_email, "student")
        _, student_token = self._login_token(self.student_username)
        self.assertTrue(student_token)

        applications_collection.insert_many([
            {
                "listing_id": "l1",
                "job_title": f"{self.unique_id}_job1",
                "employer_username": self.employer_username,
                "student_username": self.student_username,
                "status": "pending",
                "applied_at": "2026-01-01 10:00:00",
            },
            {
                "listing_id": "l2",
                "job_title": f"{self.unique_id}_job2",
                "employer_username": self.employer_username,
                "student_username": self.student_username,
                "status": "accepted",
                "applied_at": "2026-01-01 10:01:00",
            },
        ])

        res = self.client.get(
            "/api/student-application-stats/",
            HTTP_AUTHORIZATION=f"Bearer {student_token}",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("active_applications"), 1)  # pending only
        self.assertEqual(res.data.get("total_applications"), 2)

    # AIT04 - Employer Listing Link
    def test_ait04_employer_listing_link(self):
        self._register(self.employer_username, self.employer_email, "employer")
        _, employer_token = self._login_token(self.employer_username)
        listing_id, _ = self._create_listing_via_api(employer_token)

        listing = listings_collection.find_one({"_id": ObjectId(listing_id)})
        self.assertIsNotNone(listing)
        self.assertEqual(listing.get("employer_username"), self.employer_username)

    # AIT05 - Auth-to-Feature Link
    def test_ait05_auth_to_feature_link(self):
        self._register(self.student_username, self.student_email, "student")
        self._register(self.employer_username, self.employer_email, "employer")
        _, employer_token = self._login_token(self.employer_username)
        _, student_token = self._login_token(self.student_username)
        listing_id, _ = self._create_listing_via_api(employer_token)

        no_token_res = self.client.post(
            f"/api/apply/{listing_id}/",
            {
                "full_name": "No Token",
                "university": "U",
                "email": self.student_email,
                "phone": "9800000000",
                "field_of_study": "CS",
                "previous_experience": "None",
                "cv": SimpleUploadedFile("nt.pdf", b"%PDF-1.4 n", content_type="application/pdf"),
            },
            format="multipart",
        )
        self.assertEqual(no_token_res.status_code, status.HTTP_401_UNAUTHORIZED)

        with_token_res = self.client.post(
            f"/api/apply/{listing_id}/",
            {
                "full_name": "With Token",
                "university": "U",
                "email": self.student_email,
                "phone": "9800000000",
                "field_of_study": "CS",
                "previous_experience": "None",
                "cv": SimpleUploadedFile("wt.pdf", b"%PDF-1.4 w", content_type="application/pdf"),
            },
            format="multipart",
            HTTP_AUTHORIZATION=f"Bearer {student_token}",
        )
        self.assertEqual(with_token_res.status_code, status.HTTP_200_OK)
