import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import Card from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">
            Log in to your account to continue
          </p>
        </div>

        <Card variant="elevated">
          <LoginForm />
        </Card>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium text-emerald-400 hover:text-emerald-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
