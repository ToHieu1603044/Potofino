// src/app/auth/infrastructure/persistence/mappers/user.mapper.ts

import { UserAggregate, UserProps } from '../../../domain/aggregates/user.aggregate';
import { RefreshTokenEntity } from '../../../domain/entities/refresh-token.entity';
import { UserRoleEntity } from '../../../domain/entities/user-role.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { Password } from '../../../domain/value-objects/password.vo';
import {Prisma, User} from "@prisma/client-auth";
type UserWithRelations = {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    password: string;
    isActive: boolean;
    phone?: string | null;
    createdAt: Date;
    updatedAt: Date;
    refreshTokens: {
        id: string;
        token: string;
        userId: string;
        expiresAt: Date;
    }[];
    userRoles: {
        id: string;
        userId: string;
        roleId: string;
        assignedBy?: string | null;
        expiresAt?: Date | null;
    }[];
};
type UserPrisma = Pick<UserWithRelations, 'id' | 'email' | 'name' | 'firstName' | 'lastName' | 'password' | 'isActive' | 'phone'>;


export class UserMapper {
    static async toDomain(prismaUser: UserWithRelations): Promise<UserAggregate> {
        const email = Email.create(prismaUser.email);
        const password = Password.fromHashed(prismaUser.password);

        const props: UserProps = {
            id: prismaUser.id,
            email,
            password,
            name: prismaUser.name,
            firstName: prismaUser.firstName,
            lastName: prismaUser.lastName,
            isActive: prismaUser.isActive,
            phone: prismaUser.phone ?? undefined,
            createdAt: prismaUser.createdAt,
            updatedAt: prismaUser.updatedAt,
            refreshTokens: prismaUser.refreshTokens.map(rt =>
                RefreshTokenEntity.create(rt.token, rt.userId, rt.expiresAt, rt.id),
            ),
            userRoles: prismaUser.userRoles.map(ur =>
                UserRoleEntity.create(ur.userId, ur.roleId, ur.assignedBy ?? undefined, ur.expiresAt ?? undefined, ur.id),
            ),
        };

        return UserAggregate.rehydrate(props); 
    }
    static toCreateInput(user: UserPrisma):Prisma.UserCreateInput{
        return {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            isActive: user.isActive,
            phone: user.phone,
        };
    }

    static toPersistence(userAggregate: UserAggregate): any {
        return {
            id: userAggregate.getId(),
            email: userAggregate.getEmail().toString(),
            password: userAggregate.getPassword().getHashed(),
            isActive: userAggregate.getIsActive(),
            phone: userAggregate.getPhone(),
            name: userAggregate.getName(),
            firstName: userAggregate.getFirstName(),
            lastName: userAggregate.getLastName(),
            createdAt: userAggregate.getCreatedAt(),
            updatedAt: userAggregate.getUpdatedAt(),
        };
    }

}
