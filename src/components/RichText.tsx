// Render richtext Strapi v5 (validate dạng string, các đoạn cách nhau bằng
// dòng trống) + mục lục tự động từ tiêu đề dòng (FE 34).
// Nội dung seed R1 chỉ có đoạn văn nên mục lục thường trống — tiêu đề chỉ
// xuất hiện khi biên tập viên viết dòng bắt đầu bằng "## " trong Strapi.
export interface Heading {
  id: string;
  level: number;
  text: string;
}

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractHeadings(text: string): Heading[] {
  if (!text) return [];
  const out: Heading[] = [];
  const seen = new Map<string, number>();
  for (const para of text.split(/\n\s*\n/)) {
    const line = para.trim();
    const m = /^(#{1,3})\s+(.+)$/.exec(line);
    if (!m) continue;
    const base = headingId(m[2]);
    // Hai heading trùng tên thì id phải khác nhau (không trùng id trong DOM).
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    out.push({ id: n === 1 ? base : `${base}-${n}`, level: m[1].length, text: m[2].trim() });
  }
  return out;
}

export default function RichText({ text }: { text: string }) {
  if (!text) return null;
  const headings = extractHeadings(text);
  let headingIndex = 0;
  return (
    <div className="max-w-3xl space-y-4 text-base leading-7 text-ink">
      {text.split(/\n\s*\n/).map((para, i) => {
        const line = para.trim();
        const m = /^(#{1,3})\s+(.+)$/.exec(line);
        if (m) {
          // Giữ đúng thứ bậc heading (# → h1, ## → h2, ### → h3) thay vì
          // render mọi cấp thành h2; id lấy từ extractHeadings để khớp mục lục.
          const heading = headings[headingIndex++];
          const Tag = `h${m[1].length}` as "h1" | "h2" | "h3";
          const size =
            m[1].length === 1
              ? "pt-4 font-display text-3xl font-black text-ink"
              : m[1].length === 2
                ? "pt-4 font-display text-2xl font-bold text-ink"
                : "pt-4 font-display text-xl font-bold text-ink";
          return (
            <Tag key={i} id={heading?.id} className={`scroll-mt-24 ${size}`}>
              {m[2].trim()}
            </Tag>
          );
        }
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}
