import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

// Fraunces is our display face — variable-weight serif with enough character
// for headlines and enough weight range that upright 500 reads confident, not
// thin. Italic still carries emphasis via .italic-serif at a lighter weight.
const serif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jet = JetBrains_Mono({
  variable: "--font-jet",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axon.study";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Axon — won't write your essay; will make you smarter",
    template: "%s · Axon",
  },
  description:
    "Axon is a Socratic study companion for university students. Spaced repetition, mock exams, a writing coach that won't ghost-write, and a tutor that quizzes back instead of monologuing.",
  applicationName: "Axon",
  keywords: [
    "study app",
    "spaced repetition",
    "flashcards",
    "AI tutor",
    "essay coach",
    "mock exam",
    "university",
    "Socratic tutor",
  ],
  authors: [{ name: "Napkin Group" }],
  creator: "Napkin Group",
  publisher: "Napkin Group",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: SITE_URL,
    siteName: "Axon",
    title: "Axon — won't write your essay; will make you smarter",
    description:
      "Spaced repetition on your own notes, a tutor that quizzes back, and a writing coach that refuses to ghost-write. Built for university students who actually want to learn.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Axon — won't write your essay; will make you smarter",
    description:
      "Spaced repetition, mock exams, a writing coach that refuses to ghost-write. For students who actually want to learn.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "education",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#00e6a8",
          colorBackground: "#11172a",
          colorText: "#eeead8",
          colorTextSecondary: "#c9c4ad",
          colorTextOnPrimaryBackground: "#0a0e1a",
          colorInputBackground: "#0a0e1a",
          colorInputText: "#eeead8",
          colorNeutral: "#1f2847",
          colorDanger: "#e56f4c",
          colorSuccess: "#00e6a8",
          colorWarning: "#ffaa3d",
          fontFamily: "var(--font-plex), 'IBM Plex Sans', system-ui, sans-serif",
        },
        elements: {
          rootBox: { width: "100%" },
          card: {
            background: "#11172a",
            border: "1px solid #1f2847",
            boxShadow: "0 24px 48px -16px rgba(0,0,0,0.5)",
          },
          headerTitle: {
            fontFamily: "var(--font-serif), Georgia, serif",
            fontStyle: "italic",
            color: "#eeead8",
            fontSize: "1.6rem",
          },
          headerSubtitle: { color: "#c9c4ad" },
          formFieldLabel: { color: "#eeead8", fontWeight: 500 },
          formFieldInput: {
            color: "#eeead8",
            background: "#0a0e1a",
            borderColor: "#2e3a6b",
            "&::placeholder": { color: "#6b6754" },
            "&:focus": { borderColor: "#00e6a8", boxShadow: "0 0 0 1px #00e6a8" },
          },
          formFieldInputShowPasswordButton: { color: "#c9c4ad" },
          formButtonPrimary: {
            background: "#00e6a8",
            color: "#0a0e1a",
            fontWeight: 600,
            "&:hover": { background: "#00b386" },
            "&:focus": { background: "#00b386", boxShadow: "0 0 0 2px rgba(0,230,168,0.4)" },
          },
          footerActionText: { color: "#c9c4ad" },
          footerActionLink: { color: "#00e6a8", fontWeight: 500 },
          identityPreviewText: { color: "#eeead8" },
          identityPreviewEditButton: { color: "#00e6a8" },
          dividerLine: { background: "#1f2847" },
          dividerText: { color: "#a09b85" },
          socialButtonsBlockButton: {
            borderColor: "#2e3a6b",
            color: "#eeead8",
            "&:hover": { background: "#1a2040" },
          },
          formResendCodeLink: { color: "#00e6a8" },
          otpCodeFieldInput: { color: "#eeead8", background: "#0a0e1a", borderColor: "#2e3a6b" },
          alertText: { color: "#eeead8" },
          formFieldErrorText: { color: "#e56f4c" },
          formFieldHintText: { color: "#a09b85" },
          formFieldSuccessText: { color: "#00e6a8" },
        },
      }}
    >
      <html lang="en" className={`${serif.variable} ${plex.variable} ${jet.variable}`}>
        <body>
          <Providers>{children}</Providers>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
