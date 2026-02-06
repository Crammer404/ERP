
'use client'

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HistoryRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/pos/transactions')
    }, [router])

    return null
}
