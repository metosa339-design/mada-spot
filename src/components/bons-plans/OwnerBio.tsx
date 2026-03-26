'use client';

import { motion } from 'framer-motion';
import { UserCircle2, BadgeCheck, Calendar } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-url';

interface OwnerBioProps {
  owner: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
    memberSince: string;
  };
  establishmentName: string;
}

export default function OwnerBio({ owner, establishmentName }: OwnerBioProps) {
  const initials = `${owner.firstName?.[0] || ''}${owner.lastName?.[0] || ''}`.toUpperCase();
  const year = new Date(owner.memberSince).getFullYear();

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36]"
    >
      <div className="flex items-center gap-2 mb-4">
        <UserCircle2 className="w-5 h-5 text-orange-400" />
        <h2 className="text-xl font-bold text-white">Le Mot de l&apos;Hote</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {owner.avatar ? (
            <Image
              src={getImageUrl(owner.avatar)}
              alt={`${owner.firstName} ${owner.lastName}`}
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover border-2 border-orange-500/30"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              {owner.firstName} {owner.lastName}
            </h3>
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-sm text-slate-400">
            Gerant de {establishmentName}
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            <span>Membre depuis {year}</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
