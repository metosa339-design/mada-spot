export default function RestaurantsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-white/5 rounded-lg w-52 mb-3" />
          <div className="h-4 bg-white/5 rounded w-72 max-w-full" />
        </div>
        <div className="flex gap-3 mb-8 overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-full w-24 flex-shrink-0 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white/5 animate-pulse">
              <div className="h-48 bg-white/10" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-white/10 rounded w-2/3" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
                <div className="h-4 bg-white/5 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
