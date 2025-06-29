export class UpdateRoleCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly displayName?: string,
    public readonly description?: string,
    public readonly isActive?: boolean,
  ) {}
}