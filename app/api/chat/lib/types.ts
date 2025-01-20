export interface OrderItem {
  boxName: string;
  quantity: number;
}

export interface OrderRequest {
  items: OrderItem[];
  confirm?: boolean;
} 