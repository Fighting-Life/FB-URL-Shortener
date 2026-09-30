import {
  adminClient,
  emailOTPClient,
  twoFactorClient,
  usernameClient
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    emailOTPClient(),
    usernameClient(),
    twoFactorClient({
      twoFactorPage: '/2fa'
    })
  ]
});

export const { signIn, signUp, signOut, useSession } = authClient;
