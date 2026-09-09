import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { loadAllData } from "@/lib/csv";
import { DataProvider } from "@/lib/state/DataContext";
import { ToastProvider } from "@/components/common/Toast";
import Shell from "@/components/layout/Shell";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "VulnOps | Enterprise Vulnerability Management",
  description: "Centralized vulnerability management: scanner intake, triage, remediation, and MIS reporting.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const data = loadAllData();

  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans`} style={{ height: "100%" }}>
        <ToastProvider>
          <DataProvider initial={data}>
            <Suspense fallback={null}>
              <Shell>{children}</Shell>
            </Suspense>
          </DataProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
