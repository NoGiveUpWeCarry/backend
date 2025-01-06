import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ERROR_MESSAGES } from '@common/constants/error-messages';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async updateUserRole(userId: number, roleId: number) {
    if (![1, 2, 3].includes(roleId)) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_ROLE_ID);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    console.log(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { role_id: roleId },
    });
  }
}
