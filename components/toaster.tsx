'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: '#09090b',
          color: '#fafafa',
          border: '1px solid #27272a',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
          padding: '12px 16px'
        }
      }}
    />
  );
}
