import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CpService } from '../shared/services/cp.service';
import { RegisterDto, LoginDto, CreateAnonymousUserDto, UpdateProfileDto, UpgradeAnonymousUserDto } from './dto/user.dto';
import type { JwtPayload } from '../auth/auth.service';

@ApiTags('users')
@Controller('users')
@UseGuards(ThrottlerGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cpService: CpService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.usersService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @Public()
  @Post('anonymous')
  @ApiOperation({ summary: 'Create anonymous user' })
  @ApiResponse({ status: 201, description: 'Anonymous user created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createAnonymous(@Body() createAnonymousUserDto: CreateAnonymousUserDto) {
    return this.usersService.createAnonymousUser(createAnonymousUserDto);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @Put('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, updateProfileDto);
  }

  @Get('cp')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user Computing Power (CP)' })
  @ApiResponse({ status: 200, description: 'CP retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentCP(@CurrentUser() user: JwtPayload) {
    const current = await this.cpService.getCurrentCP(user.sub);
    const max = await this.cpService.getMaxCP(user.sub);
    
    return {
      current,
      max,
    };
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser() user: JwtPayload, @Request() req: Request) {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    return this.usersService.logout(user.sub, token);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.usersService.refreshTokens(refreshToken);
  }

  @Put('upgrade')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upgrade anonymous user to registered user' })
  @ApiResponse({ status: 200, description: 'User upgraded successfully' })
  @ApiResponse({ status: 400, description: 'User is not anonymous' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email or nickname already exists' })
  async upgradeAnonymousUser(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpgradeAnonymousUserDto,
  ) {
    const upgraded = await this.usersService.upgradeAnonymousUser(user.sub, dto);
    return {
      id: upgraded.id,
      email: upgraded.email,
      nickname: upgraded.nickname,
      isAnonymous: upgraded.isAnonymous,
      cpCount: upgraded.cpCount,
      totalPoints: upgraded.totalPoints,
      country: upgraded.country,
    };
  }
}