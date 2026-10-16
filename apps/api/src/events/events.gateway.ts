import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsEvent, WsEventType } from '@crypto/contracts';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  /** Broadcast a typed event to all connected clients */
  broadcast<T>(event: WsEventType, data: T) {
    const payload: WsEvent<T> = {
      event,
      data,
      ts: new Date().toISOString(),
    };
    this.server.emit(event, payload);
  }

  /** Broadcast to a specific instrument room */
  broadcastToRoom<T>(room: string, event: WsEventType, data: T) {
    const payload: WsEvent<T> = {
      event,
      data,
      ts: new Date().toISOString(),
    };
    this.server.to(room).emit(event, payload);
  }
}
