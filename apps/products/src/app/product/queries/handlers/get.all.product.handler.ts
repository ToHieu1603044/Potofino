import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { FindProductAllQuery } from "../get.all.product.query";
import { ProductRepository } from "../../repositories/product.repository";
@QueryHandler(FindProductAllQuery)
export class GetProductAllHandler implements IQueryHandler<FindProductAllQuery> {
  constructor(private readonly productRepo: ProductRepository) {}

 async execute(query: FindProductAllQuery) {
    const { page = 1, limit =  10, ...filter } = query.params;

    const where: any = {};
    if (filter.keyword) {
      where.name = { contains: filter.keyword, mode: 'insensitive' };
    }
    if (filter.brandId) where.brandId = filter.brandId;
    if (filter.categoryId) where.categoryId = filter.categoryId;

    const orderBy = filter.sort === 'asc' || filter.sort === 'desc'
      ? { createdAt: filter.sort }
      : { createdAt: 'desc' };

    return this.productRepo.findAll(where, orderBy, page, limit);
  }

}


