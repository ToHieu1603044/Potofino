import { AggregateRoot } from '@nestjs/cqrs';

export class PermissionEntity extends AggregateRoot {
  public readonly id: string;
  public name: string;
  public resource: string;
  public action: string;
  public displayName: string;
  public description?: string;
  public isActive: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  private constructor(props: {
    id: string;
    name: string;
    resource: string;
    action: string;
    displayName: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(); 
    Object.assign(this, props);
  }

  static create(
    id: string,
    name: string,
    resource: string,
    action: string,
    displayName: string,
    description?: string,
  ): PermissionEntity {
    return new PermissionEntity({
      id,
      name,
      resource,
      action,
      displayName,
      description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public update(
    name?: string,
    resource?: string,
    action?: string,
    displayName?: string,
    description?: string,
    isActive?: boolean,
  ): void {
    if (name) this.name = name;
    if (resource) this.resource = resource;
    if (action) this.action = action;
    if (displayName) this.displayName = displayName;
    if (description !== undefined) this.description = description;
    if (isActive !== undefined) this.isActive = isActive;
    this.updatedAt = new Date();
  }
}
