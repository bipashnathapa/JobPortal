"""
eSewa ePay V2 helpers (signature + verification).
Docs: https://developer.esewa.com.np/pages/Epay-V2
"""
import base64
import hashlib
import hmac
import json
from typing import Optional


def build_request_signature(total_amount: str, transaction_uuid: str, product_code: str, secret_key: str) -> str:
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    digest = hmac.new(
        secret_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return base64.b64encode(digest).decode("utf-8")


def verify_response_signature(payload: dict, secret_key: str) -> bool:
    signed_names = payload.get("signed_field_names") or ""
    if not signed_names:
        return False
    parts = []
    for name in signed_names.split(","):
        name = name.strip()
        if name == "signed_field_names":
            parts.append(f"{name}={signed_names}")
        else:
            val = payload.get(name)
            if val is None:
                return False
            parts.append(f"{name}={val}")
    message = ",".join(parts)
    sig_expected = payload.get("signature") or ""
    digest = hmac.new(
        secret_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    sig_computed = base64.b64encode(digest).decode("utf-8")
    return hmac.compare_digest(sig_expected, sig_computed)


def decode_success_query_data(data_b64: str) -> Optional[dict]:
    try:
        raw = base64.b64decode(data_b64)
        return json.loads(raw.decode("utf-8"))
    except Exception:
        return None
