'use client'

import { ReactNode } from 'react'

export interface PayslipEarningItem {
  label: string
  amount: number
}

export interface PayslipDeductionItem {
  label: string
  amount: number
}

export interface PayslipData {
  // Company info
  companyName: string
  companyAddress?: string
  logoUrl?: string

  // Employee / payroll meta
  employeeName: string
  designation?: string
  branch?: string
  payrollType: string
  payPeriod: string
  generatedDate: string

  // Earnings / deductions
  basicPay: number
  overtimePay: number
  nightDifferential: number
  otherEarnings?: PayslipEarningItem[]

  incomeTax: number
  sss: number
  pagibig: number
  philhealth: number
  otherDeductions?: PayslipDeductionItem[]

  // Totals
  totalEarnings: number
  totalDeductions: number
  netPay: number

  // Optional footer / signatures
  employerSignatureLabel?: string
  employeeSignatureLabel?: string
  footerNote?: string

  // Styling
  currencySymbol?: string
  primaryColor?: string
  showLogo?: boolean
  extraHeaderContent?: ReactNode
}

interface PayslipTemplateProps {
  data: PayslipData
  className?: string
}

export function PayslipTemplate({ data, className = '' }: PayslipTemplateProps) {
  const currencySymbol = data.currencySymbol || '₱'
  const primaryColor = data.primaryColor || '#111827'

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const employerSignature =
    data.employerSignatureLabel || 'Employer Signature'
  const employeeSignature =
    data.employeeSignatureLabel || 'Employee Signature'
  const footerNote =
    data.footerNote || 'This is a system generated payslip'

  const totalEarnings =
    data.totalEarnings ||
    (data.basicPay +
      data.overtimePay +
      data.nightDifferential +
      (data.otherEarnings || []).reduce(
        (sum, item) => sum + item.amount,
        0,
      ))

  const totalDeductions =
    data.totalDeductions ||
    (data.incomeTax +
      data.sss +
      data.pagibig +
      data.philhealth +
      (data.otherDeductions || []).reduce(
        (sum, item) => sum + item.amount,
        0,
      ))

  const netPay =
    data.netPay || totalEarnings - totalDeductions

  return (
    <div
      className={`bg-white shadow-lg overflow-hidden max-w-md mx-auto border border-gray-200 ${className}`}
    >
      {/* Company header */}
      <div className="px-6 pt-4 pb-2 text-center border-b border-gray-300">
        {data.showLogo && data.logoUrl && (
          <div className="mx-auto mb-2 flex h-10 w-32 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.logoUrl}
              alt="Company Logo"
              className="max-h-10 object-contain mx-auto"
            />
          </div>
        )}

        <h2
          className="text-sm font-semibold tracking-wide mb-1 uppercase"
          style={{ color: primaryColor }}
        >
          {data.companyName}
        </h2>
        {data.companyAddress && (
          <p className="text-[10px] text-gray-700">
            {data.companyAddress}
          </p>
        )}
        {data.extraHeaderContent}
      </div>

      {/* Employee and payroll meta */}
      <div className="px-6 pt-3 pb-1 text-[11px] text-gray-800">
        <div className="grid grid-cols-2 gap-y-1">
          <div>
            <p>
              <span className="font-semibold">Employee Name: </span>
              {data.employeeName}
            </p>
            {data.designation && (
              <p>
                <span className="font-semibold">Designation: </span>
                {data.designation}
              </p>
            )}
            {data.branch && (
              <p>
                <span className="font-semibold">Branch: </span>
                {data.branch}
              </p>
            )}
          </div>
          <div className="text-right">
            <p>
              <span className="font-semibold">Payroll Type: </span>
              {data.payrollType}
            </p>
            <p>
              <span className="font-semibold">Pay Period: </span>
              {data.payPeriod}
            </p>
            <p>
              <span className="font-semibold">Generated Date: </span>
              {data.generatedDate}
            </p>
          </div>
        </div>
      </div>

      {/* Earnings & Deductions */}
      <div className="px-6 pt-2 pb-4 text-[11px] text-gray-800">
        <div className="grid grid-cols-2 gap-6">
          {/* Earnings */}
          <div>
            <h3 className="font-semibold mb-1">Earnings</h3>
            <div className="border-t border-gray-300 pt-1 space-y-0.5">
              <div className="flex justify-between">
                <span>Basic Pay</span>
                <span>{formatCurrency(data.basicPay)}</span>
              </div>
              <div className="flex justify-between">
                <span>Overtime Pay</span>
                <span>{formatCurrency(data.overtimePay)}</span>
              </div>
              <div className="flex justify-between">
                <span>Night Differential</span>
                <span>{formatCurrency(data.nightDifferential)}</span>
              </div>
              {(data.otherEarnings || []).map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.label}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="mt-1 border-t border-gray-300 pt-1 flex justify-between font-semibold">
                <span>Total Earnings</span>
                <span>{formatCurrency(totalEarnings)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="font-semibold mb-1">Deductions</h3>
            <div className="border-t border-gray-300 pt-1 space-y-0.5">
              <div className="flex justify-between">
                <span>Income Tax</span>
                <span>{formatCurrency(data.incomeTax)}</span>
              </div>
              <div className="flex justify-between">
                <span>SSS</span>
                <span>{formatCurrency(data.sss)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pagibig</span>
                <span>{formatCurrency(data.pagibig)}</span>
              </div>
              <div className="flex justify-between">
                <span>Philhealth</span>
                <span>{formatCurrency(data.philhealth)}</span>
              </div>
              {(data.otherDeductions || []).map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.label}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="mt-1 border-t border-gray-300 pt-1 flex justify-between font-semibold">
                <span>Total Deductions</span>
                <span>{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="mt-4 border-t border-gray-300 pt-2">
          <div className="flex justify-between text-[11px] font-semibold">
            <span>Net Pay</span>
            <span>{formatCurrency(netPay)}</span>
          </div>
        </div>
      </div>

      {/* Signatures & footer */}
      <div className="px-10 pb-4 pt-2 text-[10px] text-gray-800">
        <div className="grid grid-cols-2 gap-8 mt-4">
          <div className="text-center">
            <div className="border-t border-gray-400 mt-6 pt-1" />
            <p>{employerSignature}</p>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 mt-6 pt-1" />
            <p>{employeeSignature}</p>
          </div>
        </div>

        <p className="mt-4 text-center text-[9px] text-gray-600">
          {footerNote}
        </p>
      </div>
    </div>
  )
}

