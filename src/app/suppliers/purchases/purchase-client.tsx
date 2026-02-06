'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, History, MoreVertical, Receipt } from 'lucide-react'
import { useSupplierPurchases } from '../hooks'
import { useSuppliers } from '../hooks'
import { Purchase } from '../services/purchaseService'

export default function SupplierPurchasesClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supplierId = searchParams.get('id')

  const { purchases, loading, error } = useSupplierPurchases(
    supplierId ? Number(supplierId) : null
  )
  const { suppliers } = useSuppliers()

  const [searchQuery, setSearchQuery] = useState('')

  const supplier = suppliers.find(s => s.id === Number(supplierId))

  useEffect(() => {
    if (!supplierId) {
      router.replace('/suppliers')
    }
  }, [supplierId, router])

  if (!supplierId) return null

  const handleBack = () => {
    router.push('/suppliers')
  }

  const handleViewReceipt = (purchase: Purchase) => {
    sessionStorage.setItem('viewPurchaseReceiptId', purchase.id.toString())
    sessionStorage.setItem('receiptSource', 'supplier-purchases')
    sessionStorage.setItem('supplierId', supplierId)
    router.push('/suppliers/purchases/receipt')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 text-center py-20">
        <div className="inline-flex w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground font-medium">Loading Purchases...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="py-20 text-center">
          <CardContent>
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredPurchases = purchases.filter(p => {
    const q = searchQuery.toLowerCase()
    return (
      p.invoice_no?.toString().toLowerCase().includes(q) ||
      p.branch?.name?.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q) ||
      p.creator?.name?.toLowerCase().includes(q)
    )
  })

  const statusVariant: Record<string, any> = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    'for review': 'outline'
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Supplier Purchases</h1>
          <p className="text-sm text-muted-foreground">
            View all purchases from {supplier?.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>All purchases from this supplier</CardDescription>
          <Input
            className="mt-4"
            placeholder="Search purchases..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </CardHeader>

        <CardContent>
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-20">
              <History className="mx-auto h-24 w-24 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No purchases found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.invoice_no}</TableCell>
                    <TableCell>{p.branch?.name}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[p.status]}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.creator?.name}</TableCell>
                    <TableCell className="text-right">
                      ₱{p.grand_total?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleViewReceipt(p)}
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            View Receipt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}