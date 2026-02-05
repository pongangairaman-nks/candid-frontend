'use client';

import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/Auth';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push('/dashboard/jobs');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Candid</h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        {/* Login Form Component */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8">
          <LoginForm 
            onSuccess={handleLoginSuccess}
            onSwitchToSignup={() => router.push('/signup')}
          />
        </div>
      </div>
    </div>
  );
}
