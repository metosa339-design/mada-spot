export default function EstablishmentLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 px-4">
      <div className="max-w-4xl mx-auto animate-pulse">
        {/* Cover skeleton */}
        <div className="h-64 bg-white/5 rounded-2xl mb-6" />
        {/* Title */}
        <div className="h-8 bg-white/5 rounded-lg w-72 mb-4" />
        <div className="h-4 bg-white/5 rounded w-48 mb-8" />
        {/* Content blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-4 bg-white/5 rounded w-5/6" />
            <div className="h-4 bg-white/5 rounded w-4/6" />
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-white/5 rounded-xl" />
            <div className="h-24 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
