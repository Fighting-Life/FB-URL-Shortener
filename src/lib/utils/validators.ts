import { z } from 'zod';
import { isValidCustomSlug } from './slug';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const imageUploadSchema = z
	.instanceof(File)
	.refine((file) => file.size <= MAX_FILE_SIZE, 'Max size 5MB.')
	.refine(
		(file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
		'Only .jpg, .png, and .webp supported.'
	);
const singleImageSchema = z.instanceof(File).superRefine(async (file, ctx) => {
	if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
		ctx.addIssue({ code: 'custom', message: 'Only .jpg, .png, and .webp supported.' });
		return;
	}
	if (file.size > MAX_FILE_SIZE) {
		ctx.addIssue({ code: 'custom', message: 'Max file size 5MB.' });
		return;
	}
	if (typeof window !== 'undefined') {
		const { width, height } = await validateDimensions(file);
		if (width > 1920 || height > 1080) {
			ctx.addIssue({ code: 'custom', message: 'Max image resolution 1920x1080.' });
		}
	}
});
const validateDimensions = (file: File): Promise<{ width: number; height: number }> => {
	return new Promise((resolve) => {
		if (typeof window === 'undefined') return resolve({ width: 0, height: 0 }); // Skip jika di Server
		const img = new Image();
		img.src = URL.createObjectURL(file);
		img.onload = () => {
			resolve({ width: img.width, height: img.height });
			URL.revokeObjectURL(img.src);
		};
		img.onerror = () => resolve({ width: 0, height: 0 });
	});
};
const fileSchema = z.instanceof(File).superRefine(async (file, ctx) => {
	if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
		ctx.addIssue({ code: 'custom', message: 'Only .jpg, .png, and .webp supported.' });
		return;
	}

	if (file.size > MAX_FILE_SIZE) {
		ctx.addIssue({ code: 'custom', message: 'Max size 5MB.' });
		return;
	}

	const { width, height } = await validateDimensions(file);
	if (width > 1920 || height > 1080) {
		ctx.addIssue({ code: 'custom', message: 'Max 1920x1080' });
	}
});

export const loginSchema = z.object({
	identifier: z.string().min(1),
	password: z.string().min(1),
	remember: z.boolean().default(false)
});
export const registerSchema = z
	.object({
		name: z.string().min(1),
		email: z.string().email('Invalid email').min(1),
		password: z.string().min(1),
		confirmPassword: z.string().min(1)
	})
	.superRefine((data, ctx) => {
		if (data.password !== data.confirmPassword) {
			ctx.addIssue({
				code: 'custom',
				message: 'Passwords do not match',
				path: ['confirmPassword']
			});
			return;
		}
	});
export const forgotPasswordSchema = z.object({
	email: z.string().email('Invalid email').min(1)
});
export const resetPasswordSchema = z
	.object({
		email: z.string().email('Invalid email').min(1),
		otp: z.string().min(6, 'OTP must be 6 digits'),
		password: z.string().min(1),
		confirmPassword: z.string().min(1)
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});
export const otpVerificationSchema = z.object({
	email: z.string().email('Invalid email').min(1),
	otp: z.string().min(6, 'OTP must be 6 digits')
});
export const twoFactorSchema = z.object({
	otp: z.string().min(6, 'OTP must be 6 digits'),
	trustDevice: z.boolean().default(false)
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OtpVerificationInput = z.infer<typeof otpVerificationSchema>;
export type TwoFactorInput = z.infer<typeof twoFactorSchema>;

// ========================
// Account & Security
// ========================
export const updateProfileSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(30, 'Username must be at most 30 characters')
		.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
	email: z.string().min(1, 'Email is required').email('Invalid email format'),
	phone: z
		.string()
		.optional()
		.refine(
			(val) => !val || val.replace(/[\s-]/g, '').length >= 10,
			'Phone number must be at least 10 digits'
		)
		.transform((val) => (val ? val.replace(/[\s-]/g, '') : ''))
});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1),
		newPassword: z.string().min(1),
		confirmPassword: z.string().min(1)
	})
	.superRefine((data, ctx) => {
		if (data.newPassword !== data.confirmPassword) {
			ctx.addIssue({
				code: 'custom',
				message: 'Passwords do not match',
				path: ['confirmPassword']
			});
			return;
		}
	});
