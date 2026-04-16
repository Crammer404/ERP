import { useEffect, useRef, useState } from 'react';

interface UseQrScannerClockOptions {
  onScanUserId: (userId: number) => Promise<boolean>;
  onScanInvalid: () => void;
  onScannerError: (message: string) => void;
}

export function useQrScannerClock(options: UseQrScannerClockOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [isScannerPanelCollapsed, setIsScannerPanelCollapsed] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerResetTimeoutRef = useRef<number | null>(null);
  const isProcessingScanRef = useRef(false);

  const clearScannerResetTimeout = () => {
    if (scannerResetTimeoutRef.current !== null) {
      window.clearTimeout(scannerResetTimeoutRef.current);
      scannerResetTimeoutRef.current = null;
    }
  };

  const pauseScanner = () => {
    const scannerInstance = scannerRef.current;
    if (!scannerInstance) return;
    try {
      scannerInstance.pause(true);
    } catch {}
  };

  const clearScannerInstance = () => {
    const scannerInstance = scannerRef.current;
    if (!scannerInstance) return;
    scannerRef.current = null;
    try {
      const clearResult = scannerInstance.clear();
      if (clearResult && typeof clearResult.then === 'function') {
        clearResult.catch(() => {});
      }
    } catch {}
  };

  const getQrFileInput = (): HTMLInputElement | null => {
    return document.getElementById('html5-qrcode-private-filescan-input') as HTMLInputElement | null;
  };

  const clearQrFileInput = () => {
    const fileInput = getQrFileInput();
    if (!fileInput) return;
    fileInput.value = '';
  };

  const resetScanProcessingState = () => {
    isProcessingScanRef.current = false;
    setIsProcessingScan(false);
    clearQrFileInput();
  };

  const scheduleScanReset = (mounted: boolean) => {
    clearScannerResetTimeout();
    scannerResetTimeoutRef.current = window.setTimeout(() => {
      scannerResetTimeoutRef.current = null;
      if (!mounted) return;
      resetScanProcessingState();
    }, 1200);
  };

  const stopScanner = () => {
    pauseScanner();
    clearScannerResetTimeout();
    clearScannerInstance();
    setIsScanning(false);
  };

  const startScanner = () => {
    setIsScanning(true);
  };

  useEffect(() => {
    setIsScanning(true);
  }, []);

  useEffect(() => {
    isProcessingScanRef.current = isProcessingScan;
  }, [isProcessingScan]);

  useEffect(() => {
    if (isScannerPanelCollapsed) {
      clearScannerResetTimeout();
      isProcessingScanRef.current = false;
      setIsProcessingScan(false);
      clearQrFileInput();
    }
  }, [isScannerPanelCollapsed]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!isScanning || isScannerPanelCollapsed) return;
      if (!document.getElementById('timeclock-qr-reader')) return;
      try {
        const mod: any = await import('html5-qrcode');
        const Html5QrcodeScanner = mod.Html5QrcodeScanner;
        const config = {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const base = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(base * 0.9);
            return { width: edge, height: edge };
          },
          rememberLastUsedCamera: true,
        } as any;

        const scanner = new Html5QrcodeScanner('timeclock-qr-reader', config, false);
        scannerRef.current = scanner;

        const onScanSuccess = async (decodedText: string) => {
          if (!mounted || isProcessingScanRef.current) return;

          isProcessingScanRef.current = true;
          setIsProcessingScan(true);
          pauseScanner();

          let dialogOpened = false;
          try {
            let userId: number | null = null;
            try {
              const qrData = JSON.parse(decodedText);
              userId = qrData.id;
            } catch {
              const match = decodedText.match(/\d+/);
              if (match) {
                userId = parseInt(match[0], 10);
              }
            }

            if (userId) {
              dialogOpened = await options.onScanUserId(userId);
            } else {
              options.onScanInvalid();
              dialogOpened = true;
            }
          } finally {
            if (!dialogOpened) {
              scheduleScanReset(mounted);
            }
          }
        };

        const onScanFailure = () => {
          const fileInput = getQrFileInput();
          const isFileScanMode = Boolean(fileInput && !fileInput.disabled);
          if (!isFileScanMode) return;
          clearScannerResetTimeout();
          resetScanProcessingState();
        };

        scanner.render(onScanSuccess, onScanFailure);
      } catch (err: any) {
        options.onScannerError(err?.message || 'Failed to start QR scanner');
      }
    };

    init();

    return () => {
      mounted = false;
      clearScannerResetTimeout();
      isProcessingScanRef.current = false;
      clearScannerInstance();
    };
  }, [isScanning, isScannerPanelCollapsed]);

  return {
    isScanning,
    setIsScanning,
    isScannerPanelCollapsed,
    setIsScannerPanelCollapsed,
    isProcessingScan,
    setIsProcessingScan,
    resetScanProcessingState,
    startScanner,
    stopScanner,
    clearScannerResetTimeout,
  };
}

