export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background shadow-soft-lg sm:min-h-[100dvh] sm:max-w-md">
      {/* Decorative leaf-shaped backdrop in the brand palette */}
      <div
        aria-hidden="true"
        className="bg-primary/5 pointer-events-none absolute inset-x-0 top-0 h-56 rounded-b-[3rem]"
      />
      <div className="relative z-10 flex min-h-[100dvh] flex-col px-5 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  )
}
