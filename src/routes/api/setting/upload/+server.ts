import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user, helper } = locals;
  try {
    if (!user) {
      return json(
        {
          success: false,
          message: 'Unauthorized',
          data: null
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const key = formData.get('key')
    if (!key) {
      return json({
        success: false,
        message: 'Key is required',
        data: null
      }, {
        status: 400
      })
    }

    const setting = await helper?.setting.getSetting(key as string);

    if (!setting) {
      return json({
        success: false,
        message: 'Setting key not found',
        data: null
      }, {
        status: 400
      })
    }

    if (!file || !(file instanceof File)) {
      return json(
        {
          success: false,
          message: 'File is required',
          data: null
        },
        { status: 400 }
      );
    }

    if (setting.value && (setting.value as string).startsWith('https://res.cloudinary.com')) {
      await helper?.cloudinary.deleteFile(setting.value as string);
    }

    const upload = await helper?.cloudinary.uploadFile(file, 'image', 'settings');
    if (upload instanceof Error) {
      return json({ success: false, message: upload.message, data: null }, { status: 400 });
    }

    const updateSetting = await helper?.setting.updateSetting(setting.key, upload as string);

    if (updateSetting instanceof Error) {
      return json({ success: false, message: updateSetting.message, data: null }, { status: 400 });
    }

    return json(
      { success: true, message: 'Setting updated successfully.', data: upload },
      { status: 200 }
    );
  } catch (e) {
    if (e instanceof Error) {
      return json({ success: false, message: e.message, data: null }, { status: 500 });
    }
    return json(
      {
        success: false,
        message: 'Unknown server error',
        data: null
      },
      { status: 500 }
    );
  }
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
  const { user, helper } = locals;

  try {
    if (!user) {
      return json(
        {
          success: false,
          message: 'Unauthorized',
          data: null
        },
        { status: 400 }
      );
    }

    const { key, url } = (await request.json()) as { key: string, url: string };
    if (!key) {
      return json({
        success: false,
        message: 'Key is required',
        data: null
      }, {
        status: 400
      })
    }

    if (!url) {
      return json(
        {
          success: false,
          message: 'File is required',
          data: null
        },
        { status: 400 }
      );
    }

    const setting = await helper?.setting.getSetting(key as string);

    if (!setting) {
      return json({
        success: false,
        message: 'Setting key not found',
        data: null
      }, {
        status: 400
      })
    }

    const deleteMedia = await locals.helper?.cloudinary.deleteFile(url);
    if (deleteMedia instanceof Error) {
      return json({ success: false, message: deleteMedia.message, data: null }, { status: 400 });
    }

    const updateSetting = await helper?.setting.updateSetting(setting.key as string, '');
    if (updateSetting instanceof Error) {
      return json({ success: false, message: updateSetting.message, data: null }, { status: 400 });
    }

    return json(
      { success: true, message: 'Setting deleted successfully.', data: null },
      { status: 200 }
    );
  } catch (e) {
    if (e instanceof Error) {
      return json({ success: false, message: e.message, data: null }, { status: 500 });
    }
    return json(
      {
        success: false,
        message: 'Unknown server error',
        data: null
      },
      { status: 500 }
    );
  }
};
