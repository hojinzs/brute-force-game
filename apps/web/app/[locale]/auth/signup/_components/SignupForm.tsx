"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SignUpParams } from "@/features/auth";

const COUNTRIES = [
  { code: "KR", name: "🇰🇷 Korea, Republic of" },
  { code: "US", name: "🇺🇸 United States" },
  { code: "JP", name: "🇯🇵 Japan" },
  { code: "CN", name: "🇨🇳 China" },
  { code: "GB", name: "🇬🇧 United Kingdom" },
  { code: "DE", name: "🇩🇪 Germany" },
  { code: "FR", name: "🇫🇷 France" },
  { code: "CA", name: "🇨🇦 Canada" },
  { code: "AU", name: "🇦🇺 Australia" },
  { code: "SG", name: "🇸🇬 Singapore" },
  { code: "ZZ", name: "🌍 Other" },
];

type SignupFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  country: string;
  emailConsent: boolean;
};

type SignupFormProps = {
  isAnonymousUpgrade?: boolean;
  signUpWithEmail: (params: SignUpParams) => Promise<unknown>;
};

const getFirstErrorMessage = (errors: FieldErrors<SignupFormValues>) => {
  for (const error of Object.values(errors)) {
    if (!error) continue;
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return null;
};

export function SignupForm({ isAnonymousUpgrade, signUpWithEmail }: SignupFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const isUpgrade = Boolean(isAnonymousUpgrade);

  const schema = useMemo(
    () =>
      z
        .object({
          email: z.string(),
          password: z.string(),
          confirmPassword: z.string(),
          nickname: z.string(),
          country: z.string().min(1, { message: t("auth.signup.selectCountry") }),
          emailConsent: z.boolean(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("auth.signup.passwordMismatch"),
          path: ["confirmPassword"],
        }),
    [t]
  );

  const { register, handleSubmit, formState } = useForm<SignupFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      nickname: "",
      country: "",
      emailConsent: false,
    },
  });

  const onValid = async (values: SignupFormValues) => {
    setBannerMessage(null);

    try {
      await signUpWithEmail({
        email: values.email,
        password: values.password,
        nickname: values.nickname,
        country: values.country,
        emailConsent: values.emailConsent,
        redirectTo: "/",
      });

      setBannerMessage(
        isUpgrade ? t("auth.signup.upgradeSuccess") : t("auth.signup.signupSuccess")
      );
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign up";
      setBannerMessage(message);
    }
  };

  const onInvalid = (errors: FieldErrors<SignupFormValues>) => {
    const message = getFirstErrorMessage(errors);
    if (message) {
      setBannerMessage(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-5">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
          {t("auth.email")}
        </label>
        <input
          type="email"
          id="email"
          required
          className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="agent@bruteforce.ai"
          {...register("email")}
        />
      </div>

      {/* Nickname & Country Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-slate-300 mb-2">
            {t("auth.signup.nickname")}
          </label>
          <input
            type="text"
            id="nickname"
            required
            minLength={2}
            maxLength={20}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Codename"
            {...register("nickname")}
          />
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-slate-300 mb-2">
            {t("auth.signup.country")}
          </label>
          <select
            id="country"
            required
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
            {...register("country")}
          >
            <option value="" disabled>
              {t("auth.signup.selectCountry")}
            </option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
          {t("auth.password")}
        </label>
        <input
          type="password"
          id="password"
          required
          minLength={6}
          className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="••••••••"
          {...register("password")}
        />
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
          {t("auth.signup.confirmPassword")}
        </label>
        <input
          type="password"
          id="confirmPassword"
          required
          minLength={6}
          className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="••••••••"
          {...register("confirmPassword")}
        />
      </div>

      {/* Email Consent */}
      <div className="flex items-start gap-3 pt-2">
        <input
          type="checkbox"
          id="emailConsent"
          className="mt-1 w-4 h-4 rounded border-slate-600 bg-[#1e293b] text-blue-500 focus:ring-blue-500/50"
          {...register("emailConsent")}
        />
        <label
          htmlFor="emailConsent"
          className="text-sm text-slate-400 leading-snug cursor-pointer select-none"
        >
          {t("auth.signup.emailConsent")}
        </label>
      </div>

      {/* Error Message */}
      {bannerMessage && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {bannerMessage}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={formState.isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-blue-900/20"
      >
        {formState.isSubmitting
          ? t("auth.signup.establishingLink")
          : isUpgrade
            ? t("auth.signup.confirmUpgrade")
            : t("auth.signup.initializeAccount")}
      </button>
    </form>
  );
}
