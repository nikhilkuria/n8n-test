import {
	GLOBAL_SCOPE_MAP,
	type GlobalRole,
	isBuildInGlobalRole,
	PROJECT_SCOPE_MAP,
	type ProjectRole,
} from '@n8n/permissions';

import type { Role } from 'entities';

function buildInProjectRoleToRoleObject(role: ProjectRole): Role {
	return {
		slug: role,
		displayName: role,
		scopes: PROJECT_SCOPE_MAP[role].map((scope) => {
			return {
				slug: scope,
				displayName: scope,
				description: null,
			};
		}),
		projectRelations: [],
		systemRole: true,
		roleType: 'project',
		description: `Built-in project role with ${role} permissions.`,
	};
}

function buildInGlobalRoleToRoleObject(role: GlobalRole): Role {
	return {
		slug: role,
		displayName: role,
		scopes: GLOBAL_SCOPE_MAP[role].map((scope) => {
			return {
				slug: scope,
				displayName: scope,
				description: null,
			};
		}),
		projectRelations: [],
		systemRole: true,
		roleType: 'global',
		description: `Built-in global role with ${role} permissions.`,
	};
}

export function buildInRoleToRoleObject(role: GlobalRole | ProjectRole): Role {
	if (isBuildInGlobalRole(role)) {
		return buildInGlobalRoleToRoleObject(role);
	}
	return buildInProjectRoleToRoleObject(role);
}

export const GLOBAL_OWNER_ROLE = buildInRoleToRoleObject('global:owner');
export const GLOBAL_ADMIN_ROLE = buildInRoleToRoleObject('global:admin');
export const GLOBAL_MEMBER_ROLE = buildInRoleToRoleObject('global:member');

export const PROJECT_VIEWER_ROLE = buildInRoleToRoleObject('project:viewer');
export const PROJECT_EDITOR_ROLE = buildInRoleToRoleObject('project:editor');
export const PROJECT_ADMIN_ROLE = buildInRoleToRoleObject('project:admin');
export const PROJECT_PERSONAL_OWNER_ROLE = buildInRoleToRoleObject('project:personalOwner');

export const GLOBAL_ROLES: Record<GlobalRole, Role> = {
	'global:owner': GLOBAL_OWNER_ROLE,
	'global:admin': GLOBAL_ADMIN_ROLE,
	'global:member': GLOBAL_MEMBER_ROLE,
};
