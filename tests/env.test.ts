import {it,expect} from 'vitest';import {isPublishableKey} from '../lib/env';
const jwt=(role:string)=>'header.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.signature';
it('accepts modern publishable keys',()=>expect(isPublishableKey('sb_publishable_'+ 'a'.repeat(32))).toBe(true));
it('accepts the legacy anon role',()=>expect(isPublishableKey(jwt('anon'))).toBe(true));
it('rejects a service-role JWT',()=>expect(isPublishableKey(jwt('service_role'))).toBe(false));
it('rejects modern secret keys',()=>expect(isPublishableKey('sb_secret_'+ 'a'.repeat(32))).toBe(false));
it('rejects malformed credentials',()=>expect(isPublishableKey('not-a-key')).toBe(false));
