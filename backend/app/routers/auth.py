"""Đăng nhập Google cho người dùng cuối (F13).

Luồng OAuth 2.0 chuẩn: /api/auth/google chuyển tới Google, Google callback
về /api/auth/google/callback, backend đổi code lấy token, lấy thông tin
người dùng, lưu/cập nhật vào bảng users rồi phát JWT (24h) và chuyển về
Frontend kèm token. Frontend lưu token và gửi kèm các request cần xác thực
(phần Frontend xử lý token là việc tiếp theo sau khi backend này chạy).

Chưa cấu hình GOOGLE_CLIENT_ID/SECRET thì endpoint trả lỗi cấu hình rõ ràng
(503), không crash. Hai hệ phiên độc lập: editor đăng nhập Strapi admin
bằng tài khoản Strapi riêng, không dùng JWT này.
"""

import datetime
import json
import secrets
import urllib.parse
import urllib.request

import jwt
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse

from .. import config, db
from ..schemas import ErrorResponse
import sqlite3

router = APIRouter()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"


def _callback_url() -> str:
    return f"{config.PUBLIC_BASE_URL}/api/auth/google/callback"


def _not_configured():
    return JSONResponse(
        status_code=503,
        content={
            "error": {
                "code": "AUTH_NOT_CONFIGURED",
                "message": "Đăng nhập Google chưa được cấu hình: thiếu GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET.",
            }
        },
    )


@router.get("/api/auth/google")
def auth_google():
    if not config.GOOGLE_CLIENT_ID or not config.GOOGLE_CLIENT_SECRET:
        return _not_configured()
    params = {
        "client_id": config.GOOGLE_CLIENT_ID,
        "redirect_uri": _callback_url(),
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": secrets.token_urlsafe(16),
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}")


@router.get("/api/auth/google/callback")
def auth_google_callback(code: str = "", error: str = "", conn: sqlite3.Connection = Depends(db.get_conn)):
    if error:
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "OAUTH_DENIED", "message": f"Google từ chối đăng nhập: {error}"}},
        )
    if not code:
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "OAUTH_NO_CODE", "message": "Thiếu mã xác thực từ Google."}},
        )
    if not config.GOOGLE_CLIENT_ID or not config.GOOGLE_CLIENT_SECRET:
        return _not_configured()

    token_data = urllib.parse.urlencode(
        {
            "code": code,
            "client_id": config.GOOGLE_CLIENT_ID,
            "client_secret": config.GOOGLE_CLIENT_SECRET,
            "redirect_uri": _callback_url(),
            "grant_type": "authorization_code",
        }
    ).encode()
    token_req = urllib.request.Request(
        GOOGLE_TOKEN_URL, data=token_data, headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    try:
        with urllib.request.urlopen(token_req, timeout=15) as resp:
            token = json.loads(resp.read())
    except Exception:  # noqa: BLE001 - lỗi mạng/Google thì báo rõ, không lộ chi tiết
        return JSONResponse(
            status_code=502,
            content={"error": {"code": "OAUTH_TOKEN_FAILED", "message": "Không đổi được mã xác thực với Google."}},
        )
    access_token = token.get("access_token")
    if not access_token:
        return JSONResponse(
            status_code=502,
            content={"error": {"code": "OAUTH_TOKEN_FAILED", "message": "Google không trả access token."}},
        )
    info_req = urllib.request.Request(
        GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}
    )
    try:
        with urllib.request.urlopen(info_req, timeout=15) as resp:
            userinfo = json.loads(resp.read())
    except Exception:  # noqa: BLE001
        return JSONResponse(
            status_code=502,
            content={"error": {"code": "OAUTH_USERINFO_FAILED", "message": "Không lấy được thông tin người dùng từ Google."}},
        )

    google_sub = str(userinfo.get("sub", ""))
    email = str(userinfo.get("email", ""))
    if not google_sub or not email:
        return JSONResponse(
            status_code=502,
            content={"error": {"code": "OAUTH_USERINFO_FAILED", "message": "Google không trả đủ thông tin người dùng."}},
        )
    conn.execute(
        "INSERT INTO users (google_sub, email, name, picture, last_login_at) VALUES (?, ?, ?, ?, datetime('now')) "
        "ON CONFLICT(google_sub) DO UPDATE SET email=excluded.email, name=excluded.name, "
        "picture=excluded.picture, last_login_at=datetime('now')",
        (google_sub, email, userinfo.get("name"), userinfo.get("picture")),
    )
    conn.commit()

    now = datetime.datetime.now(datetime.timezone.utc)
    token_jwt = jwt.encode(
        {
            "sub": google_sub,
            "email": email,
            "iat": now,
            "exp": now + datetime.timedelta(hours=config.JWT_EXPIRE_HOURS),
        },
        config.JWT_SECRET,
        algorithm="HS256",
    )
    frontend = config.FRONTEND_ORIGINS[0] if config.FRONTEND_ORIGINS else "http://localhost:3000"
    return RedirectResponse(f"{frontend}/?auth_token={token_jwt}")
