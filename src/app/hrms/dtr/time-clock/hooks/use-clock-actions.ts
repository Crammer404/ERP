import { useState } from 'react';
import { clock as clockApi, reopenForOvertime } from '@/services/hrms/dtr';
import type { OvertimePromptData } from '../components/scan-result-dialog';

interface UseClockActionsOptions {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refreshLogs: () => Promise<void>;
  stopScanner: () => void;
  startScanner: () => void;
  resetScanProcessingState: () => void;
  setScanConfirmData: (data: { employeeName: string; action: string; time: string } | null) => void;
  setScanConfirmOpen: (open: boolean) => void;
  setScanErrorMessage: (message: string) => void;
  setScanErrorOpen: (open: boolean) => void;
  setOvertimeConfirmData: (data: OvertimePromptData | null) => void;
  setOvertimeConfirmOpen: (open: boolean) => void;
  setEarlyOutPromptData: (data: {
    userId: number;
    employeeName: string;
    attemptedClockOut: string;
    scheduledClockOut: string;
    remainingMinutes: number;
    source?: 'qr' | 'manual';
  } | null) => void;
  setEarlyOutConfirmOpen: (open: boolean) => void;
}

export function useClockActions(options: UseClockActionsOptions) {
  const [clocking, setClocking] = useState(false);
  const [overtimeConfirming, setOvertimeConfirming] = useState(false);
  const [earlyOutConfirming, setEarlyOutConfirming] = useState(false);

  const handleClockWithUserId = async (uid: number, fromScanner = false): Promise<boolean> => {
    if (!uid || uid <= 0) {
      options.onError('Please provide a valid user ID.');
      return false;
    }

    setClocking(true);
    try {
      const res = await clockApi(uid);

      if (res?.status === 'overtime_prompt') {
        const promptData: OvertimePromptData = {
          employeeName: res.employee_name || `User #${uid}`,
          logId: res.log_id,
          userId: uid,
          shift: res.shift || '-',
          clockIn: res.clock_in || '-',
          clockOut: res.clock_out || '-',
          date: res.date || new Date().toISOString().slice(0, 10),
        };

        if (fromScanner) options.stopScanner();
        options.setOvertimeConfirmData(promptData);
        options.setOvertimeConfirmOpen(true);
        return true;
      }

      if (res?.status === 'early_out_prompt') {
        if (fromScanner) options.stopScanner();
        options.setEarlyOutPromptData({
          userId: uid,
          employeeName: res?.employee_name || `User #${uid}`,
          attemptedClockOut: res?.attempted_clock_out || '-',
          scheduledClockOut: res?.scheduled_clock_out || '-',
          remainingMinutes: Number(res?.remaining_minutes || 0),
          source: 'qr',
        });
        options.setEarlyOutConfirmOpen(true);
        return true;
      }

      if (res?.status === 'error') {
        if (fromScanner) {
          options.stopScanner();
          options.setScanErrorMessage(res?.message || 'Clock action failed');
          options.setScanErrorOpen(true);
          return true;
        }
        options.onError(res?.message || 'Clock action failed');
        return false;
      }

      await options.refreshLogs();

      if (fromScanner) {
        options.setScanConfirmData({
          employeeName: res?.employee_name || `User #${uid}`,
          action: res?.action || (res?.clock_in ? 'Clock In' : 'Clock Out'),
          time: res?.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        });
        options.stopScanner();
        options.setScanConfirmOpen(true);
        return true;
      }

      options.onSuccess(res?.message || 'Clock action completed');
      return false;
    } catch (e: any) {
      const apiErr = e?.response?.data?.message || e?.message || 'Clock action failed';
      if (fromScanner) {
        options.stopScanner();
        options.setScanErrorMessage(apiErr);
        options.setScanErrorOpen(true);
        return true;
      }
      options.onError(apiErr);
      return false;
    } finally {
      setClocking(false);
    }
  };

  const handleOvertimeConfirm = async (data: OvertimePromptData | null) => {
    if (!data) return;
    setOvertimeConfirming(true);
    try {
      const res = await reopenForOvertime({ user_id: data.userId, log_id: data.logId });
      if (res?.status === 'error') {
        options.onError(res?.message || 'Failed to reopen shift for overtime.');
      } else {
        options.setScanConfirmData({
          employeeName: res?.employee_name || data.employeeName,
          action: res?.action || 'Clock In (Overtime)',
          time: res?.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
        });
        await options.refreshLogs();
        options.setScanConfirmOpen(true);
      }
    } catch (e: any) {
      options.onError(e?.response?.data?.message || e?.message || 'Failed to reopen shift for overtime.');
    } finally {
      setOvertimeConfirming(false);
      options.setOvertimeConfirmOpen(false);
      options.setOvertimeConfirmData(null);
    }
  };

  const handleOvertimeCancel = () => {
    options.setOvertimeConfirmOpen(false);
    options.setOvertimeConfirmData(null);
    options.resetScanProcessingState();
    options.startScanner();
  };

  const handleEarlyOutConfirm = async (earlyOutPromptData: {
    userId: number;
    employeeName: string;
    attemptedClockOut: string;
    scheduledClockOut: string;
    remainingMinutes: number;
  } | null) => {
    if (!earlyOutPromptData) return;
    setEarlyOutConfirming(true);
    try {
      const res = await clockApi(earlyOutPromptData.userId, { confirm_early_out: true });
      if (res?.status === 'error') {
        options.onError(res?.message || 'Failed to clock out early.');
      } else {
        await options.refreshLogs();
        options.setScanConfirmData({
          employeeName: res?.employee_name || earlyOutPromptData.employeeName,
          action: res?.action || 'Clock Out',
          time: res?.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
        });
        options.setScanConfirmOpen(true);
      }
    } catch (e: any) {
      options.onError(e?.response?.data?.message || e?.message || 'Failed to clock out early.');
    } finally {
      setEarlyOutConfirming(false);
      options.setEarlyOutConfirmOpen(false);
      options.setEarlyOutPromptData(null);
      options.resetScanProcessingState();
      options.startScanner();
    }
  };

  const handleEarlyOutCancel = () => {
    options.setEarlyOutConfirmOpen(false);
    options.setEarlyOutPromptData(null);
    options.resetScanProcessingState();
    options.startScanner();
  };

  return {
    clocking,
    overtimeConfirming,
    earlyOutConfirming,
    handleClockWithUserId,
    handleOvertimeConfirm,
    handleOvertimeCancel,
    handleEarlyOutConfirm,
    handleEarlyOutCancel,
  };
}

