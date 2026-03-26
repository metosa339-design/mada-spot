'use client';

import { memo } from 'react';
import { Globe, Facebook, Instagram } from 'lucide-react';

interface SocialLinksProps {
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
}

export default memo(function SocialLinks({ website, facebook, instagram }: SocialLinksProps) {
  if (!website && !facebook && !instagram) return null;

  return (
    <div className="space-y-2">
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-orange-400 transition-colors"
        >
          <Globe className="w-4 h-4" />
          Voir le site web
        </a>
      )}
      {facebook && (
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-orange-400 transition-colors"
        >
          <Facebook className="w-4 h-4" />
          Page Facebook
        </a>
      )}
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-orange-400 transition-colors"
        >
          <Instagram className="w-4 h-4" />
          Instagram
        </a>
      )}
    </div>
  );
});
