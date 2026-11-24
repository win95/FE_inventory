// Kiểm tra tự động bảng 301 (FE 13) — đọc redirects.json, fetch từng URL cũ
// với redirect manual, yêu cầu đúng mã vĩnh viễn + Location đúng đích.
// Lưu ý: Next.js trả 308 (Permanent Redirect) cho permanent: true —
// Google coi 308 tương đương 301, nên chấp nhận cả 301 và 308.
// Chạy: npm run test:redirects [baseUrl] (mặc định http://localhost:3100).
import { readFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3100";
const { redirects } = JSON.parse(readFileSync(new URL("../redirects.json", import.meta.url), "utf8"));

let fail = 0;
for (const r of redirects) {
  const res = await fetch(base + r.source, { redirect: "manual" });
  const loc = res.headers.get("location");
  const ok = (res.status === 301 || res.status === 308) && loc === r.destination;
  console.log(`${ok ? "OK  " : "FAIL"} ${r.source} -> ${res.status} ${loc ?? "(no location)"} (expect 301/308 ${r.destination})`);
  if (!ok) fail++;
}
if (fail > 0) {
  console.error(`${fail}/${redirects.length} redirect(s) failed`);
  process.exit(1);
}
console.log(`${redirects.length}/${redirects.length} redirect(s) OK`);
