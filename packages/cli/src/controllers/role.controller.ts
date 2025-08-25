import { CreateRoleDto, UpdateRoleDto } from '@n8n/api-types';
import { Body, Delete, Get, Param, Patch, Put, RestController } from '@n8n/decorators';

import { RoleService } from '@/services/role.service';

@RestController('/roles')
export class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@Get('/')
	async getAllRoles() {
		return await this.roleService.getAllRoles();
	}

	@Get('/:slug')
	async getRoleBySlug(@Param('slug') slug: string) {
		return await this.roleService.getRole(slug);
	}

	@Patch('/:slug')
	async updateRole(@Param('slug') slug: string, @Body body: UpdateRoleDto) {
		return await this.roleService.updateCustomRole(slug, body);
	}

	@Delete('/:slug')
	async deleteRole(@Param('slug') slug: string) {
		return await this.roleService.removeCustomRole(slug);
	}

	@Put('/')
	async createRole(@Body body: CreateRoleDto) {
		return await this.roleService.createCustomRole(body);
	}
}
