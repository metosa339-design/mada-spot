'use client';

import { useEffect, useRef, useCallback } from 'react';

export type MessageChannelEvent = {
  type: 'new-message' | 'message-sent' | 'messages-read';
  threadId?: string;
  data?: any;
};

export function useMessageChannel(onMessage: (event: MessageChannelEvent) => void) {
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  const broadcast = useCallback((event: MessageChannelEvent) => {
    try {
      const bc = new BroadcastChannel('mada-messages');
      bc.postMessage(event);
      bc.close();
    } catch {
      // BroadcastChannel not supported
    }
  }, []);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('mada-messages');
      bc.onmessage = (event) => {
        callbackRef.current(event.data);
      };
    } catch {
      // BroadcastChannel not supported
    }

    return () => {
      bc?.close();
    };
  }, []);

  return { broadcast };
}
