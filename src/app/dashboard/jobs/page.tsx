'use client';

import { ResumeListingScreen } from '@/components/ResumeListingScreen';
import { useRouter } from 'next/navigation';

export default function JobsListingPage() {
  const router = useRouter();

  const handleCreateResume = () => {
    router.push('/dashboard/resume/generate');
  };

  return <ResumeListingScreen onCreateResume={handleCreateResume} />;
}
