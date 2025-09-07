import "./globals.css";
import Link from "next/link";

export const metadata = { title: "GrowUP Onboarding RAG", description: "Starter" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <nav className="p-4 flex gap-4 text-sm bg-slate-900/30 backdrop-blur border-b border-white/10">
          <Link href="/login">Login</Link>
          <Link href="/wizard">Wizard</Link>
          <Link href="/confirmacao">Confirmação</Link>
          <Link href="/pre-plano/teste">Pré-Plano</Link>
          <Link href="/admin/config">Admin/Config</Link>
          <Link href="/admin/playbook">Admin/Playbook</Link>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
