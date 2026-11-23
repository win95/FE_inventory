// Lỗi API dùng chung cho cả hai client của Frontend (FastAPI + Strapi).
// Tách riêng để src/lib/api.ts và src/lib/strapi.ts đều dùng được mà không
// import vòng nhau; @/lib/api re-export lại nên code cũ không đổi import.
// `code` là mã lỗi của backend (vd. OTP_WRONG) + `details` mang dữ liệu kèm
// (vd. { attemptsLeft }) — có từ R1-2 để màn OTP hiện số lần thử còn lại.
// Code cũ chỉ dùng message/status nên thêm 2 trường tùy chọn này không vỡ.
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
