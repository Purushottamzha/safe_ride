import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, path: requestPath, params, user, ip, headers } = request;

    if (!this.mutatingMethods.includes(method)) {
      return next.handle();
    }

    const entity = this.parseEntity(requestPath);
    const entityId = params?.id;
    const ipAddress = ip || headers['x-forwarded-for'] || headers['x-real-ip'];
    const userAgent = headers['user-agent'];

    return next.handle().pipe(
      tap((responseData) => {
        this.prisma.auditLog
          .create({
            data: {
              action: `${method} ${requestPath}`,
              entity,
              entityId: entityId || undefined,
              userId: user?.id,
              userEmail: user?.email,
              userRole: user?.role,
              schoolId: user?.schoolId,
              newValues: responseData ? JSON.parse(JSON.stringify(responseData)) : undefined,
              ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress?.[0],
              userAgent,
            },
          })
          .catch(() => {});
      }),
    );
  }

  private parseEntity(path: string): string {
    const parts = path.split('/').filter(Boolean);
    const entityIndex = parts.findIndex(
      (p) => !['api', 'v1', 'v2'].includes(p) && isNaN(Number(p)) && !p.startsWith('?'),
    );
    return entityIndex >= 0 ? parts[entityIndex] : 'unknown';
  }
}
