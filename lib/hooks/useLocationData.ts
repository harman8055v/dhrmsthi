"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface Country {
  id: number
  name: string
  code: string
}

export interface State {
  id: number
  name: string
  country_id: number
}

export interface City {
  id: number
  name: string
  state_id: number
}

// ---------------------------------------------------------------------------
// Simple in-memory caches (module-level). These last for the lifetime of the
// session/tab and dramatically reduce repeated Supabase reads.
// ---------------------------------------------------------------------------

let countryCache: Country[] | null = null
const stateCache: Record<number, State[]> = {}
const cityCache: Record<number, City[]> = {}

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>(countryCache || [])
  const [loading, setLoading] = useState(!countryCache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (countryCache) return // already cached

    async function fetchCountries() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("countries").select("*").order("name")

        if (error) throw error
        countryCache = data || []
        setCountries(countryCache)
      } catch (err) {
        console.error("Error fetching countries:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch countries")
        // Fallback to India if API fails
        countryCache = [{ id: 1, name: "India", code: "IN" }]
        setCountries(countryCache)
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  return { countries, loading, error }
}

export function useStates(countryId: number | null) {
  const cached = countryId ? stateCache[countryId] : []
  const [states, setStates] = useState<State[]>(cached || [])
  const [loading, setLoading] = useState(countryId ? !cached : false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!countryId) {
      setStates([])
      return
    }

    if (stateCache[countryId!]) {
      setStates(stateCache[countryId!])
      setLoading(false)
      return
    }

    async function fetchStates() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("states").select("*").eq("country_id", countryId).order("name")

        if (error) throw error
        stateCache[countryId!] = data || []
        setStates(stateCache[countryId!])
      } catch (err) {
        console.error("Error fetching states:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch states")
        setStates([])
      } finally {
        setLoading(false)
      }
    }

    fetchStates()
  }, [countryId])

  return { states, loading, error }
}

export function useCities(stateId: number | null) {
  const cached = stateId ? cityCache[stateId] : []
  const [cities, setCities] = useState<City[]>(cached || [])
  const [loading, setLoading] = useState(stateId ? !cached : false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!stateId) {
      setCities([])
      return
    }

    if (cityCache[stateId!]) {
      setCities(cityCache[stateId!])
      setLoading(false)
      return
    }

    async function fetchCities() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("cities").select("*").eq("state_id", stateId).order("name")

        if (error) throw error
        cityCache[stateId!] = data || []
        setCities(cityCache[stateId!])
      } catch (err) {
        console.error("Error fetching cities:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch cities")
        setCities([])
      } finally {
        setLoading(false)
      }
    }

    fetchCities()
  }, [stateId])

  return { cities, loading, error }
}
