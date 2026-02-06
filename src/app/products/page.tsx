
'use client'

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProductsRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/inventory/products')
    }, [router])

    return null
}
