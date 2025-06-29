import { AggregateRoot } from "@nestjs/cqrs";
import { CategoryEntity } from "../category.entity";

export interface CategoryProps {
    id: string;
    name: string;
    slug: string;
    image: string;
    active: boolean;
    parentId: string;
    deletedAt: string;
    children: CategoryEntity[]
}
export class CategoryAggregate extends AggregateRoot{
   private constructor(private readonly props: CategoryProps) {
    super();
   }
   static create(props: CategoryProps) {
    return new CategoryAggregate(props);
   }
   static redydrate(props: CategoryProps) {
    return new CategoryAggregate(props);
   }
   getId(): string {
    return this.props.id;
   }
   getName(): string {
    return this.props.name;
   }
   getSlug(): string {
    return this.props.slug;
   }
   getImage(): string {
    return this.props.image;
   }
   getActive(): boolean {
    return this.props.active;
   }
   getParentId(): string {
    return this.props.parentId;
   }
   getDeletedAt(): string {
    return this.props.deletedAt;
   }
   getChildren(): CategoryEntity[] {
    return this.props.children;
   }
   

}