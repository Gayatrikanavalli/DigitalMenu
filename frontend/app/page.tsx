'use client';

import dynamic from 'next/dynamic';

// Dynamically load the client app to ensure client-side window/localStorage safety
const App = dynamic(() => import('../../src/App'), { ssr: false });

export default function Page() {
  return <App />;
}
