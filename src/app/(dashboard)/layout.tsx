import * as React from "react"

export default function DashboardTopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background font-sans">
      {children}
    </div>
  )
}
