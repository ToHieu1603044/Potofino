import { BrandAggregate } from "../aggregates/brand.aggregate";

export interface IBrandRepository {
    findById(id: string): Promise<BrandAggregate | null>;
    save(brand: BrandAggregate): Promise<BrandAggregate>;
    delete(id: string): Promise<BrandAggregate>;
}   