import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TrackingService } from './tracking.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private trackingService: TrackingService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers['authorization']?.replace('Bearer ', '');

      if (token) {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>(
            'JWT_SECRET',
            'super_secret_jwt_access_token_key_for_nextus_pdms_2026_dev',
          ),
        });
        client.data.user = payload;
      }
      this.logger.log(`Client connected to tracking: ${client.id}`);
    } catch (e) {
      // Allow unauthenticated connection for public tracking view if room is valid
      this.logger.warn(`Unauthenticated client joined: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_order')
  async handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; trackingNumber?: string },
  ) {
    const orderId = data.orderId;
    if (!orderId) return { error: 'orderId is required' };

    const room = `order:${orderId}`;
    client.join(room);
    this.logger.log(`Socket ${client.id} joined room ${room}`);
    return { success: true, room };
  }

  @SubscribeMessage('update_location')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      orderId: string;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
    },
  ) {
    const userId = client.data?.user?.sub;
    if (!userId) {
      return { error: 'Authentication required for broadcasting GPS location' };
    }

    try {
      const point = await this.trackingService.recordLocation({
        orderId: data.orderId,
        partnerUserId: userId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
      });

      const room = `order:${data.orderId}`;
      this.server.to(room).emit('location_update', {
        orderId: data.orderId,
        latitude: point.latitude,
        longitude: point.longitude,
        speed: point.speed,
        heading: point.heading,
        recordedAt: point.recordedAt,
      });

      return { success: true, recordedAt: point.recordedAt };
    } catch (err: any) {
      return { error: err.message };
    }
  }
}
