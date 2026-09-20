import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import type { ChatMessage } from './types';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

export type EchoInstance = InstanceType<typeof Echo>;

export function setupEcho(token: string): EchoInstance {
  if (typeof window !== 'undefined') {
    window.Pusher = Pusher;
  }
  return new Echo({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
}

// Shape of e.message from MessageSent event
export interface EchoMessagePayload {
  message: {
    id: number;
    chat_id: number;
    sender_id: number;
    message: string;
    is_read: number;
    created_at: string;
    sender: {
      id: number;
      full_name: string;
      role: string;
    };
  };
}

export function mapEchoMessage(m: EchoMessagePayload['message']): ChatMessage {
  return {
    id: String(m.id),
    sender: m.sender?.role === 'admin' ? 'agent' : 'user',
    senderName: m.sender?.full_name ?? (m.sender?.role === 'admin' ? 'Admin' : 'User'),
    text: m.message,
    timeLabel: new Date(m.created_at).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}
