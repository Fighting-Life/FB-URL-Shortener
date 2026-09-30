import { campaignFormSchema } from '$lib/schemas/campaign';
import { CampaignError } from '$lib/server/campaign/service';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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
  console.error('[api/campaign/[id]]', err);
  return json(
    { success: false, error: { code: 'internal_error', message: 'An unexpected error occurred' } },
    { status: 500 }
  );
}

export const GET: RequestHandler = async ({ locals, params }) => {
  try {
    const campaign = await locals.helper!.campaigns.get(params.id);
    if (!campaign) {
      return json(
        { success: false, error: { code: 'not_found', message: 'Campaign not found' } },
        { status: 404 }
      );
    }
    return json({ success: true, data: campaign });
  } catch (err) {
    return errResponse(err);
  }
};

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

  const result = campaignFormSchema.safeParse(body);
  if (!result.success) {
    return json(
      {
        success: false,
        error: {
          code: 'validation_error',
          message: 'Validation failed',
          issues: result.error.issues
        }
      },
      { status: 400 }
    );
  }

  try {
    const data = await locals.helper!.campaigns.update(params.id, result.data);
    return json({ success: true, data });
  } catch (err) {
    return errResponse(err);
  }
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  try {
    await locals.helper!.campaigns.remove(params.id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errResponse(err);
  }
};
