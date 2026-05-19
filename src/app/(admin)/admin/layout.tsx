import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/library');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="flex">
        {/* Simple Admin Sidebar */}
        <aside className="w-64 border-r border-white/10 p-8 flex flex-col gap-8 h-screen sticky top-0">
          <div className="font-black text-2xl tracking-tighter italic">COMET ADMIN</div>
          <nav className="flex flex-col gap-4">
            <a href="/admin" className="text-sm font-bold text-comet-accent">Dashboard</a>
            <a href="/admin/users" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Users</a>
            <a href="/admin/billing" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Billing</a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-12">
          {children}
        </main>
      </div>
    </div>
  );
}
