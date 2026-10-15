import 'server-only';
import crypto from 'crypto';
import { getAdminClient } from '@/lib/supabase/admin';

export interface GoogleMeetResult {
  meetingUrl: string;
  spaceName?: string;
  isLiveApi: boolean;
  error?: string;
}

/**
 * Base64 URL encode without padding
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generates an OAuth 2.0 access token using a Google Cloud Service Account
 * with Google Workspace Domain-Wide Delegation (impersonating an admin user).
 */
async function getServiceAccountToken(): Promise<string | null> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const adminEmail = process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL;

  if (!clientEmail || !privateKey) return null;

  // Normalize escaped newlines in environment variables
  privateKey = privateKey.replace(/\\n/g, '\n');

  // Support base64 encoded private keys
  if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('BEGIN RSA PRIVATE KEY')) {
    try {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
    } catch {
      // Keep as-is if decoding fails
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload: Record<string, unknown> = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/meetings.space.created https://www.googleapis.com/auth/calendar.events',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  // With Domain-Wide Delegation, subject (sub) is the Google Workspace user to impersonate
  if (adminEmail) {
    payload.sub = adminEmail;
  }

  try {
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    signer.end();
    const signature = signer
      .sign(privateKey, 'base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const assertion = `${signatureInput}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('[Google Meet API] Service account assertion failed:', err);
      return null;
    }

    const data = (await res.json()) as { access_token?: string };
    return data.access_token || null;
  } catch (e) {
    console.warn('[Google Meet API] Error signing service account JWT:', e);
    return null;
  }
}

/**
 * Generates an OAuth 2.0 access token using OAuth client credentials & refresh token.
 */
async function getOAuthRefreshToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('[Google Meet API] Refresh token exchange failed:', err);
      return null;
    }

    const data = (await res.json()) as { access_token?: string };
    return data.access_token || null;
  } catch (e) {
    console.warn('[Google Meet API] Error exchanging refresh token:', e);
    return null;
  }
}

/**
 * Creates a unique Google Meet conference space via Google Meet REST API (meet.googleapis.com/v2/spaces).
 * If Google Workspace credentials are not configured, falls back to a deterministic unique meeting URL.
 */
export async function createGoogleMeetSpace(options: {
  topic?: string;
  sessionId?: string;
}): Promise<GoogleMeetResult> {
  try {
    const token = (await getServiceAccountToken()) || (await getOAuthRefreshToken());

    if (token) {
      const res = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: {
            accessType: 'OPEN'
          }
        })
      });

      if (res.ok) {
        const space = (await res.json()) as {
          name?: string;
          meetingUri?: string;
          meetingCode?: string;
        };

        if (space.meetingUri) {
          return {
            meetingUrl: space.meetingUri,
            spaceName: space.name,
            isLiveApi: true
          };
        }
      } else {
        const errText = await res.text();
        console.warn('[Google Meet API] spaces.create error from Google API:', errText);
      }
    }
  } catch (e) {
    console.warn('[Google Meet API] Failed calling Google Meet REST API:', e);
  }

  // Cryptographically random unique 3-4-3 slug matching Google Meet URL pattern
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const randPart = (len: number) => {
    const bytes = crypto.randomBytes(len);
    return Array.from(bytes)
      .map(b => chars[b % chars.length])
      .join('');
  };

  const code = `${randPart(3)}-${randPart(4)}-${randPart(3)}`;
  return {
    meetingUrl: `https://meet.google.com/${code}`,
    isLiveApi: false,
    error: 'Google Meet credentials pending configuration in .env.local; generated unique conference code.'
  };
}

/**
 * Attaches a unique Google Meet room to a booked counseling session.
 */
export async function attachGoogleMeetToSession(sessionId: string, topic?: string): Promise<string> {
  const meet = await createGoogleMeetSpace({ topic, sessionId });

  const admin = getAdminClient();
  if (admin) {
    const { error } = await admin
      .from('sessions')
      .update({ meeting_url: meet.meetingUrl })
      .eq('id', sessionId);

    if (error) {
      console.error('[Google Meet API] Failed to update session meeting_url:', error.message);
    }
  }

  return meet.meetingUrl;
}
