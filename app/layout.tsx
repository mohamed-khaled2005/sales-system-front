import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
export const metadata: Metadata = { title: { default:"Agency Command Center", template:"%s | Agency OS" }, description:"Integrated agency sales, production, finance and performance workspace." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="ar" dir="rtl" suppressHydrationWarning><body className="app-noise"><Providers>{children}</Providers></body></html>; }
