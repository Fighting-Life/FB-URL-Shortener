import { Redis } from '@upstash/redis';

let client: Redis | null | undefined;

export function getUpstash(): Redis | null {
	if (client !== undefined) return client;
	const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
	const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
	client = url && token ? new Redis({ url, token }) : null;
	return client;
}
