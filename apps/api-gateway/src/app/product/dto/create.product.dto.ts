
export class CreateProductDto {
  name: string;
  description?: string;
  brandId?: string;
  categoryId?: string;
  skus: {
    skuCode: string;
    price: number;
    stock: number;
    image: string;
    attributes: {
      attributeName: string;
      attributeOptionId: string;
    }[];
  }[];
}
