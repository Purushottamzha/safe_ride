import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, schoolId: true },
    });

    if (!userRecord) {
      throw new ForbiddenException('User not found');
    }

    const userPermissions = await this.prisma.rolePermission.findMany({
      where: {
        role: {
          name: userRecord.role,
          schoolId: userRecord.schoolId,
        },
      },
      include: {
        permission: true,
      },
    });

    const userPermissionNames = userPermissions.map(
      (rp) => rp.permission.name,
    );

    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissionNames.includes(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
