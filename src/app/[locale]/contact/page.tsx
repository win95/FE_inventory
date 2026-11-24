// Trang Contact Us (F15 + CONT.01, R1-5): form liên hệ (theo mẫu chính
// thức của AWING, kiểm tra trực tiếp ngày 18/11/2026) + thông tin văn phòng
// + bản đồ trụ sở Hà Nội (Google Maps embed, không cần API key) + link
// mạng xã hội từ single Global (FE 48) + form lead nhúng (LeadForm,
// source="contact"). Trang thành server component để đọc Global từ Strapi.
import { connection } from "next/server";
import ContactForm from "@/components/ContactForm";
import ContactInfo from "@/components/ContactInfo";
import LeadForm from "@/components/LeadForm";
import { translate, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { fetchGlobal } from "@/lib/strapi";

export const instant = false;

// Tòa VCCI, 9 Đào Duy Anh, Hà Nội — địa chỉ trụ sở đã xác minh (ContactInfo).
const HQ_MAP_QUERY = "Tòa VCCI, 9 Đào Duy Anh, Hà Nội";
const HQ_MAP_URL = `https://www.google.com/maps?q=${encodeURIComponent(HQ_MAP_QUERY)}&output=embed`;

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  zalo: "Zalo OA",
  tiktok: "TikTok",
};

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  return pageMetadata({
    locale: loc,
    path: "/contact",
    title: translate(loc, "contactPage.title"),
    description: translate(loc, "contactPage.subtitle"),
  });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  await connection();
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const global = await fetchGlobal(loc).catch(() => null);
  const socials = global?.socialLinks ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {translate(loc, "contactPage.title")}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">{translate(loc, "contactPage.subtitle")}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <ContactForm />

        <aside aria-label={translate(loc, "contactPage.asideTitle")}>
          <h2 className="text-lg font-semibold text-ink">{translate(loc, "contactPage.asideTitle")}</h2>
          <div className="mt-4">
            <ContactInfo />
          </div>

          <h3 className="mt-8 text-base font-semibold text-ink">{translate(loc, "contactPage.mapTitle")}</h3>
          <iframe
            title={translate(loc, "contactPage.mapTitle")}
            src={HQ_MAP_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="mt-3 h-64 w-full rounded-2xl border border-border"
          />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(HQ_MAP_QUERY)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-brand hover:underline"
          >
            {translate(loc, "contactPage.openMap")}
          </a>

          {socials.length > 0 && (
            <>
              <h3 className="mt-8 text-base font-semibold text-ink">{translate(loc, "contactPage.socialTitle")}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:border-brand hover:text-brand"
                  >
                    {SOCIAL_LABELS[s.platform] ?? s.platform}
                  </a>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>

      <section aria-labelledby="contact-lead-title" className="mt-14 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 id="contact-lead-title" className="text-xl font-bold text-ink">
          {translate(loc, "contactPage.leadTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">{translate(loc, "contactPage.leadBody")}</p>
        <div className="mt-6 max-w-2xl">
          <LeadForm mode="embedded" source="contact" />
        </div>
      </section>
    </main>
  );
}
