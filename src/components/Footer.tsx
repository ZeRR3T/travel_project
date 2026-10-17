'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, ArrowUp } from 'lucide-react';
import { useI18n } from '@/i18n/context/I18nContext';

export function Footer() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900/30 to-slate-900 text-white w-full">
      {/* Main Footer Content */}
      <div className="py-24 w-full">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Company Info */}
            <div className="mb-16">
              <div className="flex items-center justify-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-navbar">
                  <span className="text-white font-black text-xl">T</span>
                </div>
                <span className="text-2xl font-black text-gradient-accent">Travel Project</span>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed max-w-2xl mx-auto">
                {t('home.footer.companyDescription')}
              </p>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {supportEmail && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-navbar">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{t('home.footer.email')}</p>
                    <a className="font-medium text-lg" href={`mailto:${supportEmail}`}>
                      {supportEmail}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-navbar">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{t('home.footer.phone')}</p>
                  <p className="font-medium text-lg">+1 (800) 555-0123</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-navbar">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{t('home.footer.address')}</p>
                  <p className="font-medium text-lg">New York, USA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 w-full">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-6 text-sm text-slate-400 mb-4 md:mb-0">
              <span>&copy; {currentYear} Travel Project. {t('home.footer.allRightsReserved')}</span>
              <Link href="/privacy" className="hover:text-white transition-colors duration-200">
                {t('home.footer.privacyPolicy')}
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors duration-200">
                {t('home.footer.termsOfService')}
              </Link>
            </div>
            
            {/* Back to Top Button */}
            <button
              onClick={scrollToTop}
              className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-110 shadow-navbar hover:shadow-navbar-lg"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
