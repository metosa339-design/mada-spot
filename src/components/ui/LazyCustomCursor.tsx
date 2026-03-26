'use client';

import dynamic from 'next/dynamic';

const CustomCursor = dynamic(() => import('./CustomCursor'), { ssr: false });

export default function LazyCustomCursor() {
  return <CustomCursor />;
}
