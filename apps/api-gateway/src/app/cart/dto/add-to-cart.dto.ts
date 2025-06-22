import { IsString, IsInt, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  skuId: string; 

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(0)
  price: number;
}
