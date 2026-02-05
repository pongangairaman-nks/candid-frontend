'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { LoginForm, SignupForm } from '@/components/Auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isSignup, setIsSignup] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard/jobs');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Resume AI</h1>
            <p className="text-slate-600 dark:text-slate-400">Optimize your resume for ATS</p>
          </div>

          {isSignup ? (
            <SignupForm
              onSuccess={() => setIsSignup(false)}
              onSwitchToLogin={() => setIsSignup(false)}
            />
          ) : (
            <LoginForm
              onSuccess={() => {}}
              onSwitchToSignup={() => setIsSignup(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
