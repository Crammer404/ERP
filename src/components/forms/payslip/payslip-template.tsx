'use client'

import { ReactNode, type CSSProperties } from 'react'

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
  const currencySymbol = data.currencySymbol || 'PHP'
  const primaryColor = data.primaryColor || '#111827'

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const employerSignature = data.employerSignatureLabel || 'Employer Signature'
  const employeeSignature = data.employeeSignatureLabel || 'Employee Signature'
  const footerNote = data.footerNote || 'This is a system-generated payslip.'

  const earningsItems: PayslipEarningItem[] = [
    { label: 'Basic Pay', amount: data.basicPay || 0 },
    { label: 'Overtime Pay', amount: data.overtimePay || 0 },
    { label: 'Night Differential', amount: data.nightDifferential || 0 },
    ...(data.otherEarnings || []),
  ]

  const deductionsItems: PayslipDeductionItem[] = [
    { label: 'Income Tax', amount: data.incomeTax || 0 },
    { label: 'SSS', amount: data.sss || 0 },
    { label: 'Pag-IBIG', amount: data.pagibig || 0 },
    { label: 'PhilHealth', amount: data.philhealth || 0 },
    ...(data.otherDeductions || []),
  ]

  const computedTotalEarnings = earningsItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const computedTotalDeductions = deductionsItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  const totalEarnings =
    typeof data.totalEarnings === 'number' ? data.totalEarnings : computedTotalEarnings

  const totalDeductions =
    typeof data.totalDeductions === 'number' ? data.totalDeductions : computedTotalDeductions

  const netPay =
    typeof data.netPay === 'number' ? data.netPay : totalEarnings - totalDeductions

  const rowCount = Math.max(earningsItems.length, deductionsItems.length)
  const rows = Array.from({ length: rowCount }, (_, index) => ({
    earning: earningsItems[index],
    deduction: deductionsItems[index],
  }))

  return (
    <div className={className} style={styles.page}>
      <div style={styles.header}>
        <div style={styles.companySection}>
          {data.showLogo && data.logoUrl && (
            <div style={styles.logoWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.logoUrl}
                alt="Company Logo"
                style={styles.logo}
              />
            </div>
          )}

          <div>
            <div style={{ ...styles.companyName, color: primaryColor }}>
              {data.companyName}
            </div>
            {data.companyAddress && (
              <div style={styles.companyAddress}>{data.companyAddress}</div>
            )}
          </div>
        </div>

        <div style={styles.titleSection}>
          <div style={{ ...styles.title, color: primaryColor }}>PAYSLIP</div>
          <div style={styles.subtitle}>Payroll Statement</div>
        </div>
      </div>

      {data.extraHeaderContent && (
        <div style={styles.extraHeader}>{data.extraHeaderContent}</div>
      )}

      <div style={styles.metaGrid}>
        <div style={styles.metaCard}>
          <div style={styles.metaLabel}>Employee Name</div>
          <div style={styles.metaValue}>{data.employeeName}</div>

          {data.designation && (
            <>
              <div style={styles.metaLabel}>Position</div>
              <div style={styles.metaValue}>{data.designation}</div>
            </>
          )}

          {data.branch && (
            <>
              <div style={styles.metaLabel}>Branch</div>
              <div style={styles.metaValue}>{data.branch}</div>
            </>
          )}
        </div>

        <div style={styles.metaCard}>
          <div style={styles.metaLabel}>Payroll Type</div>
          <div style={styles.metaValue}>{data.payrollType}</div>

          <div style={styles.metaLabel}>Pay Period</div>
          <div style={styles.metaValue}>{data.payPeriod}</div>

          <div style={styles.metaLabel}>Pay Date</div>
          <div style={styles.metaValue}>{data.generatedDate}</div>
        </div>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>EARNINGS</th>
            <th style={styles.thAmount}>AMOUNT</th>
            <th style={styles.th}>DEDUCTIONS</th>
            <th style={styles.thAmount}>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${idx}-${row.earning?.label || ''}-${row.deduction?.label || ''}`}>
              <td style={styles.td}>{row.earning?.label || ''}</td>
              <td style={styles.tdAmount}>
                {row.earning ? formatCurrency(row.earning.amount || 0) : ''}
              </td>
              <td style={styles.td}>{row.deduction?.label || ''}</td>
              <td style={styles.tdAmount}>
                {row.deduction ? formatCurrency(row.deduction.amount || 0) : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={styles.summaryBox}>
        <div style={styles.summaryRow}>
          <span style={styles.summaryLabel}>Gross Earnings</span>
          <span style={styles.summaryValue}>{formatCurrency(totalEarnings)}</span>
        </div>
        <div style={styles.summaryRow}>
          <span style={styles.summaryLabel}>Total Deductions</span>
          <span style={styles.summaryValue}>{formatCurrency(totalDeductions)}</span>
        </div>
        <div style={styles.summaryNetRow}>
          <span style={styles.summaryNetLabel}>NET PAY</span>
          <span style={styles.summaryNetValue}>{formatCurrency(netPay)}</span>
        </div>
      </div>

      <div style={styles.signatureGrid}>
        <div style={styles.signatureBlock}>
          <div style={styles.signatureLine} />
          <div style={styles.signatureLabel}>{employerSignature}</div>
        </div>
        <div style={styles.signatureBlock}>
          <div style={styles.signatureLine} />
          <div style={styles.signatureLabel}>{employeeSignature}</div>
        </div>
      </div>

      <div style={styles.footer}>
        {footerNote}
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '12px 14px',
    boxSizing: 'border-box',
    fontFamily: 'Inter, "Segoe UI", Tahoma, Arial, sans-serif',
    color: '#0f172a',
    boxShadow: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb',
  },
  companySection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minHeight: '12px',
  },
  logoWrap: {
    width: '66px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  companyName: {
    fontSize: '16px',
    fontWeight: 700,
    letterSpacing: '0.2px',
    lineHeight: 1.2,
    textTransform: 'uppercase',
  },
  companyAddress: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#475569',
    lineHeight: 1.35,
  },
  titleSection: {
    textAlign: 'right',
    minWidth: '180px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    letterSpacing: '1px',
    lineHeight: 1,
  },
  subtitle: {
    marginTop: '4px',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.9px',
    color: '#475569',
    fontWeight: 600,
  },
  extraHeader: {
    marginTop: '10px',
  },
  metaGrid: {
    marginTop: '14px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  metaCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '10px 12px',
    backgroundColor: '#fafafa',
  },
  metaLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    color: '#64748b',
    marginTop: '4px',
  },
  metaValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
    lineHeight: 1.35,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '14px',
    border: '1px solid #d1d5db',
  },
  th: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: '1px solid #d1d5db',
    backgroundColor: '#f3f4f6',
    color: '#111827',
  },
  thAmount: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    textAlign: 'right',
    padding: '8px 10px',
    borderBottom: '1px solid #d1d5db',
    backgroundColor: '#f3f4f6',
    color: '#111827',
    width: '22%',
  },
  td: {
    padding: '7px 10px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '12px',
    color: '#1f2937',
    verticalAlign: 'top',
  },
  tdAmount: {
    padding: '7px 10px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '12px',
    color: '#111827',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
  },
  summaryBox: {
    marginTop: '14px',
    marginLeft: 'auto',
    width: '340px',
    maxWidth: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#334155',
    fontWeight: 600,
  },
  summaryValue: {
    fontSize: '12px',
    color: '#0f172a',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  summaryNetRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
  },
  summaryNetLabel: {
    fontSize: '12px',
    color: '#0f172a',
    fontWeight: 800,
    letterSpacing: '0.6px',
  },
  summaryNetValue: {
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  signatureGrid: {
    marginTop: '24px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '28px',
  },
  signatureBlock: {
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1px solid #64748b',
    marginTop: '24px',
  },
  signatureLabel: {
    marginTop: '6px',
    fontSize: '11px',
    color: '#334155',
    fontWeight: 600,
  },
  footer: {
    marginTop: '14px',
    textAlign: 'center',
    fontSize: '10px',
    color: '#64748b',
    borderTop: '1px dashed #d1d5db',
    paddingTop: '8px',
  },
}
