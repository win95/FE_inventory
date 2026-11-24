// Health check (FE 14) — GET /api/health → 200 { status: "ok", ... }.
// Dùng cho uptime monitor / Compose healthcheck. Không kiểm tra DB hay
// backend ở đây: endpoint này phải trả lời được ngay cả khi backend chết
// (để phân biệt frontend chết hay backend chết).
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
}
