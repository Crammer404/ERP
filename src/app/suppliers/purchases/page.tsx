import { Suspense } from 'react'
import SupplierPurchasesClient from './purchase-client'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SupplierPurchasesClient />
    </Suspense>
  )
}