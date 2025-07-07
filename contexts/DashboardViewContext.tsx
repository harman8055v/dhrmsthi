"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type DashboardView =
  | "home"
  | "matches"
  | "messages"
  | "store"
  | "profile"
  | "settings"
  | "preferences"
  | "privacy"
  | "referrals"

interface DashboardViewContextValue {
  activeView: DashboardView
  setActiveView: (view: DashboardView) => void
}

const DashboardViewContext = createContext<DashboardViewContextValue | null>(null)

export function DashboardViewProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<DashboardView>("home")

  return (
    <DashboardViewContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </DashboardViewContext.Provider>
  )
}

export function useDashboardView() {
  return useContext(DashboardViewContext)
} 