import os
from locust import HttpUser, task, between


def _token_from_login_response(resp):
    data = resp.json()
    return data.get("access")


class StudentUser(HttpUser):
    wait_time = between(0.5, 2.0)
    weight = 4

    def on_start(self):
        self.username = os.getenv("LOCUST_STUDENT_USERNAME", "student_test")
        self.password = os.getenv("LOCUST_STUDENT_PASSWORD", "password123")
        self.token = None
        self.listing_id = os.getenv("LOCUST_LISTING_ID")
        self.headers = {}
        self._login()

    def _login(self):
        payload = {"username": self.username, "password": self.password}
        with self.client.post("/api/login/", json=payload, name="POST /api/login/", catch_response=True) as resp:
            if resp.status_code == 200:
                try:
                    token = _token_from_login_response(resp)
                except Exception:
                    resp.failure("Login JSON parse failed")
                    return
                if token:
                    self.token = token
                    self.headers = {"Authorization": f"Bearer {token}"}
                    resp.success()
                else:
                    resp.failure("No access token in response")
            else:
                resp.failure(f"Login failed: {resp.status_code}")

    @task(5)
    def get_all_listings(self):
        if not self.token:
            self._login()
            return
        self.client.get("/api/all-listings/", headers=self.headers, name="GET /api/all-listings/")

    @task(3)
    def get_notifications(self):
        if not self.token:
            self._login()
            return
        self.client.get(
            "/api/student-notifications/?page=1&page_size=20",
            headers=self.headers,
            name="GET /api/student-notifications/",
        )

    @task(2)
    def get_application_stats(self):
        if not self.token:
            self._login()
            return
        self.client.get(
            "/api/student-application-stats/",
            headers=self.headers,
            name="GET /api/student-application-stats/",
        )

    @task(1)
    def submit_application_optional(self):
        """
        Optional stress route for application submission.
        Requires LOCUST_LISTING_ID and a sample PDF path in LOCUST_CV_PATH.
        Disabled by default if env vars are missing.
        """
        if not self.token or not self.listing_id:
            return
        cv_path = os.getenv("LOCUST_CV_PATH")
        if not cv_path or not os.path.exists(cv_path):
            return

        with open(cv_path, "rb") as f:
            files = {"cv": ("cv.pdf", f, "application/pdf")}
            data = {
                "full_name": "Locust Student",
                "university": "Locust University",
                "email": os.getenv("LOCUST_STUDENT_EMAIL", "locust.student@example.com"),
                "phone": "9800000000",
                "field_of_study": "Computer Science",
                "previous_experience": "None",
            }
            self.client.post(
                f"/api/apply/{self.listing_id}/",
                data=data,
                files=files,
                headers=self.headers,
                name="POST /api/apply/{listing_id}/",
            )


class AdminUser(HttpUser):
    wait_time = between(1.0, 3.0)
    weight = 1

    def on_start(self):
        self.username = os.getenv("LOCUST_ADMIN_USERNAME", "admin")
        self.password = os.getenv("LOCUST_ADMIN_PASSWORD", "admin123")
        self.token = None
        self.headers = {}
        self._login()

    def _login(self):
        payload = {"username": self.username, "password": self.password}
        with self.client.post("/api/login/", json=payload, name="POST /api/login/ (admin)", catch_response=True) as resp:
            if resp.status_code == 200:
                try:
                    token = _token_from_login_response(resp)
                except Exception:
                    resp.failure("Admin login JSON parse failed")
                    return
                if token:
                    self.token = token
                    self.headers = {"Authorization": f"Bearer {token}"}
                    resp.success()
                else:
                    resp.failure("No admin access token in response")
            else:
                resp.failure(f"Admin login failed: {resp.status_code}")

    @task
    def get_admin_dashboard(self):
        if not self.token:
            self._login()
            return
        self.client.get("/api/admin/dashboard/", headers=self.headers, name="GET /api/admin/dashboard/")
