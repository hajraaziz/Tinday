export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#151515]">
      <div className="w-8 h-8 rounded-full border-2 border-[rgba(132,120,212,0.2)] border-t-[#8478D4] animate-spin" />
    </div>
  );
}
