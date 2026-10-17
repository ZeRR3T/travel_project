'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    // Получаем все cookies
    const allCookies = document.cookie;
    setCookies(allCookies);
    
    // Парсим cookies для лучшей отладки
    const cookieObj = allCookies.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    console.log(' Debug Page - All Cookies:', allCookies);
    console.log(' Debug Page - Parsed Cookies:', cookieObj);
    console.log(' Debug Page - Session Cookie:', cookieObj['__Secure-next-auth.session-token'] || cookieObj['next-auth.session-token']);
    console.log(' Debug Page - Session Status:', status);
    console.log(' Debug Page - Session Data:', session);
  }, [session, status]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Page</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Has Session:</strong> {session ? 'Yes' : 'No'}</p>
          <p><strong>User Email:</strong> {session?.user?.email || 'None'}</p>
          <p><strong>User ID:</strong> {session?.user?.id || 'None'}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">All Cookies</h2>
          <pre className="whitespace-pre-wrap text-sm">{cookies || 'No cookies found'}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Environment</h2>
          <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
          <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
}
