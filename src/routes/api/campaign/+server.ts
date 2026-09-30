import { campaignFormSchema, campaignListFilterSchema } from '$lib/schemas/campaign';
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
  console.error('[api/campaign]', err);
  return json(
    { success: false, error: { code: 'internal_error', message: 'An unexpected error occurred' } },
    { status: 500 }
  );
}

export const GET: RequestHandler = async ({ locals, url }) => {
  const filter = campaignListFilterSchema.parse(Object.fromEntries(url.searchParams));
  try {
    const data = await locals.helper!.campaigns.list(filter);
    return json({ success: true, data });
  } catch (err) {
    return errResponse(err);
  }
};

export const POST: RequestHandler = async ({ locals, request }) => {
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
    const data = await locals.helper!.campaigns.create(result.data);
    return json({ success: true, data }, { status: 201 });
  } catch (err) {
    return errResponse(err);
  }
};
