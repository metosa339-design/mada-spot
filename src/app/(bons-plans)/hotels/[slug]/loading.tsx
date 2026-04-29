export default function HotelDetailLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero image skeleton */}
      <div className="relative h-[50vh] bg-white/5 animate-pulse" />

      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10">
        {/* Title card skeleton */}
        <div className="bg-[#12121a] rounded-2xl p-6 mb-6 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-6 bg-white/10 rounded-full w-24" />
            <div className="h-6 bg-white/10 rounded-full w-16" />
          </div>
          <div className="h-8 bg-white/10 rounded w-2/3 mb-3" />
          <div className="h-4 bg-white/5 rounded w-full mb-2" />
          <div className="h-4 bg-white/5 rounded w-3/4" />
        </div>

        {/* Info cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#12121a] rounded-2xl p-6 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>

        {/* Rooms section skeleton */}
        <div className="bg-[#12121a] rounded-2xl p-6 animate-pulse">
          <div className="h-6 bg-white/10 rounded w-32 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
