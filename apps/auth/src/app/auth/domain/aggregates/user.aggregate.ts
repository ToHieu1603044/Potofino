import { AggregateRoot } from '@nestjs/cqrs';
import { UserRoleEntity } from '../entities/user-role.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { RoleAssignedToUserEvent } from '../events/role-assigned-to-user.event';
import { RoleRemovedFromUserEvent } from '../events/role-removed-from-user.event';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { ConflictException } from '../exceptions/conflict.exception';
import { NotFoundException } from '../exceptions/not-found.exception';

export interface UserProps {
  id: string;
  email: Email; 
  password: Password; 
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userRoles: UserRoleEntity[];
  refreshTokens: RefreshTokenEntity[];
}

export class UserAggregate extends AggregateRoot {
  private constructor(private props: UserProps) {
    super();
  }

  static async create({id,email,name,passwordPlain,firstName,lastName,phone}: {
    id: string;
    email: string;
    name: string;
    phone: string;
    passwordPlain: string;
    firstName: string;
    lastName: string;
  }): Promise<UserAggregate> {
    const hashedPassword = await Password.create(passwordPlain);
    const user = new UserAggregate({
      id,
      email: Email.create(email),
      password: hashedPassword,
      firstName,
      lastName,
      name,
      phone,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      userRoles: [],
      refreshTokens: [],
    });

    user.apply(new UserRegisteredEvent(user.props.id, user.props.email.value, user.props.name, user.props.firstName, user.props.lastName, user.props.phone));
    return user;
  }

  static rehydrate(props: UserProps): UserAggregate {
    return new UserAggregate(props);
  }

  getId(): string {
    return this.props.id;
  }

  getEmail(): string {
    return this.props.email.value;
  }

  getFirstName(): string {
    return this.props.firstName;
  }

  getLastName(): string {
    return this.props.lastName;
  }

  getIsActive(): boolean {
    return this.props.isActive;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  getUserRoles(): UserRoleEntity[] {
    return [...this.props.userRoles];
  }

  getRefreshTokens(): RefreshTokenEntity[] {
    return [...this.props.refreshTokens];
  }
  getPassword(): Password {
    return this.props.password;
  }
  getPhone(): string {
    return this.props.phone;
  }
  getName(): string {
    return this.props.name;
  }

  /**
   * Validates a plain password against the stored hashed password.
   * @param passwordPlain The plain text password to validate.
   * @returns True if the password matches, false otherwise.
   */
  async validatePassword(passwordPlain: string): Promise<boolean> {
    return this.props.password.compare(passwordPlain);
  }

 async updateDetails(
    name: string,
    phone: string,
    email: string,
    passwordPlain: string,
    firstName?: string,
    lastName?: string,
    isActive?: boolean,
  ): Promise<void> {
    if (firstName !== undefined) {
      this.props.firstName = firstName;
    }
    if (lastName !== undefined) {
      this.props.lastName = lastName;
    }
    if (isActive !== undefined) {
      this.props.isActive = isActive;
    }
    if (name !== undefined) {
      this.props.name = name;
    }
    if (phone !== undefined) {
      this.props.phone = phone;
    }
    if (email !== undefined) {
      this.props.email = Email.create(email);
    }
    if (passwordPlain !== undefined) {
      this.props.password = await Password.create(passwordPlain);
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Changes the user's password.
   * @param newPasswordPlain The new plain text password.
   */
  async changePassword(newPasswordPlain: string): Promise<void> {
    this.props.password = await Password.create(newPasswordPlain); // Hash and set new password
    this.props.updatedAt = new Date();
    // Consider adding a UserPasswordChangedEvent
  }

  /**
   * Assigns a role to the user.
   * Throws ConflictException if role is already assigned and active.
   * @param roleId ID of the role to assign.
   * @param assignedBy Optional: ID of the user performing the assignment.
   * @param expiresAt Optional: Date when the role assignment expires.
   */
  assignRole(roleId: string, assignedBy?: string, expiresAt?: Date): void {
    const existingRole = this.props.userRoles.find(
      (ur) => ur.roleId === roleId && !ur.isExpired(),
    );
    if (existingRole) {
      throw new ConflictException(
        `User already has active role with ID ${roleId}.`,
      );
    }

    const newUserRole = UserRoleEntity.create(
      this.props.id,
      roleId,
      assignedBy,
      expiresAt,
    );
    this.props.userRoles.push(newUserRole);
    this.apply(
      new RoleAssignedToUserEvent(
        this.props.id,
        roleId,
        assignedBy,
        expiresAt,
      ),
    );
  }

  /**
   * Removes a role from the user.
   * Throws NotFoundException if the role is not found or already inactive.
   * @param roleId ID of the role to remove.
   * @param removedBy Optional: ID of the user performing the removal.
   */
  removeRole(roleId: string, removedBy?: string): void {
    const initialLength = this.props.userRoles.length;
    // Keep only roles that are not the one to be removed, or are expired
    this.props.userRoles = this.props.userRoles.filter(
      (ur) => ur.roleId !== roleId || ur.isExpired(),
    );

    if (this.props.userRoles.length === initialLength) {
      throw new NotFoundException(`Role with ID ${roleId} not found for user.`);
    }
    this.apply(new RoleRemovedFromUserEvent(this.props.id, roleId, removedBy));
  }

  /**
   * Adds a new refresh token for the user.
   * @param token The refresh token string.
   * @param expiresAt The expiration date of the token.
   */
  addRefreshToken(token: string, expiresAt: Date): void {
    const newToken = RefreshTokenEntity.create(token, this.props.id, expiresAt);
    this.props.refreshTokens.push(newToken);
  }

  /**
   * Removes a specific refresh token from the user's list.
   * @param token The refresh token string to remove.
   * @returns True if the token was found and removed, false otherwise.
   */
  removeRefreshToken(token: string): boolean {
    const initialLength = this.props.refreshTokens.length;
    this.props.refreshTokens = this.props.refreshTokens.filter(
      (rt) => rt.token !== token,
    );
    return this.props.refreshTokens.length < initialLength;
  }

  cleanExpiredRefreshTokens(): void {
    this.props.refreshTokens = this.props.refreshTokens.filter(
      (rt) => !rt.isExpired(),
    );
  }

  /**
   * Checks if the user has a specific role.
   * @param roleId The ID of the role to check.
   * @returns True if the user has the role, false otherwise.
   */
  hasRole(roleId: string): boolean {
    return this.props.userRoles.some(
      (ur) => ur.roleId === roleId && !ur.isExpired(),
    );
  }
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
    this.props.refreshTokens = [];
  }

  reactivate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }
}