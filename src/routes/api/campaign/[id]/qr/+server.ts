import { CampaignError } from '$lib/server/campaign/service';
import QRCode from 'qrcode';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params, url }) => {
  try {
    const campaign = await locals.helper!.campaigns.get(params.id);
    if (!campaign) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'not_found', message: 'Campaign not found' } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const targetUrl = `${url.origin}/${campaign.slug}`;
    const buffer = await QRCode.toBuffer(targetUrl, { width: 300 });

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (err) {
    if (err instanceof CampaignError) {
      const status = err.code === 'not_found' ? 404 : 400;
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: err.code,
            message: err.message,
            ...(err.path !== undefined && { path: err.path })
          }
        }),
        { status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error('[api/campaign/[id]/qr]', err);
    return new Response(
      JSON.stringify({ success: false, error: { code: 'internal_error', message: 'An unexpected error occurred' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
