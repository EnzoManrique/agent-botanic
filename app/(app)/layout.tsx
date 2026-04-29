import { BottomTabs } from "@/components/mobile/bottom-tabs"

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background shadow-soft-lg sm:my-0 sm:min-h-[100dvh] sm:max-w-md">
      <main className="flex-1 pt-[calc(5.5rem+env(safe-area-inset-top))] pb-24">
        {children}
      </main>
      <BottomTabs />
    </div>
  )
}
