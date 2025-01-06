import { Controller, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('select-role')
  async selectRole(@Req() req, @Body('roleId') roleId: number) {
    const userId = req.user.id; // JWT로부터 가져온 사용자 ID
    return this.userService.updateUserRole(userId, roleId);
  }
}
