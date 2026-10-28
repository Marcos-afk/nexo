import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Nexo Assist" };

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
