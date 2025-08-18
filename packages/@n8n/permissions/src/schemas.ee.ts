import { z } from 'zod';

import type { GlobalRole, ProjectRole } from './types.ee';

export const roleNamespaceSchema = z.enum(['global', 'project', 'credential', 'workflow']);

export const globalRoleSchema = z.enum(['global:owner', 'global:admin', 'global:member']);

export const assignableGlobalRoleSchema = globalRoleSchema.exclude([
	'global:owner', // Owner cannot be changed
]);

export const personalRoleSchema = z.enum([
	'project:personalOwner', // personalOwner is only used for personal projects
]);

export const teamRoleSchema = z.enum(['project:admin', 'project:editor', 'project:viewer']);

export const customRoleSchema = z.string().refine((val) => val !== 'project:personalOwner', {
	message: "'project:personalOwner' is not assignable",
});

export const projectRoleSchema = z.union([personalRoleSchema, teamRoleSchema]);

export const credentialSharingRoleSchema = z.enum(['credential:owner', 'credential:user']);

export const workflowSharingRoleSchema = z.enum(['workflow:owner', 'workflow:editor']);

export function isBuildInGlobalRole(role: string): role is GlobalRole {
	return globalRoleSchema.safeParse(role).success;
}

export function isBuildInProjectRole(role: string): role is ProjectRole {
	return projectRoleSchema.safeParse(role).success;
}
