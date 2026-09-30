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
export const forwardQueryModeEnum = pgEnum('forward_query_mode', ['all', 'allowlist', 'none']);
export const queryConflictEnum = pgEnum('query_conflict', ['destination_wins', 'incoming_wins']);
export const referrerModeEnum = pgEnum('referrer_mode', ['passthrough', 'no_referrer']);
export const botActionEnum = pgEnum('bot_action', ['log_only', 'block', 'challenge']);
export const blockActionEnum = pgEnum('block_action', ['not_found', 'forbidden']);
export const campaignRuleTypeEnum = pgEnum('campaign_rule_type', ['geo', 'ip', 'device', 'browser']);
export const campaignRuleModeEnum = pgEnum('campaign_rule_mode', ['allow', 'deny']);
export const tagProviderEnum = pgEnum('tag_provider', [
  'gtag',
  'fb_pixel',
  'tiktok_pixel',
  'histats'
]);
export const clickDecisionEnum = pgEnum('click_decision', [
  'redirected',
  'preview',
  'blocked_geo',
  'blocked_ip',
  'blocked_device',
  'blocked_browser',
  'bot',
  'rate_limited'
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
    issuer: text('issuer').notNull().default(''),
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

export const campaign = pgTable(
  'campaign',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    // Case-sensitive and never reused (soft-deleted rows keep their slug) so an old
    // Facebook post can't start pointing somewhere else.
    slug: varchar('slug', { length: 64 }).notNull().unique(),
    description: text('description').notNull().default(''),
    status: campaignStatusEnum('status').notNull().default('draft'),
    rotationStrategy: rotationStrategyEnum('rotation_strategy').notNull().default('equal'),
    delayMs: integer('delay_ms').notNull().default(0),
    forwardQuery: forwardQueryModeEnum('forward_query').notNull().default('all'),
    forwardQueryKeys: text('forward_query_keys').array().notNull().default([]),
    queryConflict: queryConflictEnum('query_conflict').notNull().default('destination_wins'),
    referrerMode: referrerModeEnum('referrer_mode').notNull().default('passthrough'),
    stickyVisitor: boolean('sticky_visitor').notNull().default(false),
    fallbackFbclid: boolean('fallback_fbclid_id').notNull().default(false),
    stickyTtlHours: integer('sticky_ttl_hours').notNull().default(24),
    botAction: botActionEnum('bot_action').notNull().default('log_only'),
    blockAction: blockActionEnum('block_action').notNull().default('not_found'),
    ogTitle: text('og_title'),
    ogDescription: text('og_description'),
    ogImage: text('og_image'),
    expiresAt: timestamp('expires_at'),
    totalClicks: integer('total_clicks').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at')
  },
  (t) => [
    index('campaign_user_id_idx').on(t.userId),
    index('campaign_status_idx').on(t.status),
    index('campaign_created_at_idx').on(t.createdAt),
    index('campaign_deleted_at_idx').on(t.deletedAt)
  ]
);

export const campaignDestination = pgTable(
  'campaign_destination',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaign.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    label: text('label').notNull().default(''),
    // Percentage share (0-100) when the campaign uses the `percentage` strategy.
    weight: integer('weight').notNull().default(100),
    // Lower number = tried first when the campaign uses the `priority` strategy.
    priority: integer('priority').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    clickCap: integer('click_cap'),
    clickCount: integer('click_count').notNull().default(0),
    startsAt: timestamp('starts_at'),
    endsAt: timestamp('ends_at'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  (t) => [index('campaign_destination_campaign_id_idx').on(t.campaignId)]
);

export const campaignRule = pgTable(
  'campaign_rule',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaign.id, { onDelete: 'cascade' }),
    type: campaignRuleTypeEnum('type').notNull(),
    mode: campaignRuleModeEnum('mode').notNull().default('deny'),
    values: jsonb('values').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  (t) => [uniqueIndex('campaign_rule_campaign_type_uidx').on(t.campaignId, t.type)]
);

export const campaignTag = pgTable(
  'campaign_tag',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // NULL = platform-wide tag managed by admins.
    campaignId: uuid('campaign_id').references(() => campaign.id, { onDelete: 'cascade' }),
    provider: tagProviderEnum('provider').notNull(),
    tagId: text('tag_id').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  (t) => [index('campaign_tag_campaign_id_idx').on(t.campaignId)]
);

export const clickEvent = pgTable(
  'click_event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaign.id, { onDelete: 'cascade' }),
    destinationId: uuid('destination_id').references(() => campaignDestination.id, {
      onDelete: 'set null'
    }),
    decision: clickDecisionEnum('decision').notNull(),
    country: varchar('country', { length: 2 }),
    device: text('device'),
    browser: text('browser'),
    os: text('os'),
    isInApp: boolean('is_in_app').notNull().default(false),
    // HMAC of the visitor IP; the raw IP is never stored.
    ipHash: text('ip_hash'),
    referrerHost: text('referrer_host'),
    hasFbclid: boolean('has_fbclid').notNull().default(false),
    fbclidSource: text('fbclid_source').notNull().default('none'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  (t) => [
    index('click_event_campaign_created_idx').on(t.campaignId, t.createdAt),
    index('click_event_created_at_idx').on(t.createdAt)
  ]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  twoFactors: many(twoFactor),
  campaigns: many(campaign)
}));

export const campaignRelations = relations(campaign, ({ one, many }) => ({
  owner: one(user, {
    fields: [campaign.userId],
    references: [user.id]
  }),
  destinations: many(campaignDestination),
  rules: many(campaignRule),
  tags: many(campaignTag),
  clicks: many(clickEvent)
}));

export const campaignDestinationRelations = relations(campaignDestination, ({ one, many }) => ({
  campaign: one(campaign, {
    fields: [campaignDestination.campaignId],
    references: [campaign.id]
  }),
  clicks: many(clickEvent)
}));

export const campaignRuleRelations = relations(campaignRule, ({ one }) => ({
  campaign: one(campaign, {
    fields: [campaignRule.campaignId],
    references: [campaign.id]
  })
}));

export const campaignTagRelations = relations(campaignTag, ({ one }) => ({
  campaign: one(campaign, {
    fields: [campaignTag.campaignId],
    references: [campaign.id]
  })
}));

export const clickEventRelations = relations(clickEvent, ({ one }) => ({
  campaign: one(campaign, {
    fields: [clickEvent.campaignId],
    references: [campaign.id]
  }),
  destination: one(campaignDestination, {
    fields: [clickEvent.destinationId],
    references: [campaignDestination.id]
  })
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
