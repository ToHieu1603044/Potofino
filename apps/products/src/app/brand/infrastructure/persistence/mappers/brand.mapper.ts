import { BrandAggregate } from "../../../domain/aggregates/brand.aggregate";

export class BrandMapper {
    static toDomain(raw: any): BrandAggregate{
        return BrandAggregate.rehydrate({
            id: raw.id,
            name: raw.name,
            isActive: raw.isActive,
            logo: raw.logo,
            description: raw.description,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt
        });
    }

    static toPersistence(brand: BrandAggregate): any {
        return {
            id: brand.getId(),
            name: brand.getName(),
            isActive: brand.getIsActive(),
            logo: brand.getLogo(),
            description: brand.getDescription(),
            createdAt: brand.getCreatedAt(),
            updatedAt: brand.getUpdatedAt()
        }
    }
}