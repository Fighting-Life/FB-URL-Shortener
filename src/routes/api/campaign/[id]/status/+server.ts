import { CAMPAIGN_STATUSES } from '$lib/schemas/campaign';
import { CampaignError } from '$lib/server/campaign/service';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const statusBodySchema = z.object({
  status: z.enum(CAMPAIGN_STATUSES)
});

function errResponse(err: unknown): Response {
  if (err instanceof CampaignError) {
    const status = err.code === 'not_found' ? 404 : 400;
    return json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.path !== undefined && { path: err.path })
        }
      },
      { status }
    );
  }
  console.error('[api/campaign/[id]/status]', err);
  return json(
    { success: false, error: { code: 'internal_error', message: 'An unexpected error occurred' } },
    { status: 500 }
  );
}

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      { success: false, error: { code: 'invalid_json', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const result = statusBodySchema.safeParse(body);
  if (!result.success) {
    return json(
      {
        success: false,
        error: {
          code: 'validation_error',
          message: 'Invalid status value',
          issues: result.error.issues
        }
      },
      { status: 400 }
    );
  }

  try {
    await locals.helper!.campaigns.setStatus(params.id, result.data.status);
    return json({ success: true, data: { status: result.data.status } });
  } catch (err) {
    return errResponse(err);
  }
};
