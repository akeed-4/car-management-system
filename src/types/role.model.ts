export interface Role {
  id: number;
  name: string;
  permissions: { [key: string]: boolean };
}
