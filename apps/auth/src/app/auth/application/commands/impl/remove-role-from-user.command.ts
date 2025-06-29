export class RemoveRoleFromUserCommand {
  constructor(public readonly userId: string, public readonly roleId: string) {}
}