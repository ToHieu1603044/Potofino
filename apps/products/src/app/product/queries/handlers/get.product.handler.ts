import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindProductByIdQuery } from '../get.product.query';
import { ProductRepository } from '../../repositories/product.repository'; 
@QueryHandler(FindProductByIdQuery)
export class GetProductHandler implements IQueryHandler<FindProductByIdQuery> {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(query: FindProductByIdQuery): Promise<any> {
    return this.productRepo.GetProduct({ id: query.id });
  }
}
