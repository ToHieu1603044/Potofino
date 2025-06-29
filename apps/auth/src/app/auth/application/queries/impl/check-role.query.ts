export class CheckRoleQuery {
  constructor(
    public readonly userId: string,
    public readonly roleNames: string[],
    public readonly requireAll: boolean,
  ) {}
}