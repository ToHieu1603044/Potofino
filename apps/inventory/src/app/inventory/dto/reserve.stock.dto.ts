import { IsArray, ValidateNested, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReserveStockItemDto {
  @IsString()
  skuCode: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class ReserveStockDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReserveStockItemDto)
  items: ReserveStockItemDto[];
}
