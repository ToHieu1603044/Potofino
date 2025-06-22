export class OrderDto {
  userId: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  paymentMethod: 'cod' | 'momo';
  shippingFee: number;
  discount?: number;
  note?: string;
  items: {
    skuId: string;
    skuCode: string;
    quantity: number;
    price: number;
    productId: string;
    productName: string;
    productImage: string;
  }[];
}
