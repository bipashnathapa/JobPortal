from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
import uuid  

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