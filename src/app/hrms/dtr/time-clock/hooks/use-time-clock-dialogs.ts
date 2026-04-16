import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import type { ScanConfirmData, OvertimePromptData } from '../components/scan-result-dialog';

export function useTimeClockDialogs() {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>();
  const [isModalShaking, setIsModalShaking] = useState(false);

  const [scanConfirmOpen, setScanConfirmOpen] = useState(false);
  const [scanConfirmData, setScanConfirmData] = useState<ScanConfirmData | null>(null);
  const [scanErrorOpen, setScanErrorOpen] = useState(false);
  const [scanErrorMessage, setScanErrorMessage] = useState('');

  const [overtimeConfirmOpen, setOvertimeConfirmOpen] = useState(false);
  const [overtimeConfirmData, setOvertimeConfirmData] = useState<OvertimePromptData | null>(null);
  const [overtimeConfirming, setOvertimeConfirming] = useState(false);

  const [earlyOutConfirmOpen, setEarlyOutConfirmOpen] = useState(false);
  const [earlyOutConfirming, setEarlyOutConfirming] = useState(false);
  const [earlyOutPromptData, setEarlyOutPromptData] = useState<{
    userId: number;
    employeeName: string;
    attemptedClockOut: string;
    scheduledClockOut: string;
    remainingMinutes: number;
    source?: 'qr' | 'manual';
  } | null>(null);

  const handleModalOutsideClick = () => {
    setIsModalShaking(true);
    setTimeout(() => setIsModalShaking(false), 600);
  };

  return {
    exportModalOpen,
    setExportModalOpen,
    exportDateRange,
    setExportDateRange,
    isModalShaking,
    handleModalOutsideClick,
    scanConfirmOpen,
    setScanConfirmOpen,
    scanConfirmData,
    setScanConfirmData,
    scanErrorOpen,
    setScanErrorOpen,
    scanErrorMessage,
    setScanErrorMessage,
    overtimeConfirmOpen,
    setOvertimeConfirmOpen,
    overtimeConfirmData,
    setOvertimeConfirmData,
    overtimeConfirming,
    setOvertimeConfirming,
    earlyOutConfirmOpen,
    setEarlyOutConfirmOpen,
    earlyOutConfirming,
    setEarlyOutConfirming,
    earlyOutPromptData,
    setEarlyOutPromptData,
  };
}

