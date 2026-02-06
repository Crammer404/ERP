
'use client'

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function PayrollRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/payroll/generate')
    }, [router])

    return null
}
