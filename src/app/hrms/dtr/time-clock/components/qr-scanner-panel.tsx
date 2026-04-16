import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import { formatDateTime } from '../utils/date-utils';

interface QrScannerPanelProps {
  isScannerPanelCollapsed: boolean;
  setIsScannerPanelCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  isScanning: boolean;
  isProcessingScan: boolean;
  onStartScanning: () => void;
  currentTime: Date;
}

export function QrScannerPanel(props: QrScannerPanelProps) {
  return (
    <div
      className={`shrink-0 min-w-0 transition-all duration-300 ease-in-out ${
        props.isScannerPanelCollapsed ? 'w-full lg:w-14' : 'w-full lg:w-[320px]'
      }`}
    >
      <Card className="h-fit overflow-hidden">
        <CardHeader className={`flex flex-row items-center ${props.isScannerPanelCollapsed ? 'justify-center p-2' : 'justify-between'}`}>
          {!props.isScannerPanelCollapsed && <CardTitle>QR Scanner</CardTitle>}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => props.setIsScannerPanelCollapsed((prev) => !prev)}
            aria-label={props.isScannerPanelCollapsed ? 'Expand scanner panel' : 'Collapse scanner panel'}
          >
            {props.isScannerPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </CardHeader>

        {!props.isScannerPanelCollapsed && (
          <CardContent className="space-y-4">
            {!props.isScanning ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="text-center">
                  <Smartphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">Click the button below to start scanning</p>
                </div>
                <Button onClick={props.onStartScanning} className="w-full" size="lg">
                  Start Scanner
                </Button>
              </div>
            ) : (
              <>
                <div className="w-full max-w-[300px] mx-auto relative">
                  <div id="timeclock-qr-reader" className="w-full [&_img]:mx-auto [&>div]:flex [&>div]:flex-col [&>div]:items-center" />
                  {props.isProcessingScan && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="text-center text-white">
                        <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm font-medium">Processing...</p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground text-center">Scan to Clock In/Out</p>
              </>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm font-medium">Today: {formatDateTime(props.currentTime)}</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

