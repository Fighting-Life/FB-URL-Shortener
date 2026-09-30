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
  console.error('[api/campaign/[id]/duplicate]', err);
  return json(
    { success: false, error: { code: 'internal_error', message: 'An unexpected error occurred' } },
    { status: 500 }
  );
}

export const POST: RequestHandler = async ({ locals, params }) => {
  try {
    const data = await locals.helper!.campaigns.duplicate(params.id);
    return json({ success: true, data }, { status: 201 });
  } catch (err) {
    return errResponse(err);
  }
};
