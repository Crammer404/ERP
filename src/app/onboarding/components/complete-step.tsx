'use client'

import { CheckCircle, PartyPopper } from 'lucide-react'

interface CompleteStepProps {
  data: any
}

export function CompleteStep({ data }: CompleteStepProps) {
  return (
    <div className="text-center max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-2">
          <PartyPopper className="w-8 h-8 text-yellow-500" />
          All Done!
        </h1>
        
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">
          Congratulations! Your business setup is complete. You're now ready to start managing 
          your business with our ERP system.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-100 dark:bg-slate-800/50 rounded-lg p-6 border border-gray-200 dark:border-slate-700 mb-8 text-left">
        <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Setup Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
            <span className="text-gray-700 dark:text-slate-300 text-sm">
              Account created: <strong>{data.firstName} {data.lastName}</strong>
            </span>
          </div>
          
          {data.storeName && (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-slate-300 text-sm">
                Store Name: <strong>{data.storeName}</strong>
              </span>
            </div>
          )}
          
          {data.city && data.province && (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-slate-300 text-sm">
                Location: {data.city}, {data.province}
              </span>
            </div>
          )}
          
          {data.contactEmail && (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-slate-300 text-sm">
                Contact: {data.contactEmail}
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
