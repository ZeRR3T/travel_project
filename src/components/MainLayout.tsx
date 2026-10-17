'use client';

import { Header } from '@/components/Header';
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 w-full">
      <Header title={title} />
      
      {/* Main Content - на всю ширину экрана без ограничений */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
