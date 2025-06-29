export class CreatePermissionCommand {
  constructor(
    public readonly name: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly displayName: string,
    public readonly description?: string,
    public readonly isActive?: boolean,
  ) {}
}