export class AssignRoleToUserCommand {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly assignedBy?: string,
    public readonly expiresAt?: string,
  ) {}
}