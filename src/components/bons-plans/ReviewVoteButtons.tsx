'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

interface ReviewVoteButtonsProps {
  reviewId: string
  establishmentId: string
  helpfulCount: number
  unhelpfulCount: number
}

export default function ReviewVoteButtons({
  reviewId,
  establishmentId,
  helpfulCount: initialHelpful,
  unhelpfulCount: initialUnhelpful,
}: ReviewVoteButtonsProps) {
  const [helpful, setHelpful] = useState(initialHelpful)
  const [unhelpful, setUnhelpful] = useState(initialUnhelpful)
  const [myVote, setMyVote] = useState<boolean | null>(null) // null = no vote
  const [voting, setVoting] = useState(false)

  const handleVote = async (isHelpful: boolean) => {
    if (voting) return
    setVoting(true)

    // Optimistic update
    const prevHelpful = helpful
    const prevUnhelpful = unhelpful
    const prevVote = myVote

    if (myVote === isHelpful) {
      // Toggle off
      setMyVote(null)
      if (isHelpful) setHelpful(h => h - 1)
      else setUnhelpful(u => u - 1)
    } else if (myVote !== null) {
      // Switch vote
      setMyVote(isHelpful)
      if (isHelpful) { setHelpful(h => h + 1); setUnhelpful(u => u - 1) }
      else { setHelpful(h => h - 1); setUnhelpful(u => u + 1) }
    } else {
      // New vote
      setMyVote(isHelpful)
      if (isHelpful) setHelpful(h => h + 1)
      else setUnhelpful(u => u + 1)
    }

    try {
      const res = await fetch(`/api/establishments/${establishmentId}/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isHelpful }),
      })

      if (!res.ok) {
        // Revert on error
        setHelpful(prevHelpful)
        setUnhelpful(prevUnhelpful)
        setMyVote(prevVote)
      }
    } catch {
      setHelpful(prevHelpful)
      setUnhelpful(prevUnhelpful)
      setMyVote(prevVote)
    } finally {
      setVoting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 mr-1">Utile ?</span>
      <button
        onClick={() => handleVote(true)}
        disabled={voting}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
          myVote === true
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
        }`}
      >
        <ThumbsUp className="w-3 h-3" />
        {helpful > 0 && <span>{helpful}</span>}
      </button>
      <button
        onClick={() => handleVote(false)}
        disabled={voting}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
          myVote === false
            ? 'bg-red-500/20 text-red-400'
            : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
        }`}
      >
        <ThumbsDown className="w-3 h-3" />
        {unhelpful > 0 && <span>{unhelpful}</span>}
      </button>
    </div>
  )
}
