import { CartItem } from './cart-item.interface';

export interface Cart {
  userId: string;
  items: CartItem[];
}
