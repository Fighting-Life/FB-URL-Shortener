type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

function serializeError(error: unknown) {
	if (!(error instanceof Error)) return error;
	return {
		name: error.name,
		message: error.message,
		stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
	};
}

export function logEvent(level: LogLevel, event: string, context: LogContext = {}) {
	const normalized = Object.fromEntries(
		Object.entries(context).map(([key, value]) => [
			key,
			key === 'error' ? serializeError(value) : value
		])
	);
	const entry = JSON.stringify({
		timestamp: new Date().toISOString(),
		level,
		event,
		...normalized
	});

	if (level === 'error') console.error(entry);
	else if (level === 'warn') console.warn(entry);
	else console.info(entry);
}

export function positiveIntegerEnv(name: string, fallback: number, maximum = 1_000_000) {
	const parsed = Number.parseInt(process.env[name] ?? '', 10);
	return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}
