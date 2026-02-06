'use client'

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ReportsRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/reports/profit-loss')
    }, [router])

    return null
}
