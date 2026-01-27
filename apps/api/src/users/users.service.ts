import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CpService } from '../shared/services/cp.service';
import { RegisterDto, LoginDto, CreateAnonymousUserDto, UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly cpService: CpService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingNickname = await this.prisma.user.findUnique({
      where: { nickname: registerDto.nickname },
    });

    if (existingNickname) {
      throw new ConflictException('Nickname already exists');
    }

    const passwordHash = await this.authService.hashPassword(registerDto.password);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        nickname: registerDto.nickname,
        passwordHash,
        country: registerDto.country,
        emailConsent: registerDto.emailConsent || false,
        emailConsentAt: registerDto.emailConsent ? new Date() : null,
        cpCount: 50, // Authenticated users start with 50 CP
      },
    });

    const tokens = this.authService.generateTokens(user);

    // Store session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        isAnonymous: user.isAnonymous,
        cpCount: user.cpCount,
        totalPoints: user.totalPoints,
        country: user.country,
      },
      tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await this.authService.comparePassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const tokens = this.authService.generateTokens(user);

    // Store session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        isAnonymous: user.isAnonymous,
        cpCount: user.cpCount,
        totalPoints: user.totalPoints,
        country: user.country,
      },
      tokens,
    };
  }

  async createAnonymousUser(createAnonymousUserDto: CreateAnonymousUserDto) {
    const existingNickname = await this.prisma.user.findUnique({
      where: { nickname: createAnonymousUserDto.nickname },
    });

    if (existingNickname) {
      throw new ConflictException('Nickname already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        nickname: createAnonymousUserDto.nickname,
        isAnonymous: true,
        cpCount: 5, // Anonymous users start with 5 CP
      },
    });

    const tokens = this.authService.generateTokens(user);

    // Store session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        isAnonymous: user.isAnonymous,
        cpCount: user.cpCount,
        totalPoints: user.totalPoints,
        country: user.country,
      },
      tokens,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        isAnonymous: true,
        cpCount: true,
        totalPoints: true,
        country: true,
        emailConsent: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get current CP with auto-refill
    const currentCP = await this.cpService.getCurrentCP(userId);

    return {
      ...user,
      cpCount: currentCP,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    if (updateProfileDto.country !== undefined) {
      updateData.country = updateProfileDto.country;
    }

    if (updateProfileDto.emailConsent !== undefined) {
      updateData.emailConsent = updateProfileDto.emailConsent;
      if (updateProfileDto.emailConsent && !user.emailConsent) {
        updateData.emailConsentAt = new Date();
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nickname: true,
        isAnonymous: true,
        cpCount: true,
        totalPoints: true,
        country: true,
        emailConsent: true,
      },
    });

    return updatedUser;
  }

  async logout(userId: string, token: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token,
      },
    });
  }

  async refreshTokens(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new BadRequestException('Invalid refresh token');
    }

    const payload = this.authService.verifyRefreshToken(refreshToken);
    const tokens = this.authService.generateTokens(session.user);

    // Update session
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { tokens };
  }
}