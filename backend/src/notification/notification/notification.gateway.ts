import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client Disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody('userId') userId: string, @ConnectedSocket() client: Socket) {
    client.join(`user_${userId}`);
    return { event: 'room-joined', data: `Joined room user_${userId}` };
  }

  // Callable from other services to emit notifications globally or specifically
  sendNotificationToUser(userId: string, payload: any) {
    this.server.to(`user_${userId}`).emit('notification', payload);
  }

  sendGlobalNotification(payload: any) {
    this.server.emit('global-notification', payload);
  }
}
