import { IBM_Plex_Mono, Newsreader, Schibsted_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata = { title: "Nexo Assist" };

const display = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });
const ui = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted" });
const data = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${ui.variable} ${data.variable}`}>
      <body suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