export const enableTwoFactorSchema = z.object({
	password: z.string().min(1)
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type EnableTwoFactorInput = z.infer<typeof enableTwoFactorSchema>;

// ========================
// Settings Platform
// ========================

export const platformSettingsSchema = z
	.object({
		site_name: z.string().min(1),
		site_tagline: z.string().min(1),
		site_logo: z.string(),
		site_favicon: z.string(),
		site_meta_title: z.string(),
		site_meta_description: z.string(),
		site_url: z.string().url().min(1),
		site_og_image: z.string(),
		site_og_title: z.string(),
		site_og_description: z.string(),
		site_keywords: z.string(),
		enable_register: z.boolean().default(true)
	})
	.catchall(z.any());

export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;

// ========================
// Campaigns
// ========================

export const campaignStatuses = ['draft', 'active', 'paused', 'archived'] as const;
export const redirectTypes = ['direct', 'safelink', 'deeplink'] as const;
export const rotationStrategies = ['equal', 'percentage', 'priority'] as const;
export const destinationTypes = ['affiliate', 'cpa', 'direct', 'popunder'] as const;
export const destinationPlatforms = [
	'generic',
	'amazon',
	'ebay',
	'shopee',
	'tiktok',
	'traveloka',
	'custom'
] as const;
export const geoModes = ['all', 'include', 'exclude'] as const;
export const popunderBehaviors = ['background', 'new_tab', 'same_tab'] as const;
export const popunderBrowserBehaviors = ['inherit', 'disabled', ...popunderBehaviors] as const;

const httpUrlSchema = z
	.string()
	.url('Enter a valid URL')
	.refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), {
		message: 'Only HTTP and HTTPS URLs are supported'
	});

const optionalHttpUrlSchema = z
	.union([z.literal(''), httpUrlSchema])
	.transform((value) => value || undefined);

const optionalAppUrlSchema = z
	.string()
	.trim()
	.max(2048)
	.refine(
		(value) =>
			value === '' ||
			(/^[a-z][a-z0-9+.-]*:\/\/[^\s]+$/i.test(value) &&
				!['javascript:', 'data:', 'file:', 'vbscript:'].includes(
					value.slice(0, value.indexOf(':') + 1).toLowerCase()
				)),
		'Enter a valid app URL such as shopee://product/123'
	)
	.transform((value) => value || undefined);

const destinationDeepLinkSchema = z
	.object({
		enabled: z.boolean().default(false),
		androidScheme: optionalAppUrlSchema,
		androidPackageName: z
			.string()
			.trim()
			.max(255)
			.refine(
				(value) => value === '' || /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/.test(value),
				'Enter a valid Android package name'
			)
			.transform((value) => value || undefined),
		androidStoreUrl: optionalHttpUrlSchema,
		iosScheme: optionalAppUrlSchema,
		iosAppId: z
			.string()
			.trim()
			.max(64)
			.refine((value) => value === '' || /^\d+$/.test(value), 'Use the numeric Apple App ID')
			.transform((value) => value || undefined),
		iosStoreUrl: optionalHttpUrlSchema,
		universalLink: optionalHttpUrlSchema,
		webFallbackUrl: optionalHttpUrlSchema
	})
	.superRefine((deepLink, ctx) => {
		if (
			deepLink.enabled &&
			!deepLink.androidScheme &&
			!deepLink.iosScheme &&
			!deepLink.universalLink
		) {
			ctx.addIssue({
				code: 'custom',
				message: 'Add an Android app URL, iOS app URL, or universal link'
			});
		}
	});

const popunderSettingsSchema = z
	.object({
		enabled: z.boolean().default(false),
		targetUrl: optionalHttpUrlSchema,
		behavior: z.enum(popunderBehaviors).default('background'),
		delayMs: z.coerce.number().int().min(0).max(10000).default(0),
		frequencyCap: z.coerce.number().int().min(1).max(100).default(1),
		frequencyWindowHours: z.coerce.number().int().min(1).max(720).default(24),
		browserRules: z
			.object({
				desktop: z.enum(popunderBrowserBehaviors).default('inherit'),
				mobile: z.enum(popunderBrowserBehaviors).default('inherit'),
				webview: z.enum(popunderBrowserBehaviors).default('same_tab')
			})
			.default({ desktop: 'inherit', mobile: 'inherit', webview: 'same_tab' })
	})
	.superRefine((settings, ctx) => {
		if (settings.enabled && !settings.targetUrl) {
			ctx.addIssue({
				code: 'custom',
				path: ['targetUrl'],
				message: 'Add a second target URL when popunder is enabled'
			});
		}
	});

