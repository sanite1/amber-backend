export interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
  date: string;
  student: {
    fullName: string;
    address: string;
    phone: string;
    email: string;
  };
}
