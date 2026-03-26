'use client'

import { motion } from 'framer-motion'
import { Check, CheckCheck } from 'lucide-react'
import type { ChatMessage } from './types'

function renderContent(content: string) {
  const imageMatch = content.match(/\[IMAGE\](.*?)\[\/IMAGE\]/)
  if (imageMatch) {
    const imgSrc = imageMatch[1]
    const text = content.replace(/\[IMAGE\].*?\[\/IMAGE\]\n?/, '').trim()
    return (
      <>
        <img src={imgSrc} alt="Photo" className="rounded-lg max-w-full max-h-60 mb-1 cursor-pointer" onClick={() => window.open(imgSrc, '_blank')} />
        {text && <p className="text-sm whitespace-pre-wrap break-words">{text}</p>}
      </>
    )
  }
  return <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
}

interface MessageBubbleProps {
  message: ChatMessage
  isMe: boolean
  index: number
}

export function MessageBubble({ message, isMe, index }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
        isMe
          ? 'bg-[#ff6b35] text-white rounded-br-md'
          : 'bg-white/5 text-gray-200 rounded-bl-md'
      }`}>
        {renderContent(message.content)}
        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
          <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-gray-500'}`}>
            {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isMe && (
            message.readAt ? (
              <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
            ) : (
              <Check className="w-3 h-3 text-white/50" />
            )
          )}
        </div>
      </div>
    </motion.div>
  )
}
