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


def send_interview_proposed_email(student_email, student_username, job_title, slot_start, slot_end, meeting_link="", notes=""):
    link_line = f"\nMeeting link: {meeting_link}" if meeting_link else ""
    notes_line = f"\nNotes from employer: {notes}" if notes else ""
    send_mail(
        "Interview Invitation",
        (
            f"Hello {student_username},\n\n"
            f"You have received an interview invitation for {job_title}.\n"
            f"Start: {slot_start}\n"
            f"End: {slot_end}"
            f"{notes_line}"
            f"{link_line}\n\n"
            f"Please log in to your dashboard to confirm or decline."
        ),
        settings.DEFAULT_FROM_EMAIL,
        [student_email],
        fail_silently=False,
    )


def send_interview_response_email(employer_email, employer_username, student_username, job_title, response_status):
    send_mail(
        "Interview Response Update",
        (
            f"Hello {employer_username},\n\n"
            f"{student_username} has {response_status} the interview for {job_title}.\n\n"
            "Please log in to your dashboard for details."
        ),
        settings.DEFAULT_FROM_EMAIL,
        [employer_email],
        fail_silently=False,
    )
