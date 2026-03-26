export const EVENT_CATEGORIES = [
  { value: 'FESTIVAL', label: 'Festival', icon: 'Music', color: 'pink' },
  { value: 'CULTURAL', label: 'Culturel', icon: 'Landmark', color: 'purple' },
  { value: 'SPORT', label: 'Sport', icon: 'Trophy', color: 'green' },
  { value: 'NATURE', label: 'Nature', icon: 'TreePine', color: 'emerald' },
  { value: 'MARKET', label: 'Marché', icon: 'ShoppingBag', color: 'amber' },
  { value: 'OTHER', label: 'Autre', icon: 'Calendar', color: 'gray' },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  FESTIVAL: 'pink',
  CULTURAL: 'purple',
  SPORT: 'green',
  NATURE: 'emerald',
  MARKET: 'amber',
  OTHER: 'gray',
};
