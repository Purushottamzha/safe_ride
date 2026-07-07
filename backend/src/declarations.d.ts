declare module '@nestjs/jwt' {
  import { DynamicModule } from '@nestjs/common';
  export class JwtService {
    sign(payload: any, options?: any): string;
    verify(token: string, options?: any): any;
    decode(token: string, options?: any): any;
  }
  export class JwtModule {
    static registerAsync(options: any): DynamicModule;
    static register(options: any): DynamicModule;
  }
}

declare module '@nestjs/passport' {
  import { CanActivate, Type } from '@nestjs/common';
  export function AuthGuard(strategy?: string): Type<CanActivate>;
  export class PassportModule {
    static register(options?: any): any;
  }
  export function PassportStrategy(strategy: any, name?: string): any;
}

declare module '@nestjs/throttler' {
  import { CanActivate } from '@nestjs/common';
  import { DynamicModule } from '@nestjs/common';
  export class ThrottlerModule {
    static forRootAsync(options: any): DynamicModule;
    static forRoot(options?: any): DynamicModule;
  }
  export class ThrottlerGuard implements CanActivate {
    canActivate(context: any): boolean | Promise<boolean>;
  }
}

declare module 'socket.io' {
  export class Server {
    to(room: string): { emit(event: string, data: any): void };
  }
  export class Socket {
    handshake: { auth?: Record<string, any>; query?: Record<string, any> };
    data: Record<string, any>;
    id: string;
    join(room: string): void;
    leave(room: string): void;
    emit(event: string, data: any): void;
    disconnect(): void;
  }
}
