import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';
import { ServerBase } from './server.js';
import type { ConfigOptions, UploadApiResponse, UploadApiOptions, ResourceType } from 'cloudinary';
import { v2 as cloudinary } from 'cloudinary';

export class CloudinaryHelper extends ServerBase {
  public cloudinary: ConfigOptions | null = null;
  constructor(event: RequestEvent) {
    super(event);
  }
  private initCloudinary(): void | Error {
    if (this.cloudinary) return;

    try {
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_KEY || !CLOUDINARY_SECRET) {
        throw new Error('Cloudinary config not set');
      }
      this.cloudinary = cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_KEY,
        api_secret: CLOUDINARY_SECRET
      });
    } catch (e) {
      if (e instanceof Error) return e;
      throw new Error('Cloudinary config not set');
    }
  }

  async deleteFile(url: string, resourceType?: ResourceType): Promise<void | Error> {
    try {
      const init = this.initCloudinary();
      if (init instanceof Error) throw init;

      const publicId = this.extractCloudinaryPublicId(url);
      if (!publicId) throw new Error('Cloudinary public ID not found');

      let detectedResourceType: ResourceType = 'image';
      if (resourceType) detectedResourceType = resourceType;

      if (!resourceType) {
        if (url.includes('/raw/') || url.includes('/subtitles/')) {
          detectedResourceType = 'raw';
        } else if (url.includes('/video/') || url.includes('.mp4') || url.includes('.webm')) {
          detectedResourceType = 'video';
        }
      }

      const destroy = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: resourceType || detectedResourceType
      });

      if (destroy.result !== 'ok') throw new Error('Cloudinary delete failed');
    } catch (e) {
      if (e instanceof Error) return e;
      throw new Error('Cloudinary delete failed');
    }
  }

  async uploadFile(
    file: File,
    type: 'image' | 'video' | 'doc' | 'audio' | 'subtitle' = 'image',
    folderName: string = 'indoxxi'
  ): Promise<string | Error> {
    try {
      const init = this.initCloudinary();
      if (init instanceof Error) throw init;

      const validate = this.validateFile(file, type);
      if (validate instanceof Error) throw validate;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto';
      let transformation = undefined;

      switch (type) {
        case 'image':
          resourceType = 'image';
          transformation = [{ width: 500, height: 500, crop: 'limit' }, { quality: 'auto' }];
          break;
        case 'video':
          resourceType = 'video';
          break;
        case 'subtitle':
        case 'doc':
        case 'audio':
          resourceType = 'raw';
      }

      const uploadPayload: UploadApiOptions = {
        folder: folderName,
        resource_type: resourceType,
        transformation: transformation
      };

      if (type === 'subtitle') {
        uploadPayload.type = 'upload';
        uploadPayload.format = 'txt';
      }

      const result: UploadApiResponse | PromiseLike<UploadApiResponse> | undefined =
        await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(uploadPayload, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(buffer);
        });

      if (result === undefined || !result?.secure_url) throw new Error('Cloudinary upload failed');

      return result.secure_url;
    } catch (e) {
      if (e instanceof Error) return e;
      throw new Error('Cloudinary upload failed');
    }
  }

  extractCloudinaryPublicId(url: string): string | null {
    if (!url.includes('cloudinary.com')) return null;
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/');

      let publicIdParts: string[];

      if (url.includes('/raw/upload/')) {
        const uploadIndex = parts.findIndex((part) => part === 'upload');
        if (uploadIndex === -1) return null;
        publicIdParts = parts.slice(uploadIndex + 2);
      } else if (url.includes('/upload/')) {
        const uploadIndex = parts.findIndex((part) => part === 'upload');
        if (uploadIndex === -1) return null;
        publicIdParts = parts.slice(uploadIndex + 2);
      } else {
        return null;
      }

      if (publicIdParts[0]?.startsWith('v')) {
        publicIdParts = publicIdParts.slice(1);
      }

      let publicId = publicIdParts.join('/');

      if (publicId.includes('.')) {
        publicId = publicId.split('.').slice(0, -1).join('.');
      }

      return publicId;
    } catch (e) {
      console.error('Error extracting public ID:', e);
      return null;
    }
  }

  validateFile(
    file?: File,
    type: 'image' | 'video' | 'doc' | 'audio' | 'subtitle' = 'image'
  ): void | Error {
    try {
      if (!file || !(file instanceof File)) throw new Error('File is required');
      if (file.size > 10 * 1024 * 1024) throw new Error('File size must be less than 10MB');

      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      const allowedDocTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.ms-excel',
        'application/vnd.ms-powerpoint'
      ];
      const allowedAudioTypes = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3'];

      const allowedSubtitleTypes = [
        'text/vtt',
        'text/srt',
        'application/x-subrip',
        'text/plain',
        'application/octet-stream' // Fallback
      ];

      switch (type) {
        case 'image':
          if (!allowedImageTypes.includes(file.type)) throw new Error('File type is not allowed');
          break;
        case 'video':
          if (!allowedVideoTypes.includes(file.type)) throw new Error('File type is not allowed');
          break;
        case 'doc':
          if (!allowedDocTypes.includes(file.type)) throw new Error('File type is not allowed');
          break;
        case 'audio':
          if (!allowedAudioTypes.includes(file.type)) throw new Error('File type is not allowed');
          break;
        case 'subtitle':
          const fileName = file.name.toLowerCase();
          const isValidExtension = fileName.endsWith('.srt') || fileName.endsWith('.vtt');
          const isValidMimeType = allowedSubtitleTypes.includes(file.type);

          if (!isValidExtension && !isValidMimeType) {
            throw new Error('Only SRT and VTT subtitle files are allowed');
          }
          break;
        default:
          throw new Error('File type is not allowed');
      }
    } catch (e) {
      if (e instanceof Error) return e;
      throw new Error('File type is not allowed');
    }
  }
}
