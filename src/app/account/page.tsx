'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import GoogleButton from '@/components/GoogleButton';
import { Header } from '@/components/Header';
import { useI18n } from '@/i18n/context/I18nContext';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  // If not authenticated, redirect to login page
  if (status === 'loading') {
    return (
      <>
        <Header title={t('pages.account.title')} />
        <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto shadow-navbar"></div>
          <p className="mt-6 text-2xl text-slate-300 font-medium">{t('common.loading')}</p>
        </div>
        </div>
      </>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleSignOut = async () => {
    setLoading(true);
    await signOut({ callbackUrl: '/' });
  };

  const handleLinkGoogle = () => {
    // Redirect to Google sign-in page for linking
    router.push('/api/auth/signin/google?callbackUrl=/account');
  };

  return (
    <>
      <Header title={t('pages.account.title')} />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-navbar">
            {/* Header */}
            <div className="px-8 py-8 border-b border-slate-600/30">
              <h1 className="text-4xl font-black text-white mb-3">{t('pages.account.title')}</h1>
              <p className="text-xl text-slate-300 font-medium">
                {t('pages.account.description')}
              </p>
            </div>

            {/* User Information */}
            <div className="px-8 py-8 border-b border-slate-600/30">
              <h2 className="text-2xl font-bold text-white mb-6">{t('pages.account.profile')}</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-navbar flex-shrink-0">
                    {session?.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt="Profile" 
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="text-white font-black text-xl sm:text-2xl md:text-3xl">
                        {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="ml-4 sm:ml-6 flex-1 min-w-0">
                    <p className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 truncate">
                      {session?.user?.name || t('common.unknown')}
                    </p>
                    <p className="text-sm sm:text-lg text-slate-300 truncate">{session?.user?.email}</p>
                  </div>
                </div>
                
                <div className="text-lg text-slate-300">
                  <span className="font-bold">{t('pages.account.signInMethod')}:</span>{' '}
                  <span className="capitalize">
                    {(session?.user as any)?.provider === 'google' ? 'Google OAuth' : t('pages.account.emailPassword')}
                  </span>
                </div>
              </div>
            </div>

            {/* Connected Accounts */}
            <div className="px-8 py-8 border-b border-slate-600/30">
              <h2 className="text-2xl font-bold text-white mb-6">{t('pages.account.connectedAccounts')}</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-navbar flex-shrink-0">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                      <p className="text-base sm:text-lg font-bold text-white truncate">Google</p>
                      <p className="text-sm sm:text-base text-slate-300 truncate">
                        {(session?.user as any)?.provider === 'google' ? t('pages.account.connected') : t('pages.account.notConnected')}
                      </p>
                    </div>
                  </div>
                  {(session?.user as any)?.provider === 'google' ? (
                    <button
                      onClick={handleSignOut}
                      disabled={loading}
                      className="px-3 sm:px-4 py-2 text-sm sm:text-base font-bold text-red-400 border border-red-500/30 rounded-xl sm:rounded-2xl hover:bg-red-500/20 disabled:opacity-50 transition-all duration-300 backdrop-blur-md whitespace-nowrap"
                    >
                      {loading ? t('common.loading') : t('pages.account.disconnect')}
                    </button>
                  ) : (
                    <button
                      onClick={handleLinkGoogle}
                      className="px-3 sm:px-4 py-2 text-sm sm:text-base font-bold text-blue-400 border border-blue-500/30 rounded-xl sm:rounded-2xl hover:bg-blue-500/20 transition-all duration-300 backdrop-blur-md whitespace-nowrap"
                    >
                      {t('pages.account.connect')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="px-8 py-8">
              <h2 className="text-2xl font-bold text-white mb-6">{t('pages.account.actions')}</h2>
              <div className="space-y-3">
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-navbar text-lg font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-300 hover:scale-105"
                >
                  {loading ? t('common.loading') : t('auth.signOut')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
