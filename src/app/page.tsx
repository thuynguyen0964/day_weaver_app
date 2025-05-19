
import { Suspense } from 'react';
import HomePageClient from './home-page-client';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen p-4 text-center">Loading page content...</div>}>
      <HomePageClient />
    </Suspense>
  );
}
