"use client"

import { useState, useEffect, Fragment } from "react"
import { formatPhoneE164, isValidPhoneE164 } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ChevronDown } from "lucide-react"

interface Country {
  name: string
  dial_code: string
  code: string
  flag: string
}

// A trimmed list of major countries for brevity. Add more as needed.
const COUNTRIES: Country[] = [
  { name: "India", dial_code: "+91", code: "IN", flag: "🇮🇳" },
  { name: "United States", dial_code: "+1", code: "US", flag: "🇺🇸" },
  { name: "Canada", dial_code: "+1", code: "CA", flag: "🇨🇦" },
  { name: "United Kingdom", dial_code: "+44", code: "GB", flag: "🇬🇧" },
  { name: "Australia", dial_code: "+61", code: "AU", flag: "🇦🇺" },
  { name: "Germany", dial_code: "+49", code: "DE", flag: "🇩🇪" },
  { name: "France", dial_code: "+33", code: "FR", flag: "🇫🇷" },
  { name: "Singapore", dial_code: "+65", code: "SG", flag: "🇸🇬" },
  { name: "UAE", dial_code: "+971", code: "AE", flag: "🇦🇪" },
  { name: "Nepal", dial_code: "+977", code: "NP", flag: "🇳🇵" },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
}

export default function PhoneInput({ value, onChange, placeholder = "1234567890", disabled, error }: PhoneInputProps) {
  // Determine initial country based on dial code in value
  const findCountryByDial = (dial: string) => COUNTRIES.find((c) => dial.startsWith(c.dial_code))

  const initialCountry = findCountryByDial(value) || COUNTRIES[0]
  const initialLocal = value.replace(initialCountry.dial_code, "").replace(/^\+/, "")

  const [country, setCountry] = useState<Country>(initialCountry)
  const [localNumber, setLocalNumber] = useState<string>(initialLocal)
  const [open, setOpen] = useState(false)

  // Update parent whenever country or localNumber changes
  useEffect(() => {
    const combined = formatPhoneE164(`${country.dial_code}${localNumber}`)
    onChange(combined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, localNumber])

  // Sync internal state if parent value changes externally
  useEffect(() => {
    const c = findCountryByDial(value) || country
    if (c.dial_code !== country.dial_code) setCountry(c)
    const newLocal = value.replace(c.dial_code, "").replace(/^\+/, "")
    if (newLocal !== localNumber) setLocalNumber(newLocal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="flex">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
            disabled={disabled}
          >
            <span className="text-lg">{country.flag}</span>
            <span>{country.dial_code}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="max-h-60 overflow-y-auto p-0 w-56">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCountry(c)
                setOpen(false)
              }}
              className={`flex items-center w-full px-3 py-2 text-sm gap-2 hover:bg-gray-100 ${
                c.code === country.code ? "bg-gray-100" : ""
              }`}
            >
              <span className="text-lg">{c.flag}</span>
              <span className="flex-1 text-left">{c.name}</span>
              <span className="text-gray-500">{c.dial_code}</span>
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <Input
        type="tel"
        value={localNumber}
        onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        disabled={disabled}
        className={`flex-1 rounded-l-none ${error ? "border-red-500" : ""}`}
      />
    </div>
  )
} 