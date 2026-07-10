import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../modules/metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const route = request.route?.path || request.url || 'unknown';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;
          this.metricsService.httpRequestDurationMicroseconds.observe({ method, route, status_code: String(statusCode) }, duration);
          this.metricsService.httpRequestCounter.inc({ method, route, status_code: String(statusCode) });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          this.metricsService.httpRequestDurationMicroseconds.observe({ method, route, status_code: String(statusCode) }, duration);
          this.metricsService.httpRequestCounter.inc({ method, route, status_code: String(statusCode) });
          this.metricsService.httpErrorCounter.inc({ method, route, status_code: String(statusCode) });
        },
      }),
    );
  }
}
