"""Lead form (F12) và Contact Us (F15) — ghi vào SQLite."""

import sqlite3

from fastapi import APIRouter, Depends

from .. import db
from ..schemas import ContactPayload, LeadPayload

router = APIRouter()


@router.post("/api/leads", status_code=201)
def post_lead(payload: LeadPayload, conn: sqlite3.Connection = Depends(db.get_conn)):
    conn.execute(
        "INSERT INTO leads (name, email, phone, message) VALUES (?, ?, ?, ?)",
        (payload.name, payload.email, payload.phone, payload.message),
    )
    conn.commit()
    return {"ok": True}


@router.post("/api/contact", status_code=201)
def post_contact(payload: ContactPayload, conn: sqlite3.Connection = Depends(db.get_conn)):
    conn.execute(
        "INSERT INTO contact_messages (type, name, email, phone, message) VALUES (?, ?, ?, ?, ?)",
        (payload.type, payload.name, payload.email, payload.phone, payload.message),
    )
    conn.commit()
    return {"ok": True}
