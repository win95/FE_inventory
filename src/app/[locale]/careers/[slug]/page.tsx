// Chi tiết vị trí (R1-4, FE 43): mô tả + yêu cầu + schema JobPosting +
// form nộp CV (BE 16). Vị trí hết hạn vẫn mở được qua link trực tiếp nhưng
// form hiện ghi chú hết hạn thay vì nhận hồ sơ mới.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui";
import CvApplicationForm from "@/components/CvApplicationForm";
import RichText from "@/components/RichText";
import { fetchJobBySlug } from "@/lib/strapi";
import { translate, withLocale, type DictKey, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { formatDate, todayIso } from "@/lib/format";


export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const item = await fetchJobBySlug(loc, slug, "force-cache").catch(() => null);
  if (!item) return pageMetadata({ locale: loc, path: `/careers/${slug}`, title: "AWING", description: "" });
  return pageMetadata({ locale: loc, path: `/careers/${slug}`, title: `${item.title} — AWING`, description: item.description.split(/\n\s*\n/)[0] ?? "" });
}

const TYPE_LABEL: Record<string, DictKey> = { "full-time": "jobs.typeFullTime", contract: "jobs.typeContract", internship: "jobs.typeInternship" };

export default async function JobDetailPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const loc = (locale === "en" ? "en" : "vi") as Locale;
  const item = await fetchJobBySlug(loc, slug, "force-cache");
  if (!item) notFound();

  const today = todayIso();
  const expired = Boolean(item.deadline) && item.deadline! < today;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            title: item.title,
            description: item.description,
            // datePosted phải là ngày đăng tin thật — Job chưa có trường đó
            // nên bỏ khỏi schema (gán bằng deadline là ngày tương lai,
            // Google có thể flag JobPosting không hợp lệ).
            validThrough: item.deadline ?? undefined,
            employmentType: item.type === "full-time" ? "FULL_TIME" : item.type === "contract" ? "CONTRACTOR" : "INTERN",
            hiringOrganization: { "@type": "Organization", name: "AWING" },
            jobLocation: { "@type": "Place", address: item.location },
          }),
        }}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Breadcrumb
          items={[
            { label: translate(loc, "footer.home"), href: withLocale("/", loc) },
            { label: translate(loc, "jobs.title"), href: withLocale("/careers", loc) },
            { label: item.title },
          ]}
        />
        <div className="mx-auto max-w-3xl py-8">
          <h1 className="font-display text-3xl font-black leading-tight text-ink sm:text-4xl">{item.title}</h1>
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            <div className="flex gap-2">
              <dt className="font-semibold text-ink">{translate(loc, "jobs.departmentLabel")}:</dt>
              <dd>{item.department}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold text-ink">{translate(loc, "jobs.locationLabel")}:</dt>
              <dd>{item.location}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold text-ink">{translate(loc, "jobs.typeLabel")}:</dt>
              {/* Type lạ thì hiện đúng giá trị gốc, không đoán thành full-time. */}
              <dd>{TYPE_LABEL[item.type] ? translate(loc, TYPE_LABEL[item.type]) : item.type}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold text-ink">{translate(loc, "jobs.deadlineLabel")}:</dt>
              <dd>{formatDate(item.deadline, loc)}</dd>
            </div>
          </dl>

          <div className="mt-8">
            <RichText text={item.description} />
          </div>

          {item.requirements && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold text-ink">{translate(loc, "jobs.requirementsTitle")}</h2>
              <div className="mt-4">
                <RichText text={item.requirements} />
              </div>
            </section>
          )}

          <div className="mt-10">
            {expired ? (
              <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">{translate(loc, "jobs.expired")}</p>
            ) : (
              <CvApplicationForm slug={slug} />
            )}
          </div>
          <div className="mt-8">
            <Link href={withLocale("/careers", loc)} className="text-sm font-medium text-brand hover:underline">
              ← {translate(loc, "jobs.backToList")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
