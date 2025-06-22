
export class ProductEntity {
  id?: string;
  name: string;
  description?: string;
  brandId?: string;
  categoryId?: string;
  skus?: SkuEntity[];
}

export class SkuEntity {
  id?: string;
  productId?: string;
  skuCode: string;
  price: number;
  stock: number;
  attributes: {
    attributeOptionId: string;
  }[];
}
