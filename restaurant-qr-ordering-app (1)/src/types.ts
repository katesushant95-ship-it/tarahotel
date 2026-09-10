export type Language = 'en' | 'mr' | 'hi';

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'completed';

export interface Category {
  id: string;
  name: string;
  labelMr: string;
  labelHi: string;
}

export interface RestaurantOwner {
  uid: string;
  email: string;
  restaurantName: string;
  logoUrl?: string;
  language: Language;
  categories?: Category[];
  customBaseUrl?: string;
}

export interface MenuItem {
  id: string;
  ownerId: string;
  name: string;
  price: number;
  category: 'Starters' | 'Veg Soup' | 'Punjabi Dish' | 'Gavran Tadka' | 'Dal Special' | 'Rice / Extras' | 'Thali Special' | 'Main Course' | 'Drinks' | 'Desserts' | string;
  description: string;
  imageUrl: string;
  inStock: boolean;
  createdAt?: any;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Order {
  id: string;
  ownerId: string;
  tableNumber: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: any;
  updatedAt?: any;
}

export interface QRCodeData {
  id: string;
  ownerId: string;
  tableNumber: string;
  url: string;
  createdAt: any;
}
