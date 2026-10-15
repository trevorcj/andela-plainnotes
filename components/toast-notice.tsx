'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function ToastNotice({
  params
}: {
  params: { error?: string; message?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const notifiedRef = useRef<string | null>(null);

  useEffect(() => {
    const error = params?.error || searchParams.get('error');
    const message = params?.message || searchParams.get('message');
    const key = `${error || ''}:${message || ''}`;

    if ((error || message) && notifiedRef.current !== key) {
      notifiedRef.current = key;
      if (error) {
        toast.error(error);
      } else if (message) {
        toast.success(message);
      }

      // Clean searchParams from URL without full reload
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('error');
      newParams.delete('message');
      const query = newParams.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [params, searchParams, pathname, router]);

  return null;
}