export const campaignDestinationSchema = z
	.object({
		id: z.string().uuid().optional(),
		name: z.string().trim().min(1, 'Destination name is required').max(160),
		url: httpUrlSchema,
		type: z.enum(destinationTypes),
		platform: z.enum(destinationPlatforms),
		enabled: z.boolean().default(true),
		weight: z.coerce.number().int().min(1).max(10000).default(100),
		priority: z.coerce.number().int().min(0).max(10000).default(0),
		geoMode: z.enum(geoModes).default('all'),
		deepLink: destinationDeepLinkSchema.default({
			enabled: false,
			androidScheme: undefined,
			androidPackageName: undefined,
			androidStoreUrl: undefined,
			iosScheme: undefined,
			iosAppId: undefined,
			iosStoreUrl: undefined,
			universalLink: undefined,
			webFallbackUrl: undefined
		}),
		countries: z
			.array(
				z
					.string()
					.trim()
					.regex(/^[a-zA-Z]{2}$/, 'Use ISO two-letter country codes')
					.transform((value) => value.toUpperCase())
			)
			.max(250)
			.default([])
	})
	.superRefine((destination, ctx) => {
		if (destination.geoMode !== 'all' && destination.countries.length === 0) {
			ctx.addIssue({
				code: 'custom',
				path: ['countries'],
				message: 'Add at least one country for include/exclude targeting'
			});
		}
	});

export const campaignSchema = z
	.object({
		name: z.string().trim().min(2, 'Campaign name is required').max(160),
		teamId: z.union([z.string().uuid(), z.literal('')]).default(''),
		slug: z
			.string()
			.trim()
			.max(64)
			.refine((value) => value === '' || isValidCustomSlug(value), {
				message:
					'Use 3-64 letters, numbers, hyphens, or underscores; reserved slugs are not allowed'
			}),
		description: z.string().trim().max(1000).default(''),
		status: z.enum(campaignStatuses),
		redirectType: z.enum(redirectTypes),
		rotationStrategy: z.enum(rotationStrategies),
		fallbackUrl: optionalHttpUrlSchema,
		botProtectionEnabled: z.boolean().default(true),
		trackingEnabled: z.boolean().default(true),
		preserveQueryParams: z.boolean().default(true),
		stripReferrer: z.boolean().default(false),
		attribution: z
			.object({
				enabled: z.boolean().default(false),
				source: z.string().trim().max(100).default(''),
				medium: z.string().trim().max(100).default(''),
				campaign: z.string().trim().max(200).default('')
			})
			.default({ enabled: false, source: '', medium: '', campaign: '' }),
		popunder: popunderSettingsSchema.default({
			enabled: false,
			targetUrl: undefined,
			behavior: 'background',
			delayMs: 0,
			frequencyCap: 1,
			frequencyWindowHours: 24,
			browserRules: { desktop: 'inherit', mobile: 'inherit', webview: 'same_tab' }
		}),
		destinations: z.array(campaignDestinationSchema).min(1, 'Add at least one destination').max(50)
	})
	.superRefine((campaign, ctx) => {
		if (campaign.status === 'active' && !campaign.destinations.some((item) => item.enabled)) {
			ctx.addIssue({
				code: 'custom',
				path: ['destinations'],
				message: 'An active campaign needs at least one enabled destination'
			});
		}

		if (campaign.rotationStrategy === 'percentage') {
			const total = campaign.destinations
				.filter((item) => item.enabled)
				.reduce((sum, item) => sum + item.weight, 0);
			if (total !== 100) {
				ctx.addIssue({
					code: 'custom',
					path: ['destinations'],
					message: `Enabled destination percentages must total 100 (currently ${total})`
				});
			}
		}

		if (campaign.redirectType === 'deeplink') {
			campaign.destinations.forEach((destination, index) => {
				if (destination.enabled && !destination.deepLink.enabled) {
					ctx.addIssue({
						code: 'custom',
						path: ['destinations', index, 'deepLink'],
						message: 'Enabled destinations need deeplink configuration in deeplink mode'
					});
				}
			});
		}

		if (campaign.popunder.enabled && !campaign.trackingEnabled) {
			ctx.addIssue({
				code: 'custom',
				path: ['trackingEnabled'],
				message: 'Analytics tracking is required for secure popunder delivery'
			});
		}

		if (campaign.attribution.enabled && !campaign.attribution.source) {
			ctx.addIssue({
				code: 'custom',
				path: ['attribution', 'source'],
				message: 'Attribution source is required when source attribution is enabled'
			});
		}
	});

export type CampaignInput = z.infer<typeof campaignSchema>;
export type CampaignDestinationInput = z.infer<typeof campaignDestinationSchema>;
