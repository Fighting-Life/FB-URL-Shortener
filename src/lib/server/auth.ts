import { getRequestEvent } from '$app/server';
import {
  APP_NAME,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  NODE_ENV,
  ORIGIN
} from '$env/static/private';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth/minimal';
import { admin, emailOTP, twoFactor, username } from 'better-auth/plugins';
import { adminAc, userAc } from 'better-auth/plugins/admin/access';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { sendEmail } from './email';
const authBaseURL = BETTER_AUTH_URL || ORIGIN || 'http://localhost:5173';
const authURL = new URL(authBaseURL);
const useSecureCookies = NODE_ENV === 'production' && authURL.protocol === 'https:';

export const auth = betterAuth({
  appName: APP_NAME || 'Link Shift',
  baseURL: authBaseURL,
  secret: BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      twoFactor: schema.twoFactor,
      userRelations: schema.userRelations,
      sessionRelations: schema.sessionRelations,
      accountRelations: schema.accountRelations,
      twoFactorRelations: schema.twoFactorRelations,
    }
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true
  },
  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET
    }
  },
  user: {
    changeEmail: {
      enabled: true
    },
    additionalFields: {
      username: { type: 'string', required: false },
      phone: { type: 'string', required: false },
      displayUsername: { type: 'string', required: false },
      role: { type: 'string', required: false, input: false },
      status: { type: 'string', required: false, input: false },
      banned: { type: 'boolean', required: false, input: false },
      banReason: { type: 'string', required: false, input: false },
      banExpires: { type: 'date', required: false, input: false },
      twoFactorEnabled: { type: 'boolean', required: false, input: false }
    }
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID()
    },
    cookiePrefix: 'x-link-cloacking-',
    useSecureCookies,
    crossSubDomainCookies: {
      enabled: false
    }
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
      roles: {
        user: userAc,
        admin: adminAc
      }
    }),
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      otpLength: 6,
      expiresIn: 10 * 60,
      allowedAttempts: 5,
      resendStrategy: 'reuse',
      async sendVerificationOTP({ email, otp, type }) {
        if (type === 'sign-in') {
          await sendEmail({
            to: email,
            subject: `Sign in to ${APP_NAME}`,
            html: `<p>Your sign-in code is: <b>${otp}</b>. It expires in 1 hour.</p>`
          });
        } else if (type === 'email-verification') {
          await sendEmail({
            to: email,
            subject: `Verify your email for ${APP_NAME}`,
            html: `<p>Your verification code is: <b>${otp}</b>.</p>`
          });
        } else if (type === 'forget-password') {
          await sendEmail({
            to: email,
            subject: `Reset your password for ${APP_NAME}`,
            html: `<p>Your password reset code is: <b>${otp}</b>.</p>`
          });
        } else {
          // change email alert to unknown OTP type
          await sendEmail({
            to: email,
            subject: `Unknown OTP type: ${type}`,
            html: `<p>Notification: ${type}</p><p>Please contact the administrator for more information.</p>`
          });
        }
      }
    }),
    username({
      immutableUsername: true,
      minUsernameLength: 5,
      maxUsernameLength: 100,
      usernameValidator: (username) => {
        if (username === 'admin') {
          return false;
        }
        return true;
      },
      displayUsernameValidator: (displayUsername) => {
        return /^[a-zA-Z0-9_-]+$/.test(displayUsername);
      },
      usernameNormalization: (username) => {
        return username
          .toLowerCase()
          .replaceAll('0', 'o')
          .replaceAll('3', 'e')
          .replaceAll('4', 'a');
      },
      displayUsernameNormalization: (displayUsername) => displayUsername.toLowerCase()
    }),
    twoFactor({
      issuer: APP_NAME || 'Link Shift',
      otpOptions: {
        async sendOTP({ user, otp }) {
          await sendEmail({
            to: user.email,
            subject: `2FA Verification Code - ${APP_NAME}`,
            html: `<p>Your 2FA security code is: <b>${otp}</b>. Do not share this code with anyone.</p>`
          });
        }
      }
    }),
    sveltekitCookies(getRequestEvent)
  ]
});

export type AuthType = typeof auth;
export type Session = AuthType['$Infer']['Session'];
export type AuthUser = Session['user'];
export type AuthSession = Session['session'];
export type Role = (typeof schema.userRoleEnum.enumValues)[number];
export const userRoleEnum = schema.userRoleEnum;
