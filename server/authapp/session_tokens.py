"""Short-lived access JWT + refresh JWT stored in Mongo (revocable)."""
import uuid

import jwt
from datetime import datetime, timedelta

from django.conf import settings

from server.mongo import refresh_tokens_collection

ACCESS_TOKEN_LIFETIME = getattr(settings, "ACCESS_TOKEN_LIFETIME", timedelta(minutes=15))
REFRESH_TOKEN_LIFETIME = getattr(settings, "REFRESH_TOKEN_LIFETIME", timedelta(days=7))


def issue_access_token(username: str, role: str) -> str:
    payload = {
        "typ": "access",
        "username": username,
        "role": role,
        "exp": datetime.utcnow() + ACCESS_TOKEN_LIFETIME,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def issue_refresh_token(username: str) -> tuple[str, str]:
    jti = str(uuid.uuid4())
    exp = datetime.utcnow() + REFRESH_TOKEN_LIFETIME
    refresh_tokens_collection.insert_one(
        {
            "jti": jti,
            "username": username,
            "exp": exp,
            "revoked": False,
        }
    )
    payload = {
        "typ": "refresh",
        "jti": jti,
        "username": username,
        "exp": exp,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256"), jti


def revoke_refresh_token(jti: str) -> None:
    refresh_tokens_collection.update_one({"jti": jti}, {"$set": {"revoked": True}})


def refresh_token_doc_valid(jti: str) -> bool:
    doc = refresh_tokens_collection.find_one({"jti": jti, "revoked": {"$ne": True}})
    return doc is not None


def set_refresh_cookie(response, refresh_jwt: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=refresh_jwt,
        max_age=int(REFRESH_TOKEN_LIFETIME.total_seconds()),
        httponly=True,
        samesite="Lax",
        secure=not settings.DEBUG,
        path="/",
    )


def clear_refresh_cookie(response) -> None:
    response.delete_cookie(
        "refresh_token",
        path="/",
        samesite="Lax",
        secure=not settings.DEBUG,
    )
