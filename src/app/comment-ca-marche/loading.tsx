export default function CommentCaMarcheLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 px-4">
      <div className="max-w-4xl mx-auto animate-pulse">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="h-8 bg-white/5 rounded-lg w-64 mx-auto mb-3" />
          <div className="h-4 bg-white/5 rounded w-96 max-w-full mx-auto" />
        </div>
        {/* Steps skeleton */}
        <div className="space-y-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-white/10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-white/5 rounded w-48" />
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
