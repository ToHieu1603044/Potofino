export interface AddToCartDto {
  userId: string;
  skuId: string;
  quantity: number;
  price: number;
  itemDetail: Record<string, any>; 
}
