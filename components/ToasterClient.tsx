'use client';

import { Toaster } from 'react-hot-toast';

export default function ToasterClient() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          zIndex: 999999,
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '13px',
        },
      }}
    />
  );
}
