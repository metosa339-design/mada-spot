'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-[#94A3B8] flex-wrap">
      <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Accueil</span>
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-[#64748B] flex-shrink-0" />
          {item.href ? (
            <Link href={item.href} className="hover:text-white transition-colors truncate max-w-[200px]">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#FDBA74] font-medium truncate max-w-[200px]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
