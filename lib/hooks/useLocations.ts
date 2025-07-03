import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface State {
  id: number
  name: string
  state_code: string
}

export interface City {
  id: number
  name: string
  state_code: string
}

export function useStates() {
  const [states, setStates] = useState<State[]>([])

  useEffect(() => {
    async function fetchStates() {
      const { data, error } = await supabase
        .from('states')
        .select('id,name,state_code')
        .order('name')
      if (!error && data) {
        setStates(data as State[])
      }
    }
    fetchStates()
  }, [])

  return states
}

export function useCities(stateCode: string | null) {
  const [cities, setCities] = useState<City[]>([])

  useEffect(() => {
    if (!stateCode) {
      setCities([])
      return
    }
    async function fetchCities() {
      const { data, error } = await supabase
        .from('cities')
        .select('id,name,state_code')
        .eq('state_code', stateCode)
        .order('name')
      if (!error && data) {
        setCities(data as City[])
      }
    }
    fetchCities()
  }, [stateCode])

  return cities
}
