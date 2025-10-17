// Lightweight loader for OneSignal Web SDK v2 via CDN (no Vite plugin required)
declare global {
  interface Window { OneSignalDeferred?: Array<(sdk: any) => void>; __onesignalInited?: boolean }
}

export function initOneSignal() {
  const appId = import.meta.env.VITE_PUBLIC_ONESIGNAL_APP_ID as string | undefined;
  if (!appId || typeof window === 'undefined') return;
  const w = window as any;
  if (w.__onesignalInited) return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      if (w.__onesignalInited) return;
      await OneSignal.init({ appId, allowLocalhostAsSecureOrigin: true });
      w.__onesignalInited = true;
      // Uncomment to show prompt automatically:
      OneSignal.Slidedown.promptPush();
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase();
      if (!msg.includes('already initialized')) {
        console.error('OneSignal init failed', e);
      } else {
        w.__onesignalInited = true;
      }
    }
  });

  if (!document.getElementById('onesignal-sdk')) {
    const s = document.createElement('script');
    s.id = 'onesignal-sdk';
    s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    s.async = true;
    document.head.appendChild(s);
  }
}

export function onesignalLogin(externalId: string) {
  if (typeof window === 'undefined' || !externalId) return;
  const w = window as any;
  const call = (sdk: any) => {
    try { sdk.login(String(externalId)); } catch (e) { console.warn('OneSignal login failed', e); }
  };
  if (w.OneSignal && typeof w.OneSignal.login === 'function') {
    call(w.OneSignal);
  } else {
    w.OneSignalDeferred = w.OneSignalDeferred || [];
    w.OneSignalDeferred.push(call);
  }
}


