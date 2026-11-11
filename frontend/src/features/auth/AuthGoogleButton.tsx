'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export interface AuthGoogleButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  onCredential?: (credential: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

/**
 * Komponen Tombol SSO Google
 * Mendukung Google Identity Services (GIS) native jika NEXT_PUBLIC_GOOGLE_CLIENT_ID tersedia,
 * atau graceful fallback/notice/mock dev jika belum dikonfigurasi.
 */
export function AuthGoogleButton({ disabled = false, onClick, onCredential }: AuthGoogleButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isDev = process.env.NODE_ENV !== 'production';
  const hiddenBtnRef = useRef<HTMLDivElement>(null);
  const [gisLoaded, setGisLoaded] = useState(false);

  useEffect(() => {
    if (!clientId || !window.google?.accounts?.id || !onCredential) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            onCredential(response.credential);
          }
        },
      });

      if (hiddenBtnRef.current) {
        hiddenBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(hiddenBtnRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          width: 360,
        });
      }

      // Trigger Google One Tap auto-prompt jika didukung browser
      window.google.accounts.id.prompt();
    } catch (err) {
      console.error('Failed to initialize Google Identity Services:', err);
    }
  }, [clientId, gisLoaded, onCredential]);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (!clientId) {
      if (isDev && onCredential) {
        // Mode dev/local fallback: login dengan token mock terstandarisasi
        const mockDevToken = `MOCK_GOOGLE_dev-sub-123_dev.rider@armexhaust.id_${encodeURIComponent('ARM Test Rider')}`;
        onCredential(mockDevToken);
        return;
      }
      alert('Google Client ID belum dikonfigurasi di environment (NEXT_PUBLIC_GOOGLE_CLIENT_ID).');
      return;
    }

    // Fallback prompt jika overlay tidak terklik langsung
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <>
      {clientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setGisLoaded(true)}
        />
      )}
      <div className="relative w-full overflow-hidden rounded-2xl">
        {/* Google GSI Native Rendered Overlay (Transparan presisi di atas tombol kustom) */}
        {clientId && (
          <div
            ref={hiddenBtnRef}
            className="absolute inset-0 z-10 flex w-full items-center justify-center opacity-[0.0001] cursor-pointer overflow-hidden scale-110 rounded-2xl"
            title="Continue with Google"
          />
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={handleClick}
          title={!clientId ? 'Google SSO (Mode simulasi pengujian lokal)' : 'Continue with Google'}
          aria-label="Continue with Google account"
          className="relative flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#2B2B30] bg-[#141416] px-4 py-2 text-[12px] font-medium text-white transition hover:border-[#44444C] hover:bg-[#1A1A1E] focus:outline-none focus:ring-2 focus:ring-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="shrink-0">
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2 3.5-5 3.5-8.6"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.14.01-3.6 2.8-.05.13C3.3 21.3 7.3 24 12 24"
            />
            <path
              fill="#FBBC05"
              d="M5.2 14.4c-.24-.7-.38-1.5-.38-2.4s.14-1.7.36-2.4l-.01-.16L1.5 6.6l-.12.06C.5 8.2 0 10 0 12s.5 3.8 1.38 5.3z"
            />
            <path
              fill="#EA4335"
              d="M12 4.6c2.2 0 3.7.95 4.6 1.8l3.3-3.2C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.4 6.7l3.8 2.9c1-2.9 3.7-5 6.8-5"
            />
          </svg>
          <span>Continue with Google</span>
          {!clientId && isDev && (
            <span className="ml-1 rounded-md bg-[#2B2B30] px-1.5 py-0.5 text-[10px] font-medium text-[#9AA0A8]">
              Demo
            </span>
          )}
        </button>
      </div>
    </>
  );
}
