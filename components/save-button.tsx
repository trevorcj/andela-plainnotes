'use client';
import { useActionState, useEffect } from 'react';
import { Heart, X } from 'lucide-react';
import { toast } from 'sonner';
import { toggleSave, removeSavedItem } from '@/app/app/saved/actions';

export function SaveButton({
  kind,
  id,
  saved
}: {
  kind: 'courses' | 'universities' | 'careers';
  id: string;
  saved: boolean;
}) {
  const [state, action, pending] = useActionState(toggleSave.bind(null, kind, id), {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form action={action}>
      <button
        className={`save-button ${saved ? 'saved' : ''}`}
        aria-label={saved ? 'Unsave item' : 'Save item'}
        aria-pressed={saved}
        disabled={pending}
      >
        <Heart size={16} />
      </button>
    </form>
  );
}

export function RemoveSavedButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(removeSavedItem.bind(null, id), {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form action={action}>
      <button className="btn light sm" disabled={pending}>
        Remove <X size={14} />
      </button>
    </form>
  );
}
