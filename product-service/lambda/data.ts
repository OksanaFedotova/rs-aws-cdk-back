export interface IProduct {
  description: string;
  id: string;
  price: number;
  title: string;
}
export const products: IProduct[] = [
  {
    description: "Travel to the sea",
    id: "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
    price: 24,
    title: "Travel 1",
  },
  {
    description: "Travel to the mountains",
    id: "7567ec4b-b10c-48c5-9345-fc73c48a80a1",
    price: 15,
    title: "Travel 2",
  },
  {
    description: "Travel to the moon",
    id: "7567ec4b-b10c-48c5-9345-fc73c48a80a3",
    price: 23,
    title: "Travel 3",
  },
];
