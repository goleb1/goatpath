import { useEffect, useState } from 'react';
import { event2026 } from '../data/event2026';
import { createPreviewEvent, isPreviewMode } from '../data/previewEvent';
import { firebaseConfigured, subscribeToEvent } from '../firebase';
import type { Event, Freshness } from '../types/Event';

export function useLiveEvent() {
  const previewMode = !firebaseConfigured
    ? new URLSearchParams(window.location.search).get('preview')
    : null;
  const preview = isPreviewMode(previewMode) ? previewMode : null;
  const [event, setEvent] = useState<Event>(() => preview ? createPreviewEvent(preview) : event2026);
  const [source, setSource] = useState<Exclude<Freshness, 'stale'>>(firebaseConfigured || preview ? 'live' : 'offline');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    if (preview) {
      return () => window.clearInterval(timer);
    }
    const unsubscribe = subscribeToEvent(
      (liveEvent) => {
        setEvent(liveEvent);
        setSource('live');
      },
      () => setSource(firebaseConfigured ? 'error' : 'offline'),
      (connected) => { if (!connected) setSource('offline'); },
    );
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [preview]);

  return { event, source, now };
}
