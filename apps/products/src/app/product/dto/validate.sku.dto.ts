import {
  IsString,
  IsArray,
  ValidateNested,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';

class SkuItem {
  @IsDefined()
  @IsString()
  skuId: string;

  @IsDefined()
  @IsString()
  skuCode: string;

  @IsDefined()
  @IsString()
  productId: string;
}

export class ValidateSkuInputsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkuItem)
  items: SkuItem[];
}
