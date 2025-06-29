import { CategoryAggregate } from "./aggregate/category.aggregate";

export interface ICategoryRepository {
    findById(id: string): Promise<CategoryAggregate | null>;
    save(category: CategoryAggregate): Promise<CategoryAggregate>;
    delete(id: string): Promise<CategoryAggregate>;
}