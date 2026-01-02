import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../modules/supabase/supabase.service';

export interface OwnershipConfig {
  resourceType: 'loan' | 'collateral' | 'user';
  resourceIdParam: string; 
  userIdField?: string; 
}

export const OWNERSHIP_KEY = 'ownership';


@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ownershipConfig = this.reflector.get<OwnershipConfig>(
      OWNERSHIP_KEY,
      context.getHandler(),
    );

    if (!ownershipConfig) {
      
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const resourceId = request.params[ownershipConfig.resourceIdParam];

    if (!resourceId) {
      throw new ForbiddenException(
        `Resource ID parameter '${ownershipConfig.resourceIdParam}' not found in request`,
      );
    }

    
    const supabase = this.supabaseService.getClient();
    const tableName = this.getTableName(ownershipConfig.resourceType);
    const userIdField = ownershipConfig.userIdField || 'userId';

    const { data: resource, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', resourceId)
      .single();

    if (error || !resource) {
      throw new NotFoundException(
        `${ownershipConfig.resourceType} with ID ${resourceId} not found`,
      );
    }

    
    const resourceOwnerId = resource[userIdField];

    if (!resourceOwnerId) {
      throw new ForbiddenException(
        `Resource does not have a ${userIdField} field`,
      );
    }

    if (resourceOwnerId !== user.id) {
      throw new ForbiddenException(
        `You do not have permission to access this ${ownershipConfig.resourceType}`,
      );
    }

    
    request.resource = resource;

    return true;
  }

  private getTableName(resourceType: string): string {
    const tableMap: Record<string, string> = {
      loan: 'loans',
      collateral: 'collateral',
      user: 'users',
    };

    return tableMap[resourceType] || resourceType;
  }
}
