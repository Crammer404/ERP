'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlipCard } from '@/components/ui/flip-card';
import { Loader2, User, Download, BadgeCheck } from 'lucide-react';
import { employeeService } from '@/services';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader } from '@/components/ui/loader';
import html2canvas from 'html2canvas';

// Employee display data type
interface EmployeeDisplay {
  id: number;
  name: string;
  email: string;
  role: string;
  branch: string;
}

export default function EmployeeCardPage() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  // Fetch current user's employee data and generate QR code
  useEffect(() => {
    if (user) {
      fetchCurrentUserEmployee();
    }
  }, [user]);

  // Fetch current user's employee data from backend
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
      const currentUserEmployee = allEmployees.find(emp => emp.id === userId);
      
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

  // Generate QR code for the employee
  const generateQrCode = async (employeeData: EmployeeDisplay) => {
    try {
      const qrData = {
        id: employeeData.id,
        name: employeeData.name,
        email: employeeData.email,
        role: employeeData.role,
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

      // Small delay to ensure hidden elements are fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture front side
      const frontCanvas = await html2canvas(frontCardRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
      });

      // Download front side
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

      // Wait a bit before capturing the back
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture back side
      const backCanvas = await html2canvas(backCardRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
      });

      // Download back side
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
    <div className="container mx-auto py-6 px-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">Digital Employee ID</h1>
          <p className="text-sm text-muted-foreground">
            Your digital employee ID card.
          </p>
        </div>

        <div className="flex justify-center items-center min-h-[500px]">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  if (!employee || !qrCode) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Digital Employee ID</h1>
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
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <BadgeCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Digital Employee ID</h1>
          <p className="text-sm text-muted-foreground">
            Your digital employee ID card.
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <CardContent>
          {/* Hidden cards for download (no transform applied) */}
          <div className="fixed -left-[9999px] top-0">
            {/* Front Card for Download */}
            <div ref={frontCardRef} className="w-[260px] h-[380px] bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-5 text-white">
              <div className="flex flex-col items-center h-full">
                <div className="text-center mb-4">
                  <h3 className="text-sm font-bold tracking-widest">THE NEST</h3>
                  <div className="h-0.5 w-12 bg-white/30 mx-auto mt-1.5 rounded-full"></div>
                </div>
                <div className="flex-shrink-0 mb-4">
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-3 border-white/30">
                    <User className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center text-center space-y-2.5 w-full">
                  <h2 className="text-xl font-bold leading-tight px-2">{employee.name}</h2>
                  <div className="space-y-1.5 text-xs bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">ID:</span>
                      <span className="font-semibold">{employee.id}</span>
                    </div>
                    <div className="h-px bg-white/20"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Role:</span>
                      <span className="font-semibold text-right ml-2">{employee.role}</span>
                    </div>
                    <div className="h-px bg-white/20"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Branch:</span>
                      <span className="font-semibold">{employee.branch}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back Card for Download */}
            <div ref={backCardRef} className="w-[260px] h-[380px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-2xl p-4">
              <div className="flex flex-col items-center h-full">
                <div className="text-center mb-2">
                  <h3 className="text-sm font-bold text-gray-800">Digital ID</h3>
                  <p className="text-[9px] text-gray-500 mt-0.5">Scan to Clock In/Out</p>
                </div>
                <div className="flex-1 flex items-center justify-center my-2">
                  <div 
                    className="bg-white p-1.5 rounded-lg border border-gray-300 shadow-sm [&_svg]:w-[110px] [&_svg]:h-[110px]"
                    dangerouslySetInnerHTML={{ __html: qrCode }}
                  />
                </div>
                <div className="w-full bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                  <h4 className="text-[9px] font-bold text-gray-500 tracking-wider mb-1.5">EMPLOYEE INFORMATION</h4>
                  <div className="space-y-1 text-[10px]">
                    <div>
                      <span className="text-gray-500 text-[8px] block leading-tight">Name</span>
                      <span className="font-medium text-gray-800 text-[10px]">{employee.name}</span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div>
                      <span className="text-gray-500 text-[8px] block leading-tight">Employee ID</span>
                      <span className="font-medium text-gray-800 text-[10px]">{employee.id}</span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div>
                      <span className="text-gray-500 text-[8px] block leading-tight">Branch</span>
                      <span className="font-medium text-gray-800 text-[10px]">{employee.branch}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ID Card with Flip Animation - Compact Portrait Orientation */}
           <div className="w-[260px] h-[380px] mx-auto">
             <FlipCard
               front={
                 <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-5 text-white">
                  <div className="flex flex-col items-center h-full">
                    {/* Header */}
                    <div className="text-center mb-4">
                      <h3 className="text-sm font-bold tracking-widest">THE NEST</h3>
                      <div className="h-0.5 w-12 bg-white/30 mx-auto mt-1.5 rounded-full"></div>
                    </div>

                    {/* Profile Photo */}
                    <div className="flex-shrink-0 mb-4">
                      <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-3 border-white/30">
                        <User className="w-12 h-12 text-white" />
                      </div>
          </div>

                    {/* Employee Details */}
                    <div className="flex-1 flex flex-col justify-center text-center space-y-2.5 w-full">
                      <h2 className="text-xl font-bold leading-tight px-2">{employee.name}</h2>
                      
                      <div className="space-y-1.5 text-xs bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">ID:</span>
                          <span className="font-semibold">{employee.id}</span>
                        </div>
                        <div className="h-px bg-white/20"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Role:</span>
                          <span className="font-semibold text-right ml-2">{employee.role}</span>
                        </div>
                        <div className="h-px bg-white/20"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Branch:</span>
                          <span className="font-semibold">{employee.branch}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
               }
               back={
                 <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-2xl p-4">
                  <div className="flex flex-col items-center h-full">
                    {/* Header */}
                    <div className="text-center mb-2">
                      <h3 className="text-sm font-bold text-gray-800">Digital ID</h3>
                      <p className="text-[9px] text-gray-500 mt-0.5">Scan to Clock In/Out</p>
                    </div>

                    {/* QR Code */}
                    <div className="flex-1 flex items-center justify-center my-2">
                      <div 
                        className="bg-white p-1.5 rounded-lg border border-gray-300 shadow-sm [&_svg]:w-[110px] [&_svg]:h-[110px]"
                        dangerouslySetInnerHTML={{ __html: qrCode }}
                      />
            </div>

                    {/* Employee Info */}
                    <div className="w-full bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                      <h4 className="text-[9px] font-bold text-gray-500 tracking-wider mb-1.5">EMPLOYEE INFORMATION</h4>
                      
                      <div className="space-y-1 text-[10px]">
                        <div>
                          <span className="text-gray-500 text-[8px] block leading-tight">Name</span>
                          <span className="font-medium text-gray-800 text-[10px]">{employee.name}</span>
                        </div>
                        <div className="h-px bg-gray-200"></div>
                        <div>
                          <span className="text-gray-500 text-[8px] block leading-tight">Employee ID</span>
                          <span className="font-medium text-gray-800 text-[10px]">{employee.id}</span>
                        </div>
                        <div className="h-px bg-gray-200"></div>
                        <div>
                          <span className="text-gray-500 text-[8px] block leading-tight">Branch</span>
                          <span className="font-medium text-gray-800 text-[10px]">{employee.branch}</span>
                        </div>
                      </div>
                    </div>
              </div>
            </div>
              }
                />
              </div>

           {/* Download Button */}
           <div className="flex justify-center mt-6">
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