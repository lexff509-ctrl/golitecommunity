import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoLite Community Support — Plateforme d'Investissement",
  description:
    "Plateforme moderne de gestion d'investissements et de paiements pour la communauté GoLite.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
