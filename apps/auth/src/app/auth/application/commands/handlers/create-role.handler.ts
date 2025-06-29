import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { CreateRoleCommand } from '../impl/create-role.command';
import { IRoleRepository } from '../../../domain/interfaces/role.repository.interface';
import { ConflictException } from '../../../domain/exceptions/conflict.exception';
import { RoleResponse } from '@auth-microservices/shared/types';
import { RoleAggregate } from '../../../domain/aggregates/role.aggregate';
import { Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RoleCreatedEvent } from '../../../domain/events/role-created.event';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
    constructor(
        private readonly publisher: EventPublisher,
        @Inject('IRoleRepository') private readonly roleRepository: IRoleRepository,
    ) { }

    async execute(command: CreateRoleCommand): Promise<RoleResponse> {
        const { name, displayName, description, isActive, isSystem } = command;

        const existingRole = await this.roleRepository.findByName(name);
        if (existingRole) {
            throw new ConflictException('Role name already exists.');
        }

        const roleId = uuidv4();
        const roleAggregate = this.publisher.mergeObjectContext(
            RoleAggregate.create({
                id: roleId,
                name,
                displayName,
                description,
                isSystem,
                isActive,
                createdAt: new Date(),
                updatedAt: new Date(),
                rolePermissions: [],
            })
        );
        if (isActive !== undefined) {
            roleAggregate.updateDetails(undefined, undefined, undefined, isActive);
        }

        await this.roleRepository.save(roleAggregate);
        roleAggregate.apply(new RoleCreatedEvent(roleAggregate.getId(), roleAggregate.getName()));
        roleAggregate.commit();

        return {
            role: {
                id: roleAggregate.getId(),
                name: roleAggregate.getName(),
                displayName: roleAggregate.getDisplayName(),
                description: roleAggregate.getDescription() || '',
                isActive: roleAggregate.getIsActive(),
                isSystem: roleAggregate.getIsSystem(),
            },
        };
    }
}