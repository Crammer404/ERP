import { Suspense } from 'react'
import PurchaseClient from './purchase-client'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PurchaseClient />
    </Suspense>
  )
}