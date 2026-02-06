"use client"

import * as React from "react"
import { Clock, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  id?: string
  className?: string
}

export function TimePicker({
  value = "",
  onChange,
  disabled = false,
  id,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [tempHours, setTempHours] = React.useState("")
  const [tempMinutes, setTempMinutes] = React.useState("")
  const [tempPeriod, setTempPeriod] = React.useState<"am" | "pm">("am")
  const [focusedField, setFocusedField] = React.useState<"hours" | "minutes">("hours")
  
  const hoursRef = React.useRef<HTMLInputElement>(null)
  const minutesRef = React.useRef<HTMLInputElement>(null)

  // Parse 12-hour format (e.g., "02:30 PM")
  const parse12Hour = (time12: string) => {
    if (!time12 || time12 === '') {
      return { hours: 0, minutes: 0, period: 'am' }
    }
    
    // Check if already in 12-hour format
    if (time12.includes('AM') || time12.includes('PM')) {
      const [timePart, periodPart] = time12.split(' ')
      const [hours, minutes] = timePart.split(':').map(Number)
      return { hours, minutes, period: periodPart.toLowerCase() }
    }
    
    // Fallback: parse as 24-hour format and convert
    const [hours, minutes] = time12.split(':').map(Number)
    const period = hours >= 12 ? 'pm' : 'am'
    const hours12 = hours % 12 || 12
    return { hours: hours12, minutes, period }
  }

  // Initialize temp values when opening
  React.useEffect(() => {
    if (open) {
      if (value && value !== '') {
        const { hours, minutes, period } = parse12Hour(value)
        setTempHours(String(hours).padStart(2, '0'))
        setTempMinutes(String(minutes).padStart(2, '0'))
        setTempPeriod(period as "am" | "pm")
      } else {
        // Start with default time (current time)
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const period = currentHour >= 12 ? 'pm' : 'am'
        const hour12 = currentHour % 12 || 12
        setTempHours(String(hour12).padStart(2, '0'))
        setTempMinutes(String(currentMinute).padStart(2, '0'))
        setTempPeriod(period as "am" | "pm")
      }
      setFocusedField("hours")
    }
  }, [open, value])

  const formatDisplayTime = () => {
    if (!value || value === '') {
      return 'Select time'
    }
    // Value is now in 12-hour format (e.g., "02:30 PM"), so just return it
    return value
  }

  const handleOk = () => {
    const hours = parseInt(tempHours) || 12
    const minutes = parseInt(tempMinutes) || 0
    // Format as 12-hour time with AM/PM (e.g., "02:30 PM")
    const time12 = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${tempPeriod.toUpperCase()}`
    onChange?.(time12)
    setOpen(false)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    
    if (val === '') {
      setTempHours('')
      return
    }

    const num = parseInt(val)
    
    // Auto-advance to minutes when 2 digits entered or value > 1
    if (val.length === 2 || (val.length === 1 && num > 1)) {
      if (num >= 1 && num <= 12) {
        setTempHours(String(num).padStart(2, '0'))
        minutesRef.current?.focus()
        minutesRef.current?.select()
      }
    } else if (val.length === 1 && num >= 0 && num <= 9) {
      setTempHours(val)
    }
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    
    if (val === '') {
      setTempMinutes('')
      return
    }

    const num = parseInt(val)
    
    // Auto-pad when 2 digits entered
    if (val.length === 2) {
      if (num >= 0 && num <= 59) {
        setTempMinutes(String(num).padStart(2, '0'))
      }
    } else if (val.length === 1) {
      // If first digit is > 5, auto-pad and stay focused
      if (num > 5) {
        setTempMinutes(`0${num}`)
      } else {
        setTempMinutes(val)
      }
    }
  }

  const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ':') {
      e.preventDefault()
      minutesRef.current?.focus()
      minutesRef.current?.select()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      incrementHours()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      decrementHours()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleMinutesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      hoursRef.current?.focus()
      hoursRef.current?.select()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      incrementMinutes()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      decrementMinutes()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleOk()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const incrementHours = () => {
    const current = parseInt(tempHours) || 12
    const next = current >= 12 ? 1 : current + 1
    setTempHours(String(next).padStart(2, '0'))
  }

  const decrementHours = () => {
    const current = parseInt(tempHours) || 12
    const prev = current <= 1 ? 12 : current - 1
    setTempHours(String(prev).padStart(2, '0'))
  }

  const incrementMinutes = () => {
    const current = parseInt(tempMinutes) || 0
    const next = current >= 59 ? 0 : current + 1
    setTempMinutes(String(next).padStart(2, '0'))
  }

  const decrementMinutes = () => {
    const current = parseInt(tempMinutes) || 0
    const prev = current <= 0 ? 59 : current - 1
    setTempMinutes(String(prev).padStart(2, '0'))
  }

  const togglePeriod = () => {
    setTempPeriod(tempPeriod === 'am' ? 'pm' : 'am')
  }

  const formatCurrentSelection = () => {
    const hours = tempHours || '12'
    const minutes = tempMinutes || '00'
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')} ${tempPeriod.toUpperCase()}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            (!value || value === '') && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {formatDisplayTime()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="bg-muted/30 rounded-lg p-4">
          {/* Header */}
          <div className="text-sm text-muted-foreground mb-4">
            Enter time
          </div>

          {/* Time Input Area */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {/* Hour Input */}
            <div className="flex flex-col items-center">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={incrementHours}
                className="h-8 w-16 hover:bg-primary/10"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
              <div className={cn(
                "w-16 h-16 rounded-lg flex items-center justify-center text-3xl font-medium transition-colors cursor-text my-1",
                focusedField === "hours" ? "bg-primary/20" : "bg-muted"
              )}
              onClick={() => {
                hoursRef.current?.focus()
                hoursRef.current?.select()
              }}
              >
                <input
                  ref={hoursRef}
                  type="text"
                  inputMode="numeric"
                  value={tempHours}
                  onChange={handleHoursChange}
                  onKeyDown={handleHoursKeyDown}
                  onFocus={() => setFocusedField("hours")}
                  maxLength={2}
                  className="w-full h-full bg-transparent text-center outline-none cursor-text"
                  placeholder="12"
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={decrementHours}
                className="h-8 w-16 hover:bg-primary/10"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
              <span className="text-xs text-muted-foreground mt-1">Hour</span>
            </div>

            {/* Separator */}
            <div className="text-3xl font-medium mb-8">:</div>

            {/* Minute Input */}
            <div className="flex flex-col items-center">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={incrementMinutes}
                className="h-8 w-16 hover:bg-primary/10"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
              <div className={cn(
                "w-16 h-16 rounded-lg flex items-center justify-center text-3xl font-medium transition-colors cursor-text my-1",
                focusedField === "minutes" ? "bg-primary/20" : "bg-muted"
              )}
              onClick={() => {
                minutesRef.current?.focus()
                minutesRef.current?.select()
              }}
              >
                <input
                  ref={minutesRef}
                  type="text"
                  inputMode="numeric"
                  value={tempMinutes}
                  onChange={handleMinutesChange}
                  onKeyDown={handleMinutesKeyDown}
                  onFocus={() => setFocusedField("minutes")}
                  maxLength={2}
                  className="w-full h-full bg-transparent text-center outline-none cursor-text"
                  placeholder="00"
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={decrementMinutes}
                className="h-8 w-16 hover:bg-primary/10"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
              <span className="text-xs text-muted-foreground mt-1">Minute</span>
            </div>

            {/* AM/PM Selector */}
            <div className="flex flex-col gap-1 ml-2 mb-8">
              <button
                type="button"
                onClick={() => setTempPeriod("am")}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-all active:scale-95",
                  tempPeriod === "am" 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setTempPeriod("pm")}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-all active:scale-95",
                  tempPeriod === "pm" 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                PM
              </button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {formatCurrentSelection()}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCancel()
                  }
                }}
                className="text-primary hover:bg-primary/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleOk}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleOk()
                  }
                }}
                className="text-primary hover:bg-primary/10 font-semibold"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

