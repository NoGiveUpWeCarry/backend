import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { FollowService } from '@modules/follow/follow.service';

@UseGuards(JwtAuthGuard)
@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':targetUserId')
  async togggleFollow(
    @Req() req: any,
    @Param('targetUserId') targetUserId: string
  ) {
    const userId = req.user.user_id;
    const numTargetUserId = parseInt(targetUserId);
    return this.followService.toggleFollow(userId, numTargetUserId);
  }
}
