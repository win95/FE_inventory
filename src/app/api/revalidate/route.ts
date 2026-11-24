// POST /api/revalidate — webhook publish/unpublish Strapi (FE 5, BE 8).
//
// Luồng: Strapi publish → webhook sang FastAPI /api/webhooks/strapi →
// FastAPI gọi endpoint này với { secret, tag } (tag theo quy ước
// `strapi:<collection>`, vd "strapi:case-studies"). Không trỏ thẳng
// webhook Strapi vào đây vì payload Strapi không có secret/tag dạng này.
// Revalidate tag với { expire: 0 } để nội dung cũ hết ngay (theo doc
// revalidateTag của Next 16: webhook ngoài Server Action thì dùng expire 0).
// REVALIDATE_SECRET để trống → 503 (không mở revalidate cho ai cũng gọi).
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ error: "REVALIDATE_SECRET chưa cấu hình" }, { status: 503 });
  }
  let body: { secret?: string; tag?: string; path?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Body phải là JSON" }, { status: 400 });
  }
  if (body.secret !== secret) {
    return Response.json({ error: "Sai secret" }, { status: 401 });
  }
  if (body.tag) revalidateTag(body.tag, { expire: 0 });
  if (body.path) revalidatePath(body.path);
  if (!body.tag && !body.path) {
    return Response.json({ error: "Thiếu tag hoặc path" }, { status: 400 });
  }
  return Response.json({
    revalidated: true,
    tag: body.tag ?? null,
    path: body.path ?? null,
    now: Date.now(),
  });
}
