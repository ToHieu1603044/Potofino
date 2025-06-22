import { IsOptional } from "class-validator";
import { PaginateDto } from "./paginate.dto";

export class GetProductsDto extends PaginateDto {
  @IsOptional()
  keyword?: string;

  @IsOptional()
  brandId?: string;

  @IsOptional()
  categoryId?: string;

  @IsOptional()
  sort?: string;
}
