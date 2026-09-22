/**
 * StayCool Web Notifications Engine
 * Handles browser permission, Web Audio alert chime, and OS-level notifications.
 */

import { toast } from 'sonner';

export interface WebNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  silent?: boolean;
}

/**
 * Checks if Notification API is supported by the current browser.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Retrieves the current browser notification permission status.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests browser permission for web push/system notifications.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[WebNotifications] Error requesting permission:', err);
    return 'denied';
  }
}

/**
 * Plays a clean, high-end dual-tone bell chime using Web Audio API.
 * Synthesized dynamically without external MP3 files for zero latency and offline reliability.
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5) - soft bell attack
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: 880 Hz (A5) - uplifting harmonic ring
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.10);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.65);
  } catch (err) {
    // Non-fatal: browsers with strict autoplay policies may suppress unmuted audio until user clicks
    console.warn('[WebNotifications] Sound chime skipped:', err);
  }
}

/**
 * Dispatches an OS-level browser notification and concurrent in-app toast.
 */
export async function triggerWebNotification(options: WebNotificationOptions): Promise<void> {
  if (typeof window === 'undefined') return;

  const origin = window.location.origin || '';
  const {
    title,
    body,
    icon = `${origin}/assets/images/logo-round.png`,
    badge = `${origin}/assets/images/logo-round.png`,
    url = '/',
    tag = `staycool_${Date.now()}`,
    silent = false,
  } = options;

  // 1. Play audio chime alert
  if (!silent) {
    playNotificationSound();
  }

  // 2. Trigger rich in-app Toast notification via Sonner
  toast.info(title, {
    description: body,
    duration: 6000,
    action: url ? {
      label: 'View',
      onClick: () => {
        window.location.href = url;
      },
    } : undefined,
  });

  // 3. Dispatch native OS desktop / mobile notification
  if (isNotificationSupported()) {
    let perm = Notification.permission;

    if (perm === 'default') {
      try {
        perm = await Notification.requestPermission();
      } catch (permErr) {
        console.warn('[WebNotifications] Permission error:', permErr);
      }
    }

    if (perm === 'granted') {
      let shown = false;

      // Primary: Direct desktop Notification API (Instant OS popup on Windows/Mac)
      try {
        const notif = new Notification(title, {
          body,
          icon,
          badge,
          tag,
          requireInteraction: true,
        });

        notif.onclick = () => {
          window.focus();
          if (url) {
            window.location.href = url;
          }
          notif.close();
        };
        shown = true;
      } catch (desktopErr) {
        console.warn('[WebNotifications] Direct Notification note, trying ServiceWorker fallback:', desktopErr);
      }

      // Secondary: ServiceWorker showNotification fallback (e.g. mobile Android Chrome)
      if (!shown && 'serviceWorker' in navigator) {
        try {
          const reg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
          ]);
          if (reg && (reg as any).showNotification) {
            await (reg as any).showNotification(title, {
              body,
              icon,
              badge,
              tag,
              data: { url },
              vibrate: [100, 50, 100],
            });
          }
        } catch (swErr) {
          console.warn('[WebNotifications] ServiceWorker showNotification note:', swErr);
        }
      }
    } else {
      console.warn('[WebNotifications] Notification permission is not granted:', perm);
    }
  }
}
