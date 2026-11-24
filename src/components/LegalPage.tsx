// Mẫu trang pháp lý T.Page (FE 41): tiêu đề + các đoạn văn ngắn.
// Nội dung là bản tóm tắt R1 (khóa legal.*) — văn bản pháp lý đầy đủ do
// đội AWING ban hành sau.
import { Breadcrumb } from "./ui";
import { translate, withLocale, type DictKey, type Locale } from "@/lib/i18n";

export default function LegalPage({ locale, titleKey, paragraphs }: { locale: Locale; titleKey: DictKey; paragraphs: DictKey[] }) {
  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Breadcrumb items={[{ label: translate(locale, "footer.home"), href: withLocale("/", locale) }, { label: translate(locale, titleKey) }]} />
        <article className="mx-auto max-w-3xl py-8">
          <h1 className="font-display text-3xl font-black text-ink sm:text-4xl">{translate(locale, titleKey)}</h1>
          <div className="mt-6 space-y-4 text-base leading-7 text-muted">
            {paragraphs.map((k) => (
              <p key={k}>{translate(locale, k)}</p>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
