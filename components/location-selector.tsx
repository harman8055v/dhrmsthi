"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2, MapPin, Search } from "lucide-react"
import { useCountries, useStates, useCities } from "@/lib/hooks/useLocationData"

export interface LocationFormState {
  country_id: number | null
  state_id: number | null
  city_id: number | null
}

interface LocationSelectorProps {
  value: LocationFormState
  onChange: (location: LocationFormState) => void
  disabled?: boolean
  required?: boolean
  showLabels?: boolean
  className?: string
  defaultToIndia?: boolean
}

export default function LocationSelector({
  value,
  onChange,
  disabled = false,
  required = false,
  showLabels = true,
  className = "",
  defaultToIndia = true,
}: LocationSelectorProps) {
  const { countries, loading: countriesLoading } = useCountries()
  const { states, loading: statesLoading } = useStates(value.country_id)
  const { cities, loading: citiesLoading } = useCities(value.state_id)

  // Search states
  const [countrySearch, setCountrySearch] = useState("")
  const [stateSearch, setStateSearch] = useState("")
  const [citySearch, setCitySearch] = useState("")

  // Track if we've already set India as default to prevent infinite loops
  const [hasSetDefault, setHasSetDefault] = useState(false)

  // Set India as default country on mount if no country is selected
  useEffect(() => {
    if (defaultToIndia && !value.country_id && countries.length > 0 && !hasSetDefault) {
      const india = countries.find((country) => country.name === "India")
      if (india) {
        setHasSetDefault(true)
        onChange({
          country_id: india.id,
          state_id: null,
          city_id: null,
        })
      }
    }
  }, [countries, value.country_id, defaultToIndia, onChange, hasSetDefault])

  // Filtered options based on search
  const filteredCountries = useMemo(() => {
    return countries.filter((country) => country.name.toLowerCase().includes(countrySearch.toLowerCase()))
  }, [countries, countrySearch])

  const filteredStates = useMemo(() => {
    return states.filter((state) => state.name.toLowerCase().includes(stateSearch.toLowerCase()))
  }, [states, stateSearch])

  const filteredCities = useMemo(() => {
    return cities.filter((city) => city.name.toLowerCase().includes(citySearch.toLowerCase()))
  }, [cities, citySearch])

  const handleCountryChange = useCallback(
    (countryId: string) => {
      setCountrySearch("")
      onChange({
        country_id: Number.parseInt(countryId),
        state_id: null,
        city_id: null,
      })
    },
    [onChange],
  )

  const handleStateChange = useCallback(
    (stateId: string) => {
      setStateSearch("")
      onChange({
        ...value,
        state_id: Number.parseInt(stateId),
        city_id: null,
      })
    },
    [onChange, value],
  )

  const handleCityChange = useCallback(
    (cityId: string) => {
      setCitySearch("")
      onChange({
        ...value,
        city_id: Number.parseInt(cityId),
      })
    },
    [onChange, value],
  )

  const getSelectedCountryName = () => {
    const country = countries.find((c) => c.id === value.country_id)
    return country?.name || ""
  }

  const getSelectedStateName = () => {
    const state = states.find((s) => s.id === value.state_id)
    return state?.name || ""
  }

  const getSelectedCityName = () => {
    const city = cities.find((c) => c.id === value.city_id)
    return city?.name || ""
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showLabels && (
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Location</h3>
          {required && <span className="text-red-500">*</span>}
        </div>
      )}

      {/* Country Selection */}
      <div className="space-y-2">
        <Label htmlFor="country" className="text-gray-700 font-medium">
          Country {required && <span className="text-red-500">*</span>}
        </Label>
        <Select
          value={value.country_id?.toString() || ""}
          onValueChange={handleCountryChange}
          disabled={disabled || countriesLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={countriesLoading ? "Loading countries..." : "Select Country"}>
              {getSelectedCountryName()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <div className="flex items-center px-3 pb-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Search countries..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="h-8 w-full border-0 p-0 focus:ring-0"
              />
            </div>
            {filteredCountries.map((country) => (
              <SelectItem key={country.id} value={country.id.toString()}>
                {country.name}
              </SelectItem>
            ))}
            {filteredCountries.length === 0 && countrySearch && (
              <div className="px-3 py-2 text-sm text-gray-500">No countries found</div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* State Selection */}
      <div className="space-y-2">
        <Label htmlFor="state" className="text-gray-700 font-medium">
          State {required && <span className="text-red-500">*</span>}
        </Label>
        <Select
          value={value.state_id?.toString() || ""}
          onValueChange={handleStateChange}
          disabled={disabled || !value.country_id || statesLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                !value.country_id ? "Select Country first" : statesLoading ? "Loading states..." : "Select State"
              }
            >
              {getSelectedStateName()}
            </SelectValue>
            {statesLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
          </SelectTrigger>
          <SelectContent>
            <div className="flex items-center px-3 pb-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Search states..."
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                className="h-8 w-full border-0 p-0 focus:ring-0"
              />
            </div>
            {filteredStates.map((state) => (
              <SelectItem key={state.id} value={state.id.toString()}>
                {state.name}
              </SelectItem>
            ))}
            {filteredStates.length === 0 && stateSearch && (
              <div className="px-3 py-2 text-sm text-gray-500">No states found</div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* City Selection */}
      <div className="space-y-2">
        <Label htmlFor="city" className="text-gray-700 font-medium">
          City {required && <span className="text-red-500">*</span>}
        </Label>
        <Select
          value={value.city_id?.toString() || ""}
          onValueChange={handleCityChange}
          disabled={disabled || !value.state_id || citiesLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={!value.state_id ? "Select State first" : citiesLoading ? "Loading cities..." : "Select City"}
            >
              {getSelectedCityName()}
            </SelectValue>
            {citiesLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
          </SelectTrigger>
          <SelectContent>
            <div className="flex items-center px-3 pb-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Search cities..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="h-8 w-full border-0 p-0 focus:ring-0"
              />
            </div>
            {filteredCities.map((city) => (
              <SelectItem key={city.id} value={city.id.toString()}>
                {city.name}
              </SelectItem>
            ))}
            {filteredCities.length === 0 && citySearch && (
              <div className="px-3 py-2 text-sm text-gray-500">No cities found</div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Validation Message */}
      {required && (!value.country_id || !value.state_id || !value.city_id) && (
        <p className="text-sm text-gray-500 mt-2">Please select your complete location (Country, State, and City)</p>
      )}
    </div>
  )
}

// Helper function to validate location data
export function validateLocation(location: LocationFormState, required = false): boolean {
  if (!required) return true
  return !!(location.country_id && location.state_id && location.city_id)
}
