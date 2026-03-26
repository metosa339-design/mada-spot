// Types pour le Dashboard Pro Multi-Tenant

export type UserType = 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER'

export interface DashboardUser {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  role: string
  avatar?: string | null
  userType?: UserType | null
  clientProfile?: {
    id: string
    city?: string | null
    companyName?: string | null
    nif?: string | null
    stat?: string | null
  } | null
}

export interface DashboardStats {
  totalViews: number
  viewsTrend: number // % change
  totalBookings: number
  bookingsTrend: number
  totalRevenue: number
  revenueTrend: number
  averageRating: number
  ratingTrend: number
  totalReviews: number
  unreadMessages: number
  todayBookings: number
  pendingBookings: number // Réservations en attente de validation
  ctr: number // Click-through rate
  // Hotel-specific
  occupancyRate?: number // (nuits réservées / (chambres * jours du mois)) * 100
  monthlyRevenue?: number // Revenus du mois en cours
  monthlyRevenueChange?: number // % change vs mois précédent
  monthlyBookingsCount?: number
  monthlyBookingsChange?: number
  avgResponseTimeHours?: number // Temps moyen entre createdAt et confirmedAt
}

export interface TodayArrival {
  guestName: string
  guestCount: number
  reference: string
  roomTypeName: string | null
  checkIn: string
  checkOut: string | null
  status: string
}

export interface PendingBookingItem {
  id: string
  guestName: string
  guestPhone: string | null
  guestCount: number
  checkIn: string
  checkOut: string | null
  reference: string
  totalPrice: number | null
  roomTypeName: string | null
  createdAt: string
}

export interface BookingItem {
  id: string
  reference: string
  guestName: string
  guestPhone?: string | null
  checkIn: string
  checkOut?: string | null
  guestCount: number
  status: string
  totalPrice?: number | null
  bookingType: string
  establishment: {
    name: string
    type: string
  }
  createdAt: string
}

export interface MessageThread {
  id: string
  participantId: string
  participantName: string
  participantAvatar?: string | null
  establishmentName?: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

export interface MessageItem {
  id: string
  senderId: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface ReviewItem {
  id: string
  authorName: string | null
  rating: number
  title: string | null
  comment: string
  ownerResponse: string | null
  respondedAt: string | null
  isFlagged: boolean
  flagReason: string | null
  createdAt: string
  establishment: {
    name: string
    coverImage: string | null
  }
}

export interface QuickReplyItem {
  id: string
  title: string
  content: string
}

export interface EstablishmentItem {
  id: string
  name: string
  slug: string
  type: string
  coverImage: string | null
  city: string
  rating: number
  reviewCount: number
  viewCount: number
  isActive: boolean
  moderationStatus: string
}

export interface SidebarItem {
  icon: string
  label: string
  href: string
  badge?: number
  userTypes?: UserType[] // Si vide = visible pour tous
}

export interface SeasonalPricingItem {
  id: string
  name: string
  startDate: string
  endDate: string
  priceMultiplier: number
  priceMultipliers: Record<string, number> | null
  isActive: boolean
}

export interface AvailabilityDay {
  date: string
  isBlocked: boolean
  roomsAvailable?: number | null
  tablesAvailable?: number | null
  spotsAvailable?: number | null
  bookingCount: number
  note?: string | null
}
