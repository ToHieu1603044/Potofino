import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { ValidateSkuInputsQuery } from "../check.sku.input.query";
import { ProductRepository } from "../../repositories/product.repository";


@QueryHandler(ValidateSkuInputsQuery)
export class ValidateSkuInputsHandler implements IQueryHandler<ValidateSkuInputsQuery> {
  constructor(private readonly repo: ProductRepository) {}

  async execute(query: ValidateSkuInputsQuery) {
    return this.repo.validateSkuInputs(query.items); 
  }
}

