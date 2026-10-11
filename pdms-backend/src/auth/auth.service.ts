import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RegisterPartnerDto } from './dto/register-partner.dto';
import { KycStatus, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(user: { id: string; phone: string; role: Role }) {
    const payload = { sub: user.id, phone: user.phone, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_SECRET',
        'super_secret_jwt_access_token_key_for_nextus_pdms_2026_dev',
      ),
      expiresIn: '1h',
    });

    const refreshTokenRaw = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = this.hashToken(refreshTokenRaw);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn: 3600,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { identifier, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { email: identifier },
        ],
      },
      include: {
        partnerProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid phone/email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account has been suspended. Please contact support.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid phone/email or password');
    }

    const tokens = await this.generateTokens(user);

    await this.auditService.log({
      actorId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        partnerProfile: user.partnerProfile,
      },
      ...tokens,
    };
  }

  async registerCustomer(dto: RegisterCustomerDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: dto.phone },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException('A user with this phone or email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        role: Role.CUSTOMER,
      },
    });

    const tokens = await this.generateTokens(user);

    await this.auditService.log({
      actorId: user.id,
      action: 'CUSTOMER_REGISTER',
      entity: 'User',
      entityId: user.id,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async registerPartner(dto: RegisterPartnerDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: dto.phone },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException('A partner with this phone or email already exists');
    }

    const plateExists = await this.prisma.vehicle.findUnique({
      where: { plateNumber: dto.plateNumber },
    });
    if (plateExists) {
      throw new ConflictException('A vehicle with this license plate is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          passwordHash,
          role: Role.PARTNER,
        },
      });

      const partner = await tx.partnerProfile.create({
        data: {
          userId: user.id,
          kycStatus: KycStatus.PENDING,
          isAvailable: false,
          vehicles: {
            create: {
              vehicleType: dto.vehicleType,
              plateNumber: dto.plateNumber,
              make: dto.makeModel?.split(' ')[0] || 'Generic',
              model: dto.makeModel?.split(' ').slice(1).join(' ') || 'Vehicle',
              year: new Date().getFullYear(),
              isVerified: false,
            },
          },
        },
        include: {
          vehicles: true,
        },
      });

      return { user, partner };
    });

    const tokens = await this.generateTokens(result.user);

    await this.auditService.log({
      actorId: result.user.id,
      action: 'PARTNER_REGISTER',
      entity: 'PartnerProfile',
      entityId: result.partner.id,
    });

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
        email: result.user.email,
        role: result.user.role,
        partnerProfile: result.partner,
      },
      ...tokens,
    };
  }

  async refresh(refreshTokenRaw: string) {
    if (!refreshTokenRaw) {
      throw new BadRequestException('Refresh token is required');
    }

    const tokenHash = this.hashToken(refreshTokenRaw);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { partnerProfile: true } } },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // Revoke old refresh token (Token Rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Issue new pair
    return this.generateTokens(storedToken.user);
  }

  async logout(userId: string, refreshTokenRaw?: string) {
    if (refreshTokenRaw) {
      const tokenHash = this.hashToken(refreshTokenRaw);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, userId },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all active sessions
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.auditService.log({
      actorId: userId,
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: userId,
    });

    return { message: 'Logged out successfully' };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        addresses: true,
        partnerProfile: {
          include: {
            vehicles: true,
            documents: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
