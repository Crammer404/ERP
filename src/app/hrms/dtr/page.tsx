
'use client'

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DtrRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/dtr/time-clock')
    }, [router])

    return null
}
