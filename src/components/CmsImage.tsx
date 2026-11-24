// Ảnh từ CMS (FE 24) — bọc next/image:
// - alt BẮT BUỘC (không có alt thì không render — ảnh CMS không alt là lỗi
//   nội dung, không được lấp bằng alt rỗng ở đây);
// - lazy mặc định (chỉ ảnh hero đầu trang mới priority);
// - AVIF/WebP theo cấu hình images trong next.config.ts;
// - width/height mặc định 16:9 để tránh CLS khi CMS không cho kích thước.
import Image from "next/image";

interface CmsImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function CmsImage({
  src,
  alt,
  className,
  width = 1200,
  height = 675,
  priority = false,
}: CmsImageProps) {
  if (!alt.trim()) return null;
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      sizes="(max-width: 768px) 100vw, 50vw"
      className={className}
    />
  );
}
