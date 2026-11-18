// Thẻ bản đồ nhiệt Location Network (F04), theo đúng markup trang mẫu
// Figma (file HTML tran gửi, 18/11/2026 — view Location Network):
// thẻ trắng bo 16px p-8; tiêu đề + ghi chú + nút Drill deeper (khóa);
// lưới 10 cột, mỗi ô 26px, màu đỏ #E8212B với độ đậm theo mức 1-5
// (0.2 / 0.4 / 0.62 / 0.82 / 1), ô trống trắng mờ 0.04, hover phóng 1.25x,
// tooltip "Tên: Engagement Level N"; cột phải w-56: thang Engagement Level
// (Emerging/Active/Strong/High/Flagship) + Flagship Markets (mức >= 4).
//
// Vị trí các tỉnh trên lưới là bố cục cố định của bản đồ (lấy đúng từ HTML
// Figma: 150 ô, 10 cột × 15 hàng); mức của từng tỉnh lấy từ API backend
// (provinces.level 1-5). Tỉnh nào chưa có trong dữ liệu thì ô đó để trống.
import type { CoverageLevel, ProvinceCoverage } from "@/lib/types";

// Vị trí từng tỉnh trên lưới 10x15 (chỉ số ô 0-149), lấy từ HTML Figma.
const GRID_POSITIONS: Record<number, string> = {
  15: "Thai Nguyen",
  25: "Ha Noi",
  26: "Hai Phong",
  27: "Quang Ninh",
  34: "Thanh Hoa",
  35: "Nam Dinh",
  36: "Bac Ninh",
  44: "Nghe An",
  54: "Ha Tinh",
  55: "Hue",
  64: "Quang Binh",
  65: "Da Nang",
  75: "Quang Nam",
  76: "Binh Dinh",
  85: "Lam Dong",
  86: "Khanh Hoa",
  95: "Binh Duong",
  96: "Binh Thuan",
  104: "Tay Ninh",
  105: "Ho Chi Minh",
  106: "Bien Hoa",
  113: "Dong Thap",
  114: "Can Tho",
  115: "Tien Giang",
  116: "Vung Tau",
  122: "Kien Giang",
  123: "An Giang",
  124: "Vinh Long",
  125: "Ben Tre",
  133: "Bac Lieu",
  134: "Soc Trang",
  143: "Ca Mau",
};
const GRID_CELLS = 150;

// Độ đậm của ô theo mức (đúng HTML Figma).
const LEVEL_OPACITY: Record<CoverageLevel, number> = {
  1: 0.2,
  2: 0.4,
  3: 0.62,
  4: 0.82,
  5: 1,
};

// Thang chú giải (độ đậm trong chú giải hơi khác ô trên lưới: 0.6/0.8).
const LEGEND: { level: CoverageLevel; label: string; opacity: number }[] = [
  { level: 1, label: "Emerging", opacity: 0.2 },
  { level: 2, label: "Active", opacity: 0.4 },
  { level: 3, label: "Strong", opacity: 0.6 },
  { level: 4, label: "High", opacity: 0.8 },
  { level: 5, label: "Flagship", opacity: 1 },
];

function LockIcon({ size = 11 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function HeatmapCard({
  provinces,
  onDrillDeeper,
}: {
  provinces: ProvinceCoverage[];
  /** Khi có thì hiện nút Drill deeper (mở popup yêu cầu tài khoản advertiser). */
  onDrillDeeper?: () => void;
}) {
  const levelByProvince = new Map(provinces.map((p) => [p.province, p.level]));
  const flagship = [...provinces]
    .filter((p) => p.level >= 4)
    .sort((a, b) => b.level - a.level || a.province.localeCompare(b.province))
    .slice(0, 4);

  return (
    <div className="rounded-2xl border border-border bg-white p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">National Coverage Heatmap</h2>
          <p className="mt-1 text-sm text-muted">
            Engagement density by province across all 63 tỉnh thành
          </p>
        </div>
        {onDrillDeeper && (
          <button
            type="button"
            onClick={onDrillDeeper}
            className="flex items-center gap-1.5 rounded-lg border border-brand/20 px-3 py-2 text-xs text-brand transition-colors hover:bg-brand/5"
          >
            <LockIcon />
            Drill deeper
          </button>
        )}
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex-1 overflow-x-auto">
          <div
            className="inline-grid gap-2"
            style={{ gridTemplateColumns: "repeat(10, 1fr)" }}
            role="img"
            aria-label="Bản đồ nhiệt mức tương tác theo tỉnh thành"
          >
            {Array.from({ length: GRID_CELLS }, (_, i) => {
              const name = GRID_POSITIONS[i];
              const level = name ? levelByProvince.get(name) : undefined;
              if (!name || level === undefined) {
                return (
                  <div
                    key={i}
                    className="rounded transition-transform hover:scale-125"
                    style={{
                      width: 26,
                      height: 26,
                      backgroundColor: "rgb(255, 255, 255)",
                      opacity: 0.04,
                      cursor: "default",
                    }}
                  />
                );
              }
              return (
                <div
                  key={i}
                  title={`${name}: Engagement Level ${level}`}
                  className="rounded transition-transform hover:scale-125"
                  style={{
                    width: 26,
                    height: 26,
                    backgroundColor: "rgb(232, 33, 43)",
                    opacity: LEVEL_OPACITY[level],
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="w-56 shrink-0 space-y-5">
          <div>
            <div className="mb-2 text-xs tracking-wider text-muted/50 uppercase">
              Engagement Level
            </div>
            {LEGEND.map((row) => (
              <div key={row.level} className="mb-2 flex items-center gap-2">
                <div
                  className="rounded"
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: "rgb(232, 33, 43)",
                    opacity: row.opacity,
                  }}
                />
                <span className="text-xs text-muted">{row.label}</span>
              </div>
            ))}
          </div>
          {flagship.length > 0 && (
            <div>
              <div className="mb-2 text-xs tracking-wider text-muted/50 uppercase">
                Flagship Markets
              </div>
              {flagship.map((p) => (
                <div
                  key={p.province}
                  className="flex items-center justify-between border-b border-border py-1.5"
                >
                  <span className="text-xs text-muted">{p.province}</span>
                  <span className="text-xs font-bold text-brand">L{p.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
