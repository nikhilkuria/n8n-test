import {
	CredentialsEntity,
	SharedCredentials,
	SharedWorkflow,
	User,
	ListQueryDb,
	ScopesField,
	ProjectRelation,
	RoleRepository,
	Role,
	Scope as DBScope,
	ScopeRepository,
} from '@n8n/db';
import { Service } from '@n8n/di';
import type { Scope } from '@n8n/permissions';
import { combineScopes, getAuthPrincipalScopes, getRoleScopes } from '@n8n/permissions';
import { UnexpectedError } from 'n8n-workflow';

import { License } from '@/license';
import { CreateRoleDto, UpdateRoleDto } from '@n8n/api-types';

@Service()
export class RoleService {
	constructor(
		private readonly license: License,
		private readonly roleRepository: RoleRepository,
		private readonly scopeRepository: ScopeRepository,
	) {}

	async getAllRoles() {
		const roles = await this.roleRepository.findAll();
		return roles.map((r) => {
			return {
				...r,
				licensed: this.isRoleLicensed(r),
			};
		});
	}

	async getRole(slug: string) {
		return await this.roleRepository.findBySlug(slug);
	}

	async removeCustomRole(slug: string) {
		const role = await this.roleRepository.findBySlug(slug);
		if (!role) {
			throw new Error('Role not found');
		}
		if (role.systemRole) {
			throw new Error('Cannot delete system roles');
		}
		return await this.roleRepository.removeBySlug(slug);
	}

	private async resolveScopes(scopeSlugs: string[] | undefined): Promise<DBScope[] | undefined> {
		if (!scopeSlugs) {
			return undefined;
		}

		if (scopeSlugs.length === 0) {
			return [];
		}

		const scopes = await this.scopeRepository.findByList(scopeSlugs);
		if (scopes.length !== scopeSlugs.length) {
			const invalidScopes = scopeSlugs.filter((slug) => !scopes.some((s) => s.slug === slug));
			throw new Error(`The following scopes are invalid: ${invalidScopes.join(', ')}`);
		}

		return scopes;
	}

	async updateCustomRole(slug: string, newData: UpdateRoleDto) {
		const role = await this.roleRepository.findBySlug(slug);
		if (!role) {
			throw new Error('Role not found');
		}
		if (role.systemRole) {
			throw new Error('Cannot update system roles');
		}

		const { displayName, description, scopes: scopeSlugs } = newData;

		return await this.roleRepository.updateRole(slug, {
			displayName,
			description,
			scopes: await this.resolveScopes(scopeSlugs),
		});
	}

	async createCustomRole(newRole: CreateRoleDto) {
		const role = new Role();
		role.displayName = newRole.displayName;
		if (newRole.description) {
			role.description = newRole.description;
		}
		const scopes = await this.resolveScopes(newRole.scopes);
		if (scopes === undefined) throw new Error('Scopes are required');
		role.scopes = scopes;
		role.systemRole = false;
		role.roleType = newRole.roleType;
		role.slug = `${newRole.roleType}:${newRole.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
		return await this.roleRepository.save(role);
	}

	addScopes(
		rawWorkflow: ListQueryDb.Workflow.WithSharing | ListQueryDb.Workflow.WithOwnedByAndSharedWith,
		user: User,
		userProjectRelations: ProjectRelation[],
	): ListQueryDb.Workflow.WithScopes;
	addScopes(
		rawCredential: CredentialsEntity,
		user: User,
		userProjectRelations: ProjectRelation[],
	): CredentialsEntity & ScopesField;
	addScopes(
		rawCredential:
			| ListQueryDb.Credentials.WithSharing
			| ListQueryDb.Credentials.WithOwnedByAndSharedWith,
		user: User,
		userProjectRelations: ProjectRelation[],
	): ListQueryDb.Credentials.WithScopes;
	addScopes(
		rawEntity:
			| CredentialsEntity
			| ListQueryDb.Workflow.WithSharing
			| ListQueryDb.Credentials.WithOwnedByAndSharedWith
			| ListQueryDb.Credentials.WithSharing
			| ListQueryDb.Workflow.WithOwnedByAndSharedWith,
		user: User,
		userProjectRelations: ProjectRelation[],
	):
		| (CredentialsEntity & ScopesField)
		| ListQueryDb.Workflow.WithScopes
		| ListQueryDb.Credentials.WithScopes {
		const shared = rawEntity.shared;
		const entity = rawEntity as
			| (CredentialsEntity & ScopesField)
			| ListQueryDb.Workflow.WithScopes
			| ListQueryDb.Credentials.WithScopes;

		entity.scopes = [];

		if (shared === undefined) {
			return entity;
		}

		if (!('active' in entity) && !('type' in entity)) {
			throw new UnexpectedError('Cannot detect if entity is a workflow or credential.');
		}

		entity.scopes = this.combineResourceScopes(
			'active' in entity ? 'workflow' : 'credential',
			user,
			shared,
			userProjectRelations,
		);

		return entity;
	}

	combineResourceScopes(
		type: 'workflow' | 'credential',
		user: User,
		shared: SharedCredentials[] | SharedWorkflow[],
		userProjectRelations: ProjectRelation[],
	): Scope[] {
		const globalScopes = getAuthPrincipalScopes(user, [type]);
		const scopesSet: Set<Scope> = new Set(globalScopes);
		for (const sharedEntity of shared) {
			const pr = userProjectRelations.find(
				(p) => p.projectId === (sharedEntity.projectId ?? sharedEntity.project.id),
			);
			let projectScopes: Scope[] = [];
			if (pr) {
				projectScopes = getRoleScopes(pr.role);
			}
			const resourceMask = getRoleScopes(sharedEntity.role);
			const mergedScopes = combineScopes(
				{
					global: globalScopes,
					project: projectScopes,
				},
				{ sharing: resourceMask },
			);
			mergedScopes.forEach((s) => scopesSet.add(s));
		}
		return [...scopesSet].sort();
	}

	isRoleLicensed(role: Role) {
		// TODO: move this info into FrontendSettings

		if (!role.systemRole) {
			// This is a custom role, there for we need to check if
			// custom roles are licensed
			// TODO: add license check for custom roles
			return true;
		}

		switch (role.slug) {
			case 'project:admin':
				return this.license.isProjectRoleAdminLicensed();
			case 'project:editor':
				return this.license.isProjectRoleEditorLicensed();
			case 'project:viewer':
				return this.license.isProjectRoleViewerLicensed();
			case 'global:admin':
				return this.license.isAdvancedPermissionsLicensed();
			default:
				return true;
		}
	}
}
