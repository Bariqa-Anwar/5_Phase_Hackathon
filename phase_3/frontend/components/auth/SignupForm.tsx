"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { clearTokenCache } from "@/lib/api-client";
import { validateEmail, validatePassword } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
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
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      await signUp.email(
        {
          email: formData.email,
          password: formData.password,
          name: formData.name || formData.email,
        },
        {
          onSuccess: () => {
            clearTokenCache();
            router.push("/dashboard");
          },
          onError: (ctx) => {
            setErrors({
              submit:
                ctx.error.message || "Failed to sign up. Please try again.",
            });
          },
        }
      );
    } catch (error) {
      console.error("Signup error:", error);
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
        label="Name"
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Your name (optional)"
        fullWidth
      />

      <Input
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        helperText="Minimum 8 characters"
        placeholder="••••••••"
        required
        fullWidth
      />

      <Input
        label="Confirm Password"
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        error={errors.confirmPassword}
        placeholder="••••••••"
        required
        fullWidth
      />

      {errors.submit && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {errors.submit}
        </div>
      )}

      <Button type="submit" isLoading={isLoading} fullWidth>
        Sign Up
      </Button>
    </form>
  );
}
