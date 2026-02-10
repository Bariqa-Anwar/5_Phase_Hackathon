import Link from "next/link";
import { CheckCircle, ListTodo, Shield } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-slate-50 mb-6">
            Task Manager
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Organize your work, track your progress, and achieve your goals with our
            secure and intuitive task management platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Log In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-lg mb-4">
              <ListTodo className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">Simple Task Management</h3>
            <p className="text-slate-400">
              Create, update, and organize your tasks with an intuitive interface
              designed for productivity.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-lg mb-4">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">Secure & Private</h3>
            <p className="text-slate-400">
              Your data is protected with enterprise-grade security and JWT
              authentication.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-lg mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">Track Progress</h3>
            <p className="text-slate-400">
              Monitor task status and stay organized with clear visual indicators
              and filtering options.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-500">
          <p>Built with Next.js 16, TypeScript, and Better Auth</p>
        </div>
      </footer>
    </div>
  );
}
