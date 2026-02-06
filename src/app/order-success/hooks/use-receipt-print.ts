import { useRef } from 'react';

export function useReceiptPrint() {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!receiptRef.current) {
      console.error('No receipt to print');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const receiptHtml = receiptRef.current.innerHTML;
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: monospace; font-size: 14px; margin: 0; padding: 40px 20px 20px 20px; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .mb-1 { margin-bottom: 0.25rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-3 { margin-bottom: 0.75rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mt-2 { margin-top: 0.5rem; }
              .pb-2 { padding-bottom: 0.5rem; }
              .pb-4 { padding-bottom: 1rem; }
              .px-4 { padding-left: 1rem; padding-right: 1rem; }
              .border-t { border-top: 1px solid #000; }
              .border-gray-300 { border-color: #d1d5db; }
              .pt-2 { padding-top: 0.5rem; }
              .grid { display: grid; }
              .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .gap-1 { gap: 0.25rem; }
              .text-xs { font-size: 0.875rem; }
              .text-lg { font-size: 1.25rem; }
              .text-gray-800 { color: #1f2937; }
              .space-y-1 > * + * { margin-top: 0.25rem; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-center { align-items: center; }
              .rounded-full { border-radius: 9999px; }
              .h-12 { height: 3rem; }
              .w-12 { width: 3rem; }
              .object-cover { object-fit: cover; }
              .overflow-hidden { overflow: hidden; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .bg-gray-100 { background-color: #f3f4f6; }
              .max-w-sm { max-width: 100%; }
              .shadow-lg { box-shadow: none; }
              .bg-white { background-color: #fff; }
              @media print {
                body { margin: 0; padding: 40px 20px 20px 20px; }
                @page { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="bg-white overflow-hidden max-w-sm mx-auto">
              ${receiptHtml}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  return { receiptRef, handlePrint };
}