export interface Thread {
  id: string
  participantId: string
  participantName: string
  participantAvatar?: string | null
  establishmentId?: string | null
  establishmentName?: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

export interface ChatMessage {
  id: string
  senderId: string
  content: string
  isRead: boolean
  readAt?: string | null
  createdAt: string
}

export interface PresenceState {
  online: boolean
  typing: boolean
  lastSeen: string | null
}
