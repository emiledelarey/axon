import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
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

export const metadata: Metadata = {
  title: "Axon — The study tool students actually use",
  description:
    "Paste any study material. Axon builds you a daily practice loop with spaced repetition, error-classified micro-lessons, and a Socratic tutor.",
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
          colorTextSecondary: "#a09b85",
          colorNeutral: "#1f2847",
          colorInputBackground: "#0a0e1a",
          fontFamily: "var(--font-plex), 'IBM Plex Sans', system-ui, sans-serif",
        },
        elements: {
          card: { background: "#11172a", border: "1px solid #1f2847" },
          headerTitle: { fontFamily: "var(--font-serif), Georgia, serif", fontStyle: "italic" },
        },
      }}
    >
      <html lang="en" className={`${serif.variable} ${plex.variable} ${jet.variable}`}>
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
