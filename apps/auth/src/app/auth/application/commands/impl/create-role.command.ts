export class CreateRoleCommand {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description?: string,
    public readonly isActive?: boolean,
    public readonly isSystem?: boolean,
  ) {}
}