// Chi tiết sự kiện (R1-4, FE 36): thông tin + chương trình + diễn giả +
// form đăng ký (BE 15, chỉ khi sự kiện chưa diễn ra) + schema Event.
// Sự kiện đã qua chỉ hiện ghi chú + chương trình (seed R1 chưa có recap
// slides/video nên không có khối recap).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui";
import EventRegistrationForm from "@/components/EventRegistrationForm";
import ShareButtons from "@/components/ShareButtons";
import RichText from "@/components/RichText";
import { fetchEventBySlug } from "@/lib/strapi";
import { translate, withLocale, type DictKey, type Locale } from "@/lib/i18n";
import { localizedUrl, pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { nowMs } from "@/lib/format";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const item = await fetchEventBySlug(loc, slug).catch(() => null);
  if (!item) return pageMetadata({ locale: loc, path: `/events/${slug}`, title: "AWING", description: "" });
  return pageMetadata({ locale: loc, path: `/events/${slug}`, title: `${item.title} — AWING`, description: item.summary });
}

const MODE_LABEL: Record<string, DictKey> = { online: "events.modeOnline", offline: "events.modeOffline", hybrid: "events.modeHybrid" };

export default async function EventDetailPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  await connection();
  const item = await fetchEventBySlug(loc, slug);
  if (!item) notFound();

  const start = item.startDate ? new Date(item.startDate).getTime() : 0;
  const upcoming = start >= nowMs();
  const modeLabel = item.mode ? translate(loc, MODE_LABEL[item.mode] ?? "events.modeOffline") : "";

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: item.title,
            description: item.summary,
            startDate: item.startDate ?? undefined,
            endDate: item.endDate ?? undefined,
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode:
              item.mode === "online"
                ? "https://schema.org/OnlineEventAttendanceMode"
                : item.mode === "hybrid"
                  ? "https://schema.org/MixedEventAttendanceMode"
                  : "https://schema.org/OfflineEventAttendanceMode",
            location: item.location ? { "@type": "Place", name: item.location } : undefined,
            organizer: { "@type": "Organization", name: "AWING" },
          }),
        }}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Breadcrumb
          items={[
            { label: translate(loc, "footer.home"), href: withLocale("/", loc) },
            { label: translate(loc, "events.title"), href: withLocale("/events", loc) },
            { label: item.title },
          ]}
        />
        <div className="mx-auto max-w-3xl py-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            {[modeLabel, item.location].filter(Boolean).join(" · ")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-black leading-tight text-ink sm:text-4xl">{item.title}</h1>
          <dl className="mt-4 space-y-1 text-sm text-muted">
            <div className="flex gap-2">
              <dt className="font-semibold text-ink">{translate(loc, "event.dateLabel")}:</dt>
              <dd>
                {formatDate(item.startDate, loc)}
                {item.endDate && item.endDate.slice(0, 10) !== item.startDate?.slice(0, 10) ? ` — ${formatDate(item.endDate, loc)}` : ""}
              </dd>
            </div>
            {item.location && (
              <div className="flex gap-2">
                <dt className="font-semibold text-ink">{translate(loc, "event.locationLabel")}:</dt>
                <dd>{item.location}</dd>
              </div>
            )}
          </dl>
          <div className="mt-5">
            <ShareButtons title={item.title} url={localizedUrl(loc, `/events/${slug}`)} />
          </div>
          <div className="mt-8">
            <RichText text={item.content} />
          </div>

          {item.agenda.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold text-ink">{translate(loc, "event.agendaTitle")}</h2>
              <ol className="mt-4 space-y-3">
                {item.agenda.map((a, i) => (
                  <li key={i} className="flex gap-4 rounded-xl border border-border bg-white px-4 py-3">
                    <span className="w-14 shrink-0 font-mono text-sm font-semibold text-brand">{a.time}</span>
                    <span className="text-sm text-ink">{a.title}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {item.speakers.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold text-ink">{translate(loc, "event.speakersTitle")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {item.speakers.map((sp, i) => (
                  <div key={i} className="rounded-xl border border-border bg-white p-4">
                    <p className="font-semibold text-ink">{sp.name}</p>
                    <p className="text-sm text-muted">
                      {[sp.role, sp.company].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-10">
            {upcoming ? (
              <EventRegistrationForm slug={slug} title={item.title} startDate={item.startDate} endDate={item.endDate} />
            ) : (
              <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">{translate(loc, "event.pastNote")}</p>
            )}
          </div>
          <div className="mt-8">
            <Link href={withLocale("/events", loc)} className="text-sm font-medium text-brand hover:underline">
              ← {translate(loc, "events.backToList")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
