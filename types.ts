export interface PosMenuOption {
  groupName: string;
  name: string;
  priceModifier: number;
}

export interface PosMenuItem {
  id: string | number;
  name: string;
  price: number;
  options: PosMenuOption[];
}

export interface MappedLineItem {
  originalName: string;
  quantity: number;
  originalPrice: number;
  selectedPosItem: PosMenuItem | null;
  selectedOption?: PosMenuOption | null;
  finalPrice?: number; // Price after option modifier
  matchConfidence?: number;
}

export interface ReceiptData {
  orderId?: string | null;
  items: MappedLineItem[];
  subtotal: number | null;
  deliveryFee: number | null;
  discount: number | null;
  total: number;
}