
import { Suspense } from 'react';
import HomePageClient from './home-page-client';
import { Loader2 } from 'lucide-react';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen p-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <HomePageClient />
    </Suspense>
  );
}
