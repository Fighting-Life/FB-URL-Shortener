import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { z } from 'zod';

function urlWithProtocols(protocols: string[]) {
	return z
		.string()
		.url()
		.refine((value) => {
			try {
				const url = new URL(value);
				return protocols.includes(url.protocol) && Boolean(url.hostname);
			} catch {
				return false;
			}
		});
}

function optional<T extends z.ZodType>(schema: T) {
	return z.preprocess(
		(value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
		schema.optional()
	);
}

const secretSchema = z
	.string()
	.min(32)
	.refine((value) => value.trim().length >= 32);
const httpUrlSchema = urlWithProtocols(['http:', 'https:']);
const environmentSchema = z
	.object({
		DATABASE_URL: urlWithProtocols(['postgres:', 'postgresql:']),
		BETTER_AUTH_SECRET: secretSchema,
		IP_HASH_SECRET: optional(secretSchema),
		UPSTASH_REDIS_REST_URL: optional(
			urlWithProtocols(['https:']).refine((value) => {
				try {
					const url = new URL(value);
					return !url.username && !url.password && !url.hash;
				} catch {
					return false;
				}
			})
		),
		UPSTASH_REDIS_REST_TOKEN: optional(
			z
				.string()
				.min(1)
				.refine((value) => value.trim().length > 0)
		),
		REDIRECT_RATE_LIMIT: optional(
			z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(10_000))
		),
		VERCEL: z.string().optional(),
		PUBLIC_SITE_URL: optional(httpUrlSchema),
		BETTER_AUTH_URL: optional(httpUrlSchema),
		ORIGIN: optional(httpUrlSchema)
	})
	.superRefine((values, ctx) => {
		if (Boolean(values.UPSTASH_REDIS_REST_URL) !== Boolean(values.UPSTASH_REDIS_REST_TOKEN)) {
			for (const field of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) {
				ctx.addIssue({ code: 'custom', path: [field], message: 'Required pair' });
			}
		}
	});

export function parseRedirectEnvironment(values: Record<string, string | undefined>): {
	secret: string;
	redisUrl?: string;
	redisToken?: string;
	rateLimit: number;
	trustVercelGeo: boolean;
	platformHosts: string[];
} {
	const result = environmentSchema.safeParse(values);
	if (!result.success) {
		// Never expose Zod issues, supplied values, or a cause containing credentials.
		const fields = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))].sort();
		throw new Error(`Invalid redirect environment: ${fields.join(', ')}`);
	}
	const parsed = result.data;
	const platformHosts = [
		...new Set(
			[parsed.PUBLIC_SITE_URL, parsed.BETTER_AUTH_URL, parsed.ORIGIN]
				.filter((value): value is string => value !== undefined)
				.map((value) => new URL(value).hostname.toLowerCase().replace(/\.+$/, ''))
		)
	];
	return {
		secret: parsed.IP_HASH_SECRET ?? parsed.BETTER_AUTH_SECRET,
		...(parsed.UPSTASH_REDIS_REST_URL ? { redisUrl: parsed.UPSTASH_REDIS_REST_URL } : {}),
		...(parsed.UPSTASH_REDIS_REST_TOKEN ? { redisToken: parsed.UPSTASH_REDIS_REST_TOKEN } : {}),
		rateLimit: parsed.REDIRECT_RATE_LIMIT ?? 120,
		trustVercelGeo: parsed.VERCEL === '1',
		platformHosts
	};
}

/** Validate on demand, not at module load or build time; do not cache stale env values. */
export function getRedirectEnvironment(): ReturnType<typeof parseRedirectEnvironment> {
	return parseRedirectEnvironment({ ...privateEnv, PUBLIC_SITE_URL: publicEnv.PUBLIC_SITE_URL });
}
