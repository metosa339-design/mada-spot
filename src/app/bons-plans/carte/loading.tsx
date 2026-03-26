export default function CarteLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 animate-pulse">
          <div className="h-8 bg-white/5 rounded-lg w-60 mb-3" />
          <div className="h-4 bg-white/5 rounded w-72 max-w-full" />
        </div>
        <div className="flex gap-3 mb-6 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-full w-24 flex-shrink-0 animate-pulse" />
          ))}
        </div>
        <div className="h-[500px] bg-white/5 rounded-2xl animate-pulse border border-white/10" />
      </div>
    </div>
  );
}
