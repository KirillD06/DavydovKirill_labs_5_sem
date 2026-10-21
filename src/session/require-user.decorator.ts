import { SetMetadata } from '@nestjs/common';

export const REQUIRE_USER = 'requireUser';
export const RequireUser = () => SetMetadata(REQUIRE_USER, true);
