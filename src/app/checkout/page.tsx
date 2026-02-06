
'use client'

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function CheckoutRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/pos')
    }, [router])

    return null
}
