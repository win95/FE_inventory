export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Dự án mới
      </h1>
      <p className="max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
        Khung Frontend đã sẵn sàng: Next.js + TypeScript + Tailwind CSS.
        Chờ brief để bắt đầu làm màn hình đầu tiên.
      </p>
    </main>
  );
}
