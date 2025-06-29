import { Injectable } from "@nestjs/common";
import { IBrandRepository } from "../../../domain/repositories/brand.repository.interface";
import { PrismaService } from "../../../../shared/prisma/prisma.service";
import { BrandAggregate } from "../../../domain/aggregates/brand.aggregate";
import { BrandMapper } from "../mappers/brand.mapper";

@Injectable()

export class BrandPrismaRepository implements IBrandRepository{
    constructor(
        private readonly prisma: PrismaService
    ){}

    async findById(id: string): Promise<BrandAggregate | null> {
        const data = await this.prisma.brand.findUnique(
            {
                where:{
                    id
                }
            }
        )
        return data ? BrandMapper.toDomain(data) : null;
    }

    async save(brand: BrandAggregate): Promise<BrandAggregate> {
        const data = BrandMapper.toPersistence(brand);

        await this.prisma.brand.upsert({
            where: {id: brand.getId()},
            update: data,
            create: data
        });

        const updated = await this.prisma.brand.findFirstOrThrow({
            where:{id: brand.getId()}
        });

        return BrandMapper.toDomain(updated);
    }
    async delete(id: string): Promise<BrandAggregate> {
        const data = await this.prisma.brand.delete({
            where: {
                id
            }
        });
        return BrandMapper.toDomain(data);
    }
}