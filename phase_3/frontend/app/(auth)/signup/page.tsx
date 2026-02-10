import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";
import Card from "@/components/ui/Card";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50">Create an account</h1>
          <p className="mt-2 text-sm text-slate-400">
            Get started with your task management
          </p>
        </div>

        <Card variant="elevated">
          <SignupForm />
        </Card>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
