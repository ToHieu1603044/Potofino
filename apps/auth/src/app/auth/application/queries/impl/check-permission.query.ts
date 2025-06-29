export class CheckPermissionQuery {
  constructor(
    public readonly userId: string,
    public readonly resource: string,
    public readonly action: string,
  ) {}
}