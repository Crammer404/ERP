'use client';

import { MoreVertical, Pencil, Printer, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PayslipData } from '../services/generate-service';
import { formatGeneratedDateTime, getInitials, sumPayslipEntriesByDescription } from '../utils/payroll-view-helpers';

interface PayslipDropdownTableProps {
  reportId: number;
  payslips: PayslipData[];
  formatCurrency: (amount: number) => string;
  onPrint: (reportId: number, payslipId: number) => void;
  onEdit: (payslip: PayslipData) => void;
  onDelete: (reportId: number, payslip: PayslipData) => void;
}

export function PayslipDropdownTable({
  reportId,
  payslips,
  formatCurrency,
  onPrint,
  onEdit,
  onDelete,
}: PayslipDropdownTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[11px] px-2 py-1.5 text-right">#</TableHead>
            <TableHead className="text-[11px] px-2 py-1.5">Employee</TableHead>
            <TableHead className="text-[11px] px-2 py-1.5">Position</TableHead>
            <TableHead className="text-right text-[11px] px-2 py-1.5">Basic Pay</TableHead>
            <TableHead className="text-right text-[11px] px-2 py-1.5">Overtime Pay</TableHead>
            <TableHead className="text-right text-[11px] px-2 py-1.5">Night Differential</TableHead>
            <TableHead className="text-right text-[11px] px-2 py-1.5">Holiday Premium</TableHead>
            <TableHead className="text-right text-[11px] px-2 py-1.5">Income Tax</TableHead>
            <TableHead className="text-right text-[11px] px-2 py-1.5">SSS</TableHead>
            <TableHead className="text-right text-[11px] px-2 py-1.5">Pagibig</TableHead>
            <TableHead className="text-right text-[11px] px-2 py-1.5">PhilHealth</TableHead>
            <TableHead className="text-right text-[11px] px-2 py-1.5">Late</TableHead>
            <TableHead className="text-right text-[11px] px-2 py-1.5">Cash Advance</TableHead>
            <TableHead className="text-right text-[11px] px-2 py-1.5">Gross</TableHead>
            <TableHead className="text-right text-[11px] px-2 py-1.5">Net</TableHead>
            <TableHead className="text-center text-[11px] px-2 py-1.5">Generated Date</TableHead>
            <TableHead className="text-center text-[11px] px-2 py-1.5">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payslips.map((payslip, index) => {
            const holidayPremium = sumPayslipEntriesByDescription(
              payslip.earnings,
              'Holiday Premium'
            );
            const lateAmount = sumPayslipEntriesByDescription(
              payslip.deductions,
              'Late'
            );
            const cashAdvanceAmount = sumPayslipEntriesByDescription(
              payslip.deductions,
              'Cash Advance'
            );

            return (
              <TableRow key={`${reportId}-${payslip.employee_name}-${index}`}>
                <TableCell className="text-right px-2 py-1.5 text-[11px]">{index + 1}</TableCell>
                <TableCell className="whitespace-nowrap px-2 py-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={payslip.profile_pic || undefined} alt={payslip.employee_name} />
                      <AvatarFallback className="text-[9px]">
                        {getInitials(payslip.employee_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{payslip.employee_name}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap px-2 py-1.5 text-[11px]">{payslip.position || 'N/A'}</TableCell>
                <TableCell className="text-right px-2 py-1.5 text-[11px]">{formatCurrency(Number(payslip.basic_pay || 0))}</TableCell>
                <TableCell className="text-right px-2 py-1.5 text-[11px]">{formatCurrency(Number(payslip.overtime_pay || 0))}</TableCell>
                <TableCell className="text-right px-2 py-1.5 text-[11px]">{formatCurrency(Number(payslip.night_diff || 0))}</TableCell>
                <TableCell className="text-right px-2 py-1.5 text-[11px]">{formatCurrency(holidayPremium)}</TableCell>
                <TableCell className="text-right px-2 py-1.5 text-[11px]">{formatCurrency(Number(payslip.income_tax || 0))}</TableCell>
                <TableCell className="text-right px-2 py-1.5 text-[11px]">{formatCurrency(Number(payslip.sss || 0))}</TableCell>
                <TableCell className="text-right px-2 py-1.5 text-[11px]">{formatCurrency(Number(payslip.pagibig || 0))}</TableCell>
                <TableCell className="text-right px-2 py-1.5 text-[11px]">{formatCurrency(Number(payslip.philhealth || 0))}</TableCell>
                <TableCell className="text-right px-2 py-1.5 text-[11px]">{formatCurrency(lateAmount)}</TableCell>
                <TableCell className="text-right px-2 py-1.5 text-[11px]">{formatCurrency(cashAdvanceAmount)}</TableCell>
                <TableCell className="text-right px-2 py-1.5 text-[11px]">{formatCurrency(Number(payslip.gross || 0))}</TableCell>
                <TableCell className="text-right font-medium px-2 py-1.5 text-[11px]">{formatCurrency(Number(payslip.net || 0))}</TableCell>
                <TableCell className="text-center px-2 py-1.5 text-[11px]">{formatGeneratedDateTime(payslip.generated_at)}</TableCell>
                <TableCell className="text-center px-2 py-1.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPrint(reportId, payslip.id)}>
                        <Printer className="mr-2 h-3.5 w-3.5" />
                        Print
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(payslip)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(reportId, payslip)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
