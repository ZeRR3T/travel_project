import React from 'react';
import { Header } from '@/components/Header';

export default function PrivacyPage() {
  const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL;

  return (
    <>
      <Header title="Privacy Policy" />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-slate-700/50">
              <h1 className="text-4xl font-bold text-white mb-8 text-center">
                Privacy Policy
              </h1>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 mb-6">
                  <strong>Last updated:</strong> September 2, 2024
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  1. Information We Collect
                </h2>
                <p className="text-slate-300 mb-6">
                  We collect information you provide directly to us, such as when you create an account, 
                  make a booking, or contact us for support. This may include your name, email address, 
                  phone number, and travel preferences.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  2. How We Use Your Information
                </h2>
                <p className="text-slate-300 mb-6">
                  We use the information we collect to provide, maintain, and improve our services, 
                  process your bookings, communicate with you, and ensure the security of our platform.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  3. Information Sharing
                </h2>
                <p className="text-slate-300 mb-6">
                  We do not sell, trade, or otherwise transfer your personal information to third parties 
                  without your consent, except as described in this policy or as required by law.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  4. Data Security
                </h2>
                <p className="text-slate-300 mb-6">
                  We implement appropriate security measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  5. Your Rights
                </h2>
                <p className="text-slate-300 mb-6">
                  You have the right to access, update, or delete your personal information. 
                  You can also opt out of certain communications from us.
                </p>

                <h2 className="text-2xl font-semibold text-white mb-4">
                  6. Contact Us
                </h2>
                <p className="text-slate-300 mb-6">
                  If you have any questions about this Privacy Policy, please contact us using the contact details configured for this deployment.
                  {privacyEmail && (
                    <>
                      <br />
                      <strong>Email:</strong> <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
                    </>
                  )}
                  <br />
                  <strong>Address:</strong> Travel Project, New York, USA
                </p>

                <div className="mt-8 p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-slate-300 text-sm">
                    <strong>Note:</strong> This privacy policy applies to our website and mobile application. 
                    By using our services, you agree to the collection and use of information in accordance 
                    with this policy.
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
