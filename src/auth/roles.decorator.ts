import { SetMetadata } from '@nestjs/common';
import { UserType } from 'generated/prisma/enums';

export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);
