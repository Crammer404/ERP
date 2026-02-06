'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export type SweetAlertProps = {
  open: boolean;
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose: () => void;
};

export default function SweetAlert({
  open,
  type = 'info',
  title,
  message,
  onClose,
}: SweetAlertProps) {
  const iconMap = {
    success: <CheckCircle className="h-12 w-12 text-green-500" />,
    error: <XCircle className="h-12 w-12 text-red-500" />,
    warning: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
    info: <Info className="h-12 w-12 text-blue-500" />,
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex flex-col items-center gap-4">
                  {iconMap[type]}
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    {title}
                  </Dialog.Title>
                  {message && (
                    <p className="text-sm text-gray-500 dark:text-gray-300 text-center">
                      {message}
                    </p>
                  )}
                  <button
                    onClick={onClose}
                    className="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    OK
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
