import type { RequestEvent } from '@sveltejs/kit';
import { CampaignService } from './campaign/service.js';
import { CloudinaryHelper } from './cloudinary.js';
import { RedisClient } from './redis.js';
import { RequestService } from './request.js';
import { ServerBase } from './server.js';
import { SessionService } from './session.js';
import { SettingService } from './setting.js';
import { UserService } from './user.js';

export class ServiceHelper extends ServerBase {
  public readonly db: InstanceType<typeof ServerBase>;
  public readonly session: InstanceType<typeof SessionService>;
  public readonly redis: InstanceType<typeof RedisClient>;
  public static request: InstanceType<typeof RequestService>;
  public readonly cloudinary: InstanceType<typeof CloudinaryHelper>;
  public readonly setting: InstanceType<typeof SettingService>;
  public readonly users: InstanceType<typeof UserService>;
  public readonly campaigns: InstanceType<typeof CampaignService>;
  constructor(event: RequestEvent) {
    super(event);
    this.db = new ServerBase(event);
    this.session = new SessionService(event);
    this.redis = new RedisClient(event);
    ServiceHelper.initApiClient(event);
    this.cloudinary = new CloudinaryHelper(event);
    this.setting = new SettingService(event);
    this.users = new UserService(event);
    this.campaigns = new CampaignService(event);
  }
  private static initApiClient(event: RequestEvent) {
    ServiceHelper.request = new RequestService(
      event,
      {
        'User-Agent': 'Bitfy Server',
        ...(event.request.headers.get('authorization') && {
          Authorization: event.request.headers.get('authorization')!
        })
      },
      ''
    );
  }
}