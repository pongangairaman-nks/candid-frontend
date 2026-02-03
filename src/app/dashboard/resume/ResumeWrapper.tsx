'use client';

import { useState } from 'react';
import { ResumeListingScreen } from '@/components/ResumeListingScreen';
import ResumeGenerationPage from './page';

export function ResumeWrapper() {
  const [showListing, setShowListing] = useState(true);

  if (showListing) {
    return (
      <ResumeListingScreen 
        onCreateResume={() => setShowListing(false)} 
      />
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowListing(true)}
        className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-colors"
      >
        ← Back to Applications
      </button>
      <ResumeGenerationPage />
    </div>
  );
}
