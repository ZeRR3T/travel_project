import React from 'react';
import { Header } from '@/components/Header';

export default function TermsPage() {
  const legalEmail = process.env.NEXT_PUBLIC_LEGAL_EMAIL;

  return (
    <>
      <Header title="Terms of Service" />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-slate-700/50">
              <h1 className="text-4xl font-bold text-white mb-8 text-center">
                Terms of Service
              </h1>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 mb-6">
                  <strong>Last updated:</strong> September 2, 2024
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-slate-300 mb-6">
                  By accessing and using Travel Project services, you accept and agree to be bound by 
                  the terms and provision of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  2. Description of Service
                </h2>
                <p className="text-slate-300 mb-6">
                  Travel Project provides travel booking services including flights, hotels, car rentals, 
                  and other travel-related services. We act as an intermediary between you and travel 
                  service providers.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  3. User Accounts
                </h2>
                <p className="text-slate-300 mb-6">
                  You are responsible for maintaining the confidentiality of your account information 
                  and for all activities that occur under your account. You must be at least 18 years 
                  old to create an account.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  4. Booking and Payment
                </h2>
                <p className="text-slate-300 mb-6">
                  All bookings are subject to availability and confirmation. Payment is required at 
                  the time of booking. Prices are subject to change without notice until confirmed.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  5. Cancellation and Refunds
                </h2>
                <p className="text-slate-300 mb-6">
                  Cancellation policies vary by service provider. Refunds are processed according to 
                  the provider&apos;s terms and conditions. Service fees are non-refundable.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  6. Prohibited Uses
                </h2>
                <p className="text-slate-300 mb-6">
                  You may not use our services for any unlawful purpose or to solicit others to perform 
                  unlawful acts. You may not violate any international, federal, provincial, or state 
                  regulations, rules, laws, or local ordinances.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  7. Limitation of Liability
                </h2>
                <p className="text-slate-300 mb-6">
                  Travel Project shall not be liable for any indirect, incidental, special, consequential, 
                  or punitive damages resulting from your use of the service.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  8. Changes to Terms
                </h2>
                <p className="text-slate-300 mb-6">
                  We reserve the right to modify these terms at any time. Changes will be effective 
                  immediately upon posting. Your continued use of the service constitutes acceptance 
                  of the modified terms.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  9. Contact Information
                </h2>
                <p className="text-slate-300 mb-6">
                  If you have any questions about these Terms of Service, please contact us using the contact details configured for this deployment.
                  {legalEmail && (
                    <>
                      <br />
                      <strong>Email:</strong> <a href={`mailto:${legalEmail}`}>{legalEmail}</a>
                    </>
                  )}
                  <br />
                  <strong>Address:</strong> Travel Project, New York, USA
                </p>

                <div className="mt-8 p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-slate-300 text-sm">
                    <strong>Note:</strong> These terms apply to all users of our website and mobile application. 
                    By using our services, you acknowledge that you have read, understood, and agree to 
                    be bound by these terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
