'use client';

import { motion } from 'framer-motion';
import {
  Search,
  Heart,
  MessageCircle,
  Star,
  Image as ImageIcon,
  FileText,
  Bell,
  ShoppingBag,
  Users,
  Briefcase,
  LucideIcon
} from 'lucide-react';

interface EmptyStateProps {
  type: 'search' | 'favorites' | 'messages' | 'reviews' | 'portfolio' | 'requests' | 'notifications' | 'orders' | 'providers' | 'services';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const emptyStateConfig: Record<string, { icon: LucideIcon; defaultTitle: string; defaultDescription: string; color: string; bgColor: string }> = {
  search: {
    icon: Search,
    defaultTitle: 'Aucun résultat trouvé',
    defaultDescription: 'Essayez de modifier vos critères de recherche',
    color: 'text-slate-400',
    bgColor: 'bg-slate-100',
  },
  favorites: {
    icon: Heart,
    defaultTitle: 'Pas encore de favoris',
    defaultDescription: 'Ajoutez des établissements à vos favoris pour les retrouver facilement',
    color: 'text-rose-400',
    bgColor: 'bg-rose-50',
  },
  messages: {
    icon: MessageCircle,
    defaultTitle: 'Aucun message',
    defaultDescription: 'Commencez une conversation avec un établissement',
    color: 'text-blue-400',
    bgColor: 'bg-blue-50',
  },
  reviews: {
    icon: Star,
    defaultTitle: 'Pas encore d\'avis',
    defaultDescription: 'Soyez le premier à laisser un avis !',
    color: 'text-amber-400',
    bgColor: 'bg-amber-50',
  },
  portfolio: {
    icon: ImageIcon,
    defaultTitle: 'Portfolio vide',
    defaultDescription: 'Ajoutez vos réalisations pour attirer plus de clients',
    color: 'text-purple-400',
    bgColor: 'bg-purple-50',
  },
  requests: {
    icon: FileText,
    defaultTitle: 'Aucune demande',
    defaultDescription: 'Les demandes de service apparaîtront ici',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-50',
  },
  notifications: {
    icon: Bell,
    defaultTitle: 'Pas de notifications',
    defaultDescription: 'Vous êtes à jour !',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-50',
  },
  orders: {
    icon: ShoppingBag,
    defaultTitle: 'Aucune commande',
    defaultDescription: 'Vos commandes apparaîtront ici',
    color: 'text-teal-400',
    bgColor: 'bg-teal-50',
  },
  providers: {
    icon: Users,
    defaultTitle: 'Aucun établissement',
    defaultDescription: 'Aucun établissement ne correspond à vos critères',
    color: 'text-orange-400',
    bgColor: 'bg-orange-50',
  },
  services: {
    icon: Briefcase,
    defaultTitle: 'Aucun service',
    defaultDescription: 'Ajoutez vos services pour commencer',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-50',
  },
};

export default function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="empty-state py-12"
    >
      {/* Illustration animée */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className={`w-24 h-24 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 relative`}
      >
        <Icon className={`w-12 h-12 ${config.color}`} />

        {/* Cercles décoratifs animés */}
        <motion.div
          className={`absolute inset-0 rounded-full border-2 ${config.color.replace('text-', 'border-')} opacity-20`}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className={`absolute inset-0 rounded-full border-2 ${config.color.replace('text-', 'border-')} opacity-20`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
      </motion.div>

      {/* Texte */}
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        {title || config.defaultTitle}
      </h3>
      <p className="text-slate-500 mb-6 max-w-sm mx-auto">
        {description || config.defaultDescription}
      </p>

      {/* Action */}
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-xl hover:shadow-lg transition-all"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
