import { ValidateSkuInputsDto } from "../dto/validate.sku.dto";

export class ValidateSkuInputsQuery {
  constructor(public readonly items: ValidateSkuInputsDto) {}
}

