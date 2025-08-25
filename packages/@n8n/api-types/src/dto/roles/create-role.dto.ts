import { roleNamespaceSchema } from '@n8n/permissions/src/schemas.ee';
import { z } from 'zod';
import { Z } from 'zod-class';

export class CreateRoleDto extends Z.class({
	displayName: z.string().min(2).max(100),
	description: z.string().max(500).optional(),
	roleType: roleNamespaceSchema,
	scopes: z.array(z.string()),
}) {}
