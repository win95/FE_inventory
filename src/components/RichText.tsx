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
  for (const para of text.split(/\n\s*\n/)) {
    const line = para.trim();
    const m = /^(#{1,3})\s+(.+)$/.exec(line);
    if (m) out.push({ id: headingId(m[2]), level: m[1].length, text: m[2].trim() });
  }
  return out;
}

export default function RichText({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="max-w-3xl space-y-4 text-base leading-7 text-ink">
      {text.split(/\n\s*\n/).map((para, i) => {
        const line = para.trim();
        const m = /^(#{1,3})\s+(.+)$/.exec(line);
        if (m) {
          const id = headingId(m[2]);
          return (
            <h2 key={i} id={id} className="scroll-mt-24 pt-4 font-display text-2xl font-bold text-ink">
              {m[2].trim()}
            </h2>
          );
        }
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}
