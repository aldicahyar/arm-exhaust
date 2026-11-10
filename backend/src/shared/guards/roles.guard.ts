import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Akses ditolak: role tidak memiliki izin.');
    }

    // Direct role match
    if (requiredRoles.includes(user.role)) {
      return true;
    }

    // Dynamic role capability check:
    // If 'admin' is required, allow if role has can_access_admin capability
    if (requiredRoles.includes('admin') && user.can_access_admin === true) {
      return true;
    }

    // If 'reseller' or 'b2b' is required, allow if role has can_access_b2b capability
    if (
      (requiredRoles.includes('reseller') || requiredRoles.includes('b2b')) &&
      user.can_access_b2b === true
    ) {
      return true;
    }

    throw new ForbiddenException('Akses ditolak: role tidak memiliki izin.');

    return true;
  }
}
