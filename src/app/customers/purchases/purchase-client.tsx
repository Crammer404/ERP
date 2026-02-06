'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, History } from 'lucide-react'
import { Accordion } from '@/components/ui/accordion'
import { useCustomerTransactions } from '../../pos/transactions/hooks'
import { useCustomer } from '../hooks'
import { TransactionItem } from '../../pos/transactions/components'
import { Loader } from '@/components/ui/loader'
import {
  DataTable,
  DataTableBody,
  DataTableFooter,
} from '@/components/ui/data-table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { PaginationInfo } from '@/components/ui/pagination-info'
import { cn } from '@/lib/utils'

export default function PurchaseClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const customerId = searchParams.get('id')

  const { customer } = useCustomer(customerId ? Number(customerId) : null)
  const {
    transactions,
    loading,
    error,
    currentPage,
    setCurrentPage,
    itemsPerPage,
  } = useCustomerTransactions(customerId ? Number(customerId) : null)

  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!customerId) {
      router.replace('/customers')
    }
  }, [customerId, router])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, setCurrentPage])

  if (!customerId) {
    return null
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const query = searchQuery.toLowerCase()
    const reference = transaction.reference_no.toString().toLowerCase()
    const date = new Date(transaction.created_at)
      .toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      .toLowerCase()

    return reference.includes(query) || date.includes(query)
  })

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const from =
    filteredTransactions.length > 0
      ? (currentPage - 1) * itemsPerPage + 1
      : 0

  const to = Math.min(
    currentPage * itemsPerPage,
    filteredTransactions.length
  )

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const max = 5

    if (totalPages <= max) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 'ellipsis', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, 'ellipsis', currentPage, 'ellipsis', totalPages)
    }

    return pages
  }

  const TableHeader = () => (
    <div
      className="grid gap-4 text-xs font-medium uppercase tracking-wider
      border-b border-border bg-card px-4 py-3 text-center text-muted-foreground min-w-[800px]"
      style={{ gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr 1fr 1fr auto' }}
    >
      <span />
      <span className="text-left">Reference</span>
      <span>Branch</span>
      <span>Cashier</span>
      <span>Status</span>
      <span>Total Amount</span>
      <span>Amount Paid</span>
      <span />
    </div>
  )

  const renderTableBody = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <Loader size="md" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex justify-center py-16 text-red-500">
          Error: {error}
        </div>
      )
    }

    if (filteredTransactions.length === 0) {
      return (
        <div className="flex flex-col items-center py-16">
          <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold">
            {searchQuery
              ? 'No matching purchases found'
              : 'No purchases yet'}
          </h3>
        </div>
      )
    }

    return (
      <Accordion type="single" collapsible>
        {paginatedTransactions.map((t) => (
          <TransactionItem
            key={t.id}
            transaction={t}
            customerId={customerId}
          />
        ))}
      </Accordion>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Button
        variant="outline"
        onClick={() => router.push('/customers')}
        className="mb-6 flex gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>
            All transactions for this customer
          </CardDescription>
          <Input
            placeholder="Search by reference or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardHeader>

        <CardContent className="p-0">
          <DataTable>
            <div className="overflow-x-auto">
              <TableHeader />
              <DataTableBody>{renderTableBody()}</DataTableBody>
            </div>

            {totalPages > 1 && (
              <DataTableFooter>
                <PaginationInfo
                  from={from}
                  to={to}
                  total={filteredTransactions.length}
                  itemsPerPage={itemsPerPage}
                  showItemsPerPage={false}
                  onItemsPerPageChange={() => {}}
                />
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          currentPage > 1 &&
                          setCurrentPage(currentPage - 1)
                        }
                        className={cn(
                          currentPage === 1 &&
                            'pointer-events-none opacity-50'
                        )}
                      />
                    </PaginationItem>

                    {getPageNumbers().map((p, i) =>
                      p === 'ellipsis' ? (
                        <PaginationEllipsis key={i} />
                      ) : (
                        <PaginationLink
                          key={p}
                          isActive={currentPage === p}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </PaginationLink>
                      )
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          currentPage < totalPages &&
                          setCurrentPage(currentPage + 1)
                        }
                        className={cn(
                          currentPage === totalPages &&
                            'pointer-events-none opacity-50'
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </DataTableFooter>
            )}
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}
