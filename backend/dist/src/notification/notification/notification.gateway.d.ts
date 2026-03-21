import { Server, Socket } from 'socket.io';
export declare class NotificationGateway {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(userId: string, client: Socket): {
        event: string;
        data: string;
    };
    sendNotificationToUser(userId: string, payload: any): void;
    sendGlobalNotification(payload: any): void;
}
