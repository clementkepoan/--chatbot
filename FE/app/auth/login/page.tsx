import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <main className="mx-auto flex h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] w-full max-w-[40rem] flex-col items-center justify-center px-4">
      <LoginForm />
    </main>
  )
}
