from django.core.mail import send_mail
import jwt
from datetime import datetime, timedelta
from django.conf import settings

def send_verification_email(username, email):
    token = jwt.encode(
        {"username": username, "exp": datetime.utcnow() + timedelta(hours=24)},
        settings.SECRET_KEY,
        algorithm="HS256"
    )
    verify_link = f"http://127.0.0.1:8000/api/verify-email/?token={token}"
    send_mail(
        "Verify your email",
        f"Click this link to verify: {verify_link}",
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False
    )