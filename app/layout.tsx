import type { Metadata } from "next";
import "./globals.css";
import { logout } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Planificación de contenidos — Cami",
  description: "Panel de planificación de contenidos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50">
        <header className="bg-dismaser-navy px-4 py-3">
          <div className="mx-auto max-w-4xl flex items-center gap-3">
            <span className="text-xl">🎬</span>
            <span className="text-lg font-semibold text-white">Planificación de contenidos</span>
            <span className="ml-2 rounded-full bg-dismaser-maroon px-2.5 py-0.5 text-xs font-medium text-white">Cami</span>
            <form action={logout} className="ml-auto">
              <button type="submit" className="text-xs text-slate-300 hover:text-white transition-colors">
                Salir
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
