import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';


export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'banned']);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'active',
  'paused',
  'archived'
]);
export const rotationStrategyEnum = pgEnum('rotation_strategy', [
  'equal',
  'percentage',
  'priority'
]);


export const user = pgTable(
  'user',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    username: varchar('username', { length: 255 }).unique(),
    email: text('email').notNull().unique(),
    displayUsername: text('display_username'),
    phone: text('phone'),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    role: userRoleEnum('role').notNull().default('user'),
    banned: boolean('banned').notNull().default(false),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires'),
    status: userStatusEnum('status').notNull().default('active'),
    lastLoginAt: timestamp('last_login_at'),
    twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
    twoFactorSecret: text('two_factor_secret'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  (t) => [
    uniqueIndex('user_name_idx').on(t.name),
    index('user_id_idx').on(t.id),
    index('user_username_idx').on(t.username),
    index('user_email_idx').on(t.email),
    index('user_phone_idx').on(t.phone),
    index('user_role_idx').on(t.role),
    index('user_banned_idx').on(t.banned),
    index('user_ban_expires_idx').on(t.banExpires),
    index('user_two_factor_enabled_idx').on(t.twoFactorEnabled),
    index('user_status_idx').on(t.status),
    index('user_email_verified_idx').on(t.emailVerified),
    index('user_last_login_at_idx').on(t.lastLoginAt),
    index('user_created_at_idx').on(t.createdAt),
    index('user_updated_at_idx').on(t.updatedAt)
  ]
);

export const session = pgTable(
  'session',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  (t) => [
    index('session_user_id_idx').on(t.userId),
    index('session_token_idx').on(t.token),
    index('session_created_at_idx').on(t.createdAt),
    index('session_updated_at_idx').on(t.updatedAt)
  ]
);

export const account = pgTable(
  'account',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    issuer: text('issuer').notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  (t) => [
    uniqueIndex('account_issuer_accountId_uidx').on(t.issuer, t.accountId),
    index('account_user_id_idx').on(t.userId),
    index('account_account_id_idx').on(t.accountId),
    index('account_provider_id_idx').on(t.providerId),
    index('account_access_token_idx').on(t.accessToken),
    index('account_refresh_token_idx').on(t.refreshToken),
    index('account_id_token_idx').on(t.idToken),
    index('account_access_token_expires_at_idx').on(t.accessTokenExpiresAt),
    index('account_refresh_token_expires_at_idx').on(t.refreshTokenExpiresAt),
    index('account_created_at_idx').on(t.createdAt),
    index('account_updated_at_idx').on(t.updatedAt)
  ]
);

export const verification = pgTable(
  'verification',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  (t) => [
    index('verification_identifier_idx').on(t.identifier),
    index('verification_expires_at_idx').on(t.expiresAt),
    index('verification_created_at_idx').on(t.createdAt),
    index('verification_updated_at_idx').on(t.updatedAt)
  ]
);

export const twoFactor = pgTable(
  'two_factor',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    verified: boolean('verified').notNull().default(true),
    failedVerificationCount: integer('failed_verification_count').notNull().default(0),
    lockedUntil: timestamp('locked_until')
  },
  (t) => [
    index('two_factor_secret_idx').on(t.secret),
    index('two_factor_user_id_idx').on(t.userId),
    index('two_factor_verified_idx').on(t.verified),
    index('two_factor_locked_until_idx').on(t.lockedUntil)
  ]
);

export const settings = pgTable(
  'settings',
  {
    key: text('key').primaryKey(),
    value: jsonb('value').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  (t) => [
    index('settings_key_idx').on(t.key),
    index('settings_created_at_idx').on(t.createdAt),
    index('settings_updated_at_idx').on(t.updatedAt)
  ]
);


export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  twoFactors: many(twoFactor),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id]
  })
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id]
  })
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id]
  })
}));
