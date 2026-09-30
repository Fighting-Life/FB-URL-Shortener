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
    const file = formData.get('avatar');
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

    if (user.image && user.image.startsWith('https://res.cloudinary.com')) {
      await helper?.cloudinary.deleteFile(user.image);
    }

    const upload = await helper?.cloudinary.uploadFile(file, 'image', 'users');
    if (upload instanceof Error) {
      return json({ success: false, message: upload.message, data: null }, { status: 400 });
    }

    const updateUser = await helper?.users.updateAvatar(user.id, upload);

    if (updateUser instanceof Error) {
      return json({ success: false, message: updateUser.message, data: null }, { status: 400 });
    }

    return json(
      { success: true, message: 'Avatar updated successfully.', data: upload },
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

    const { url } = (await request.json()) as { url: string };
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

    const deleteAvatar = await locals.helper?.cloudinary.deleteFile(url);
    if (deleteAvatar instanceof Error) {
      return json({ success: false, message: deleteAvatar.message, data: null }, { status: 400 });
    }

    const updateUser = await helper?.users.updateAvatar(user.id, null);
    if (updateUser instanceof Error) {
      return json({ success: false, message: updateUser.message, data: null }, { status: 400 });
    }

    return json(
      { success: true, message: 'Avatar deleted successfully.', data: null },
      { status: 200 }
    );
  } catch (e) {
    if (e instanceof Error) {
      return json({ success: false, message: e.message, data: null }, { status: 400 });
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
