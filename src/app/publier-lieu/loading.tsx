export default function PublierLieuLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 px-4">
      <div className="max-w-3xl mx-auto animate-pulse">
        {/* Header */}
        <div className="h-8 bg-white/5 rounded-lg w-64 mb-3" />
        <div className="h-4 bg-white/5 rounded w-96 max-w-full mb-8" />
        {/* Form skeleton */}
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-white/5 rounded w-24" />
              <div className="h-12 bg-white/5 rounded-xl" />
            </div>
          ))}
          <div className="h-32 bg-white/5 rounded-xl" />
          <div className="h-12 bg-white/10 rounded-xl w-40" />
        </div>
      </div>
    </div>
  );
}
