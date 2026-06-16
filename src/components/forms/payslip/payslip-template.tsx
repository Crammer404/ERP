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
  daysWorked?: number
  summaryRows?: Array<{ leftLabel: string; leftValue: string; rightLabel: string; rightValue: string }>

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
  const branchName = data.branch || data.companyName
  const branchInitials = getBranchInitials(branchName)

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

  const infoRows: Array<{
    leftLabel: string
    leftValue: string
    rightLabel: string
    rightValue: string
  }> = []

  infoRows.push({
    leftLabel: 'Employee name',
    leftValue: data.employeeName,
    rightLabel: 'Payroll type',
    rightValue: data.payrollType,
  })

  infoRows.push({
    leftLabel: 'Position',
    leftValue: data.designation || 'N/A',
    rightLabel: 'Pay period',
    rightValue: data.payPeriod,
  })

  infoRows.push({
    leftLabel: 'Branch',
    leftValue: data.branch || 'N/A',
    rightLabel: 'Pay date',
    rightValue: data.generatedDate,
  })

  if (Array.isArray(data.summaryRows) && data.summaryRows.length > 0) {
    infoRows.push(...data.summaryRows)
  }

  return (
    <div className={className} style={styles.page}>
      <div style={styles.header}>
        <div style={styles.companySection}>
          <div style={styles.branchLogo}>
            {data.showLogo && data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.logoUrl} alt={`${branchName} logo`} style={styles.branchLogoImage} />
            ) : (
              <span style={styles.branchLogoText}>{branchInitials}</span>
            )}
          </div>
          <div style={{ ...styles.headerText, color: primaryColor }}>
            {branchName}
          </div>
        </div>

        <div style={styles.titleSection}>
          <div style={{ ...styles.headerText, color: primaryColor }}>
            Payroll Statement
          </div>
        </div>
      </div>

      {data.extraHeaderContent && (
        <div style={styles.extraHeader}>{data.extraHeaderContent}</div>
      )}

      <div style={styles.infoContainer}>
        {infoRows.map((row) => (
          <div key={`${row.leftLabel}-${row.rightLabel}`} style={styles.infoRow}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{row.leftLabel}:</span>
              <span style={styles.infoValue}>{row.leftValue}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{row.rightLabel}:</span>
              <span style={styles.infoValue}>{row.rightValue}</span>
            </div>
          </div>
        ))}
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

function getBranchInitials(name: string): string {
  const cleaned = name.trim()
  if (!cleaned) return 'BR'

  const words = cleaned
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean)

  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
  }

  const word = words[0] || cleaned
  const camelSecond = word.slice(1).match(/[A-Z]/)?.[0]
  return `${word[0] ?? ''}${camelSecond ?? word[1] ?? ''}`.toUpperCase()
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    padding: '4px 6px',
    borderBottom: '1px solid #e5e7eb',
  },
  companySection: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minHeight: '12px',
  },
  branchLogo: {
    width: '28px',
    height: '28px',
    borderRadius: '999px',
    backgroundColor: '#e5e7eb',
    border: '1px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  branchLogoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  branchLogoText: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#334155',
    letterSpacing: '0.1px',
    lineHeight: 1,
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
  headerText: {
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: 0,
    lineHeight: 1.05,
    textTransform: 'uppercase',
  },
  companyAddress: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#475569',
    lineHeight: 1.35,
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    textAlign: 'right',
    minWidth: '150px',
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
    marginTop: '4px',
  },
  infoContainer: {
    marginTop: '6px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    padding: '4px 6px',
    backgroundColor: '#fafafa',
  },
  infoRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    padding: '1px 0',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '3px',
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  infoLabel: {
    fontSize: '8.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.15px',
    color: '#64748b',
    fontWeight: 600,
    lineHeight: 1.1,
  },
  infoValue: {
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#0f172a',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.15,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '6px',
    border: '1px solid #d1d5db',
  },
  th: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.2px',
    textAlign: 'left',
    padding: '4px 6px',
    borderBottom: '1px solid #d1d5db',
    backgroundColor: '#f3f4f6',
    color: '#111827',
  },
  thAmount: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.2px',
    textAlign: 'right',
    padding: '4px 6px',
    borderBottom: '1px solid #d1d5db',
    backgroundColor: '#f3f4f6',
    color: '#111827',
    width: '22%',
  },
  td: {
    padding: '3px 6px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '9.5px',
    color: '#1f2937',
    verticalAlign: 'top',
    lineHeight: 1.15,
  },
  tdAmount: {
    padding: '3px 6px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '9.5px',
    color: '#111827',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
    lineHeight: 1.15,
  },
  summaryBox: {
    marginTop: '6px',
    marginLeft: 'auto',
    width: '280px',
    maxWidth: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 6px',
    borderBottom: '1px solid #e5e7eb',
  },
  summaryLabel: {
    fontSize: '9.5px',
    color: '#334155',
    fontWeight: 600,
  },
  summaryValue: {
    fontSize: '9.5px',
    color: '#0f172a',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  summaryNetRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '5px 6px',
    backgroundColor: '#f8fafc',
  },
  summaryNetLabel: {
    fontSize: '9.5px',
    color: '#0f172a',
    fontWeight: 800,
    letterSpacing: '0.2px',
  },
  summaryNetValue: {
    fontSize: '11px',
    color: '#0f172a',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  signatureGrid: {
    marginTop: '8px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  signatureBlock: {
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1px solid #64748b',
    marginTop: '12px',
  },
  signatureLabel: {
    marginTop: '3px',
    fontSize: '9px',
    color: '#334155',
    fontWeight: 600,
  },
  footer: {
    marginTop: '6px',
    textAlign: 'center',
    fontSize: '8.5px',
    color: '#64748b',
    borderTop: '1px dashed #d1d5db',
    paddingTop: '4px',
  },
}
