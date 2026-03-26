'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReservationsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/calendrier')
  }, [router])
  return null
}
