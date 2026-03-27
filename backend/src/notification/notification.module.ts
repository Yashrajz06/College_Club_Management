import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification/notification.gateway';

@Module({
  providers: [NotificationGateway],
  exports: [NotificationGateway],
})
export class NotificationModule {}
