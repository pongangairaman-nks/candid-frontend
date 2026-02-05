'use client';

import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/Auth';

export default function SignupPage() {
  const router = useRouter();

  const handleSignupSuccess = () => {
    router.push('/dashboard/jobs');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Candid</h1>
          <p className="text-slate-400">Create your account</p>
        </div>

        {/* Signup Form Component */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8">
          <SignupForm 
            onSuccess={handleSignupSuccess}
            onSwitchToLogin={() => router.push('/login')}
          />
        </div>
      </div>
    </div>
  );
}
