import type React from "react"
import AdminMiddleware from "./middleware"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminMiddleware>{children}</AdminMiddleware>
}
