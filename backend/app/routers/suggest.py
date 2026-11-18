"""Gợi ý chiến dịch theo prompt (F02, F06, F07, F08)."""

import sqlite3

from fastapi import APIRouter, Depends

from .. import db, suggest as suggest_logic
from ..schemas import SuggestRequest, SuggestResponse

router = APIRouter()


@router.post("/api/suggest", response_model=SuggestResponse)
def post_suggest(payload: SuggestRequest, conn: sqlite3.Connection = Depends(db.get_conn)):
    return suggest_logic.suggest(payload.prompt, conn, payload.page, payload.pageSize)
