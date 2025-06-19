import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <main className="mx-auto flex h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] w-full max-w-[40rem] flex-col items-center justify-center px-4">
      <RegisterForm />
    </main>
  )
}
