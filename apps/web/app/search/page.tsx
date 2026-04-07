import { Suspense } from 'react';
import { SearchClient } from './search-client';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-4 text-center">Yükleniyor...</div>}>
      <SearchClient />
    </Suspense>
  );
}
