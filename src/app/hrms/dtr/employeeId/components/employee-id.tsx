'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlipCard } from '@/components/ui/flip-card';
import { BadgeCheck, Download, Loader2, User } from 'lucide-react';
import { employeeService } from '@/services';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader } from '@/components/ui/loader';
import html2canvas from 'html2canvas';

interface EmployeeDisplay {
  id: number;
  name: string;
  email: string;
  role: string;
  position?: string | null;
  displayRole: string;
  branch: string;
}

export function EmployeeId() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchCurrentUserEmployee();
    }
  }, [user]);

  const fetchCurrentUserEmployee = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        toast.error('User not logged in');
        setLoading(false);
        return;
      }

      const allEmployees = await employeeService.fetchAllEmployees();
      const userId = parseInt(user.id, 10);
      const currentUserEmployee = allEmployees.find((emp) => emp.id === userId);

      if (currentUserEmployee) {
        const formattedEmployee = employeeService.formatEmployeeForTable(currentUserEmployee);
        setEmployee(formattedEmployee);
        await generateQrCode(formattedEmployee);
      } else {
        toast.error('Employee data not found');
      }
    } catch (error) {
      console.error('Failed to fetch employee data:', error);
      toast.error('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const generateQrCode = async (employeeData: EmployeeDisplay) => {
    try {
      const qrData = {
        id: employeeData.id,
        name: employeeData.name,
        email: employeeData.email,
        role: employeeData.displayRole,
        branch: employeeData.branch,
      };

      const svgQrCode = await employeeService.generateEmployeeQr(qrData);
      setQrCode(svgQrCode);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const handleDownloadCards = async () => {
    if (!employee || !frontCardRef.current || !backCardRef.current) return;

    try {
      setDownloading(true);
      const fileName = employee.name.replace(/\s+/g, '_');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const frontCanvas = await html2canvas(frontCardRef.current, {
        background: 'rgba(0,0,0,0)',
        useCORS: true,
        logging: false,
      });

      frontCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}_ID_Front.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const backCanvas = await html2canvas(backCardRef.current, {
        background: 'rgba(0,0,0,0)',
        // @ts-ignore: `scale` is supported by html2canvas but missing in typings
        scale: 2,
        useCORS: true,
        logging: false,
      });

      backCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}_ID_Back.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      });

      toast.success('ID cards downloaded successfully');
    } catch (error) {
      console.error('Error downloading ID cards:', error);
      toast.error('Failed to download ID cards');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div>
          <h1 className="font-headline text-2xl font-bold">Digital Employee ID</h1>
          <p className="text-sm text-muted-foreground">Your digital employee ID card.</p>
        </div>

        <div className="flex min-h-[500px] items-center justify-center">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  if (!employee || !qrCode) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-3xl font-bold">Digital Employee ID</h1>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Unable to load your employee ID. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <BadgeCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-headline text-2xl font-bold">Digital Employee ID</h1>
          <p className="text-sm text-muted-foreground">Your digital employee ID card.</p>
        </div>
      </div>

      <div className="mx-auto max-w-md">
        <CardContent>
          <div className="fixed -left-[9999px] top-0">
            <div
              ref={frontCardRef}
              className="h-[380px] w-[260px] rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-2xl"
            >
              <div className="flex h-full flex-col items-center">
                <div className="mb-4 text-center">
                  <h3 className="text-sm font-bold tracking-widest">THE NEST</h3>
                  <div className="mx-auto mt-1.5 h-0.5 w-12 rounded-full bg-white/30"></div>
                </div>
                <div className="mb-4 flex-shrink-0">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-3 border-white/30 bg-white/10 backdrop-blur-sm">
                    <User className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="flex flex-1 w-full flex-col justify-center space-y-2.5 text-center">
                  <h2 className="px-2 text-xl font-bold leading-tight">{employee.name}</h2>
                  <div className="space-y-1.5 rounded-lg bg-white/10 p-3 text-xs backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">ID:</span>
                      <span className="font-semibold">{employee.id}</span>
                    </div>
                    <div className="h-px bg-white/20"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Position:</span>
                      <span className="ml-2 text-right font-semibold">{employee.displayRole}</span>
                    </div>
                    <div className="h-px bg-white/20"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Branch:</span>
                      <span className="font-semibold">{employee.branch}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={backCardRef}
              className="h-[380px] w-[260px] rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4 shadow-2xl"
            >
              <div className="flex h-full flex-col items-center">
                <div className="mb-2 text-center">
                  <h3 className="text-sm font-bold text-gray-800">Digital ID</h3>
                  <p className="mt-0.5 text-[9px] text-gray-500">Scan to Clock In/Out</p>
                </div>
                <div className="my-2 flex flex-1 items-center justify-center">
                  <div
                    className="rounded-lg border border-gray-300 bg-white p-1.5 shadow-sm [&_svg]:h-[110px] [&_svg]:w-[110px]"
                    dangerouslySetInnerHTML={{ __html: qrCode }}
                  />
                </div>
                <div className="w-full rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                  <h4 className="mb-1.5 text-[9px] font-bold tracking-wider text-gray-500">EMPLOYEE INFORMATION</h4>
                  <div className="space-y-1 text-[10px]">
                    <div>
                      <span className="block text-[8px] leading-tight text-gray-500">Name</span>
                      <span className="text-[10px] font-medium text-gray-800">{employee.name}</span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div>
                      <span className="block text-[8px] leading-tight text-gray-500">Employee ID</span>
                      <span className="text-[10px] font-medium text-gray-800">{employee.id}</span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div>
                      <span className="block text-[8px] leading-tight text-gray-500">Branch</span>
                      <span className="text-[10px] font-medium text-gray-800">{employee.branch}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto h-[380px] w-[260px]">
            <FlipCard
              front={
                <div className="h-full w-full rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-2xl">
                  <div className="flex h-full flex-col items-center">
                    <div className="mb-4 text-center">
                      <h3 className="text-sm font-bold tracking-widest">THE NEST</h3>
                      <div className="mx-auto mt-1.5 h-0.5 w-12 rounded-full bg-white/30"></div>
                    </div>
                    <div className="mb-4 flex-shrink-0">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border-3 border-white/30 bg-white/10 backdrop-blur-sm">
                        <User className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <div className="flex flex-1 w-full flex-col justify-center space-y-2.5 text-center">
                      <h2 className="px-2 text-xl font-bold leading-tight">{employee.name}</h2>
                      <div className="space-y-1.5 rounded-lg bg-white/10 p-3 text-xs backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">ID:</span>
                          <span className="font-semibold">{employee.id}</span>
                        </div>
                        <div className="h-px bg-white/20"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Position:</span>
                          <span className="ml-2 text-right font-semibold">{employee.displayRole}</span>
                        </div>
                        <div className="h-px bg-white/20"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Branch:</span>
                          <span className="font-semibold">{employee.branch}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
              back={
                <div className="h-full w-full rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4 shadow-2xl">
                  <div className="flex h-full flex-col items-center">
                    <div className="mb-2 text-center">
                      <h3 className="text-sm font-bold text-gray-800">Digital ID</h3>
                      <p className="mt-0.5 text-[9px] text-gray-500">Scan to Clock In/Out</p>
                    </div>
                    <div className="my-2 flex flex-1 items-center justify-center">
                      <div
                        className="rounded-lg border border-gray-300 bg-white p-1.5 shadow-sm [&_svg]:h-[110px] [&_svg]:w-[110px]"
                        dangerouslySetInnerHTML={{ __html: qrCode }}
                      />
                    </div>
                    <div className="w-full rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                      <h4 className="mb-1.5 text-[9px] font-bold tracking-wider text-gray-500">EMPLOYEE INFORMATION</h4>
                      <div className="space-y-1 text-[10px]">
                        <div>
                          <span className="block text-[8px] leading-tight text-gray-500">Name</span>
                          <span className="text-[10px] font-medium text-gray-800">{employee.name}</span>
                        </div>
                        <div className="h-px bg-gray-200"></div>
                        <div>
                          <span className="block text-[8px] leading-tight text-gray-500">Employee ID</span>
                          <span className="text-[10px] font-medium text-gray-800">{employee.id}</span>
                        </div>
                        <div className="h-px bg-gray-200"></div>
                        <div>
                          <span className="block text-[8px] leading-tight text-gray-500">Branch</span>
                          <span className="text-[10px] font-medium text-gray-800">{employee.branch}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={handleDownloadCards} size="lg" disabled={downloading}>
              {downloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download ID Card
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </div>
    </div>
  );
}
