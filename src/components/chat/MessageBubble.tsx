'use client'

import { motion } from 'framer-motion'
import { Check, CheckCheck, FileText, Download } from 'lucide-react'
import type { ChatMessage } from './types'

function renderContent(content: string) {
  // Image
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

  // Video
  const videoMatch = content.match(/\[VIDEO\](.*?)\[\/VIDEO\]/)
  if (videoMatch) {
    const videoSrc = videoMatch[1]
    const text = content.replace(/\[VIDEO\].*?\[\/VIDEO\]\n?/, '').trim()
    return (
      <>
        <video src={videoSrc} controls className="rounded-lg max-w-full max-h-60 mb-1" preload="metadata" />
        {text && <p className="text-sm whitespace-pre-wrap break-words">{text}</p>}
      </>
    )
  }

  // Audio / Voice message
  const audioMatch = content.match(/\[AUDIO\](.*?)\[\/AUDIO\]/)
  if (audioMatch) {
    const audioSrc = audioMatch[1]
    const text = content.replace(/\[AUDIO\].*?\[\/AUDIO\]\n?/, '').trim()
    return (
      <>
        <div className="flex items-center gap-2 min-w-[200px]">
          <div className="flex-1">
            <audio src={audioSrc} controls className="w-full h-8" preload="metadata" style={{ filter: 'invert(1) hue-rotate(180deg)', mixBlendMode: 'screen' }} />
          </div>
        </div>
        {text && <p className="text-sm whitespace-pre-wrap break-words mt-1">{text}</p>}
      </>
    )
  }

  // File / PDF
  const fileMatch = content.match(/\[FILE\](.*?)\[\/FILE\]/)
  if (fileMatch) {
    const fileSrc = fileMatch[1]
    const fileName = fileSrc.split('/').pop() || 'document'
    const text = content.replace(/\[FILE\].*?\[\/FILE\]\n?/, '').trim()
    return (
      <>
        <a href={fileSrc} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/20 hover:bg-black/30 transition-colors min-w-[200px]">
          <FileText className="w-8 h-8 flex-shrink-0 text-red-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-[10px] opacity-60">PDF</p>
          </div>
          <Download className="w-4 h-4 flex-shrink-0 opacity-60" />
        </a>
        {text && <p className="text-sm whitespace-pre-wrap break-words mt-1">{text}</p>}
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
