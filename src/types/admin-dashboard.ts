export interface AdminKPIs {
  totalUsers: number;
  newUsers: number;
  usersTrend: number;
  totalEstablishments: number;
  newEstablishments: number;
  establishmentsTrend: number;
  totalBookings: number;
  newBookings: number;
  bookingsTrend: number;
  totalMessages: number;
  newMessages: number;
  messagesTrend: number;
  totalViews: number;
  newViews: number;
  viewsTrend: number;
  totalReviews: number;
  newReviews: number;
  reviewsTrend: number;
  averageRating: number;
}

export interface EstablishmentBreakdownItem {
  type: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER';
  count: number;
}

export interface ModerationQueue {
  pendingEstablishments: number;
  pendingClaims: number;
  flaggedReviews: number;
  pendingBookings: number;
  total: number;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface UserGrowthByTypePoint {
  date: string;
  CLIENT: number;
  HOTEL: number;
  RESTAURANT: number;
  ATTRACTION: number;
  PROVIDER: number;
}

export interface TopEstablishment {
  id: string;
  name: string;
  type: string;
  city: string;
  viewCount: number;
  rating: number;
  bookingCount: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

export interface AdminStatsResponse {
  kpis: AdminKPIs;
  establishmentBreakdown: EstablishmentBreakdownItem[];
  moderationQueue: ModerationQueue;
  charts: {
    userGrowth: ChartDataPoint[];
    bookingTrend: ChartDataPoint[];
    userGrowthByType: UserGrowthByTypePoint[];
    messageTrend: ChartDataPoint[];
  };
  topEstablishments: TopEstablishment[];
  recentActivity: ActivityItem[];
}
