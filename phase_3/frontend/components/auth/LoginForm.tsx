"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { clearTokenCache } from "@/lib/api-client";
import { validateEmail } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await signIn.email(
        {
          email: formData.email,
          password: formData.password,
        },
        {
          onSuccess: () => {
            clearTokenCache();
            router.push("/dashboard");
          },
          onError: (ctx) => {
            setErrors({
              submit: ctx.error.message || "Invalid email or password",
            });
          },
        }
      );
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        placeholder="you@example.com"
        required
        fullWidth
      />

      <Input
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        placeholder="••••••••"
        required
        fullWidth
      />

      <div className="flex items-center">
        <input
          type="checkbox"
          id="rememberMe"
          checked={formData.rememberMe}
          onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
          className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-300">
          Remember me
        </label>
      </div>

      {errors.submit && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {errors.submit}
        </div>
      )}

      <Button type="submit" isLoading={isLoading} fullWidth>
        Log In
      </Button>
    </form>
  );
}
