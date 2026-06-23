import LoginForm from "./LoginForm"

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F1923] px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold text-white">Admin Login</h1>
        <p className="mb-8 text-sm text-[#94A3B8]">Laxami Man and Van — admin panel</p>
        <LoginForm callbackUrl={callbackUrl ?? "/admin"} />
      </div>
    </div>
  )
}
