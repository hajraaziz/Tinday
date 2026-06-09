import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-[#151515] px-6 text-center">
      <p className="text-6xl font-semibold text-[#8478D4] font-[family-name:var(--font-display)]">
        404
      </p>
      <div>
        <h1 className="text-xl font-semibold text-white">Page not found</h1>
        <p className="text-sm text-[#9CA3AF] mt-1 max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <Link
        href="/explore"
        className="inline-flex items-center rounded-md bg-[#8478D4] text-white text-sm font-medium px-4 py-2.5 hover:bg-[#9488e0] transition-colors"
      >
        Back to Explore
      </Link>
    </div>
  );
}
