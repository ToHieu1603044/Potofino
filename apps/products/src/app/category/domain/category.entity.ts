export class CategoryEntity {
    id: string;
    name: string;
    slug: string;
    image: string;
    active: boolean;
    parentId: string;
    deletedAt: string;
    children: CategoryEntity[] = [];
}