'use client'

import { Label } from '@/components/ui/label'
import { useState, useEffect, useRef } from 'react'
import { Check, Star, Zap, ChevronDown, ChevronUp, X } from 'lucide-react'
import { pricingPlans } from '@/app/website/data/pricing'
import { useToast } from '@/hooks/use-toast'

interface SelectPlanStepProps {
  data: any
  onUpdate: (data: any) => void
}

export function SelectPlanStep({ data, onUpdate }: SelectPlanStepProps) {
  const [selectedPlan, setSelectedPlan] = useState(data.selectedPlan || '')
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Filter out enterprise plan for onboarding (keep it simple)
  const plans = pricingPlans.filter(plan => plan.id !== 'enterprise')

  const toggleExpanded = (planId: string) => {
    const newExpanded = new Set(expandedPlans)
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId)
    } else {
      newExpanded.add(planId)
    }
    setExpandedPlans(newExpanded)
  }

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    onUpdate({ selectedPlan: planId })
    
    // Show success toast
    const selectedPlanName = plans.find(plan => plan.id === planId)?.name
    toast({
      variant: "success",
      title: "Great choice!",
      description: `You selected the ${selectedPlanName} plan. You can change your plan at any time from your account settings.`,
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-left mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Select Your Plan</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Choose the plan that best fits your business needs</p>
      </div>

      <div className="space-y-4">
         {plans.map((plan, index) => {
           const visibleFeatures = plan.features.slice(0, 3)
           const hiddenFeatures = plan.features.slice(3)
           const hasMoreFeatures = plan.features.length > 3
           const isExpanded = expandedPlans.has(plan.id)
           const displayFeatures = isExpanded ? plan.features : visibleFeatures

           return (
             <div
               key={plan.id}
               className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${
                 selectedPlan === plan.id
                   ? 'border-2 border-blue-500'
                   : 'border border-gray-200 dark:border-gray-700'
               }`}
             >
               {/* Most Popular Badge for Plus (Gold) */}
               {plan.id === 'plus' && (
                 <div className="absolute -top-2 left-4">
                   <div className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                     <Star className="w-2.5 h-2.5" />
                     MOST POPULAR
                   </div>
                 </div>
               )}

               <div className="p-4">
                 <div className="flex items-center">
                   {/* Left: Icon */}
                   <div className="flex-shrink-0 w-8 h-8 mr-3">
                     <div className={`w-full h-full rounded-full flex items-center justify-center ${
                       plan.id === 'starter' ? 'bg-orange-100 text-orange-600' :
                       plan.id === 'plus' ? 'bg-yellow-100 text-yellow-600' :
                       plan.id === 'professional' ? 'bg-green-100 text-green-600' :
                       'bg-gray-100 text-gray-600'
                     }`}>
                       {plan.id === 'starter' && <Zap className="w-4 h-4" />}
                       {plan.id === 'plus' && <Star className="w-4 h-4" />}
                       {plan.id === 'professional' && <Check className="w-4 h-4" />}
                     </div>
                   </div>

                   {/* Package Name + Price */}
                   <div className="flex-shrink-0 w-1/4 pr-4">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                       {plan.id === 'starter' ? 'Bronze Package' : 
                        plan.id === 'plus' ? 'Gold Package' : 
                        plan.id === 'professional' ? 'Platinum Package' : plan.name}
                     </h3>
                     <div className="flex items-baseline">
                       <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                         ${plan.price}
                       </span>
                       <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
                         Month
                       </span>
                     </div>
                   </div>

                   {/* List of Package Features */}
                   <div className="flex-1 px-4">
                     <div className="space-y-1">
                       {displayFeatures.map((feature, featureIndex) => (
                         <div key={featureIndex} className="flex items-center">
                           <div className="w-3 h-3 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2 flex-shrink-0">
                             <Check className="w-2 h-2" />
                           </div>
                           <span className="text-gray-700 dark:text-gray-300 text-xs">
                             {feature}
                           </span>
                         </div>
                       ))}
                       
                       {/* View More Button - Part of the features list */}
                       {hasMoreFeatures && (
                         <button
                           onClick={(e) => {
                             e.stopPropagation()
                             toggleExpanded(plan.id)
                           }}
                           className="flex items-center text-blue-600 dark:text-blue-400 text-xs font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors mt-1"
                         >
                           {isExpanded ? (
                             <>
                               <ChevronUp className="w-3 h-3 mr-1" />
                               View Less
                             </>
                           ) : (
                             <>
                               <ChevronDown className="w-3 h-3 mr-1" />
                               View More ({hiddenFeatures.length} more)
                             </>
                           )}
                         </button>
                       )}
                     </div>
                   </div>

                   {/* Right: Selection Button */}
                   <div className="flex-shrink-0 pl-4">
                     {selectedPlan === plan.id ? (
                       <div className="flex items-center text-green-600">
                         <Check className="w-4 h-4 mr-1" />
                         <span className="text-sm font-medium">Selected</span>
                       </div>
                     ) : (
                       <button
                         onClick={() => handlePlanSelect(plan.id)}
                         className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors duration-200"
                       >
                         Select Plan
                       </button>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           )
         })}
      </div>
    </div>
  )
}
