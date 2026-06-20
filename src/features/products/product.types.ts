/**
 * Producto recibido desde el backend.
 *
 * Debe coincidir con el modelo Product de Prisma.
 */
export type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Body para crear producto.
 *
 * Lo usaremos más adelante con POST /api/products.
 */
export type CreateProductRequest = {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
};

/**
 * Body para actualizar producto.
 *
 * Lo usaremos más adelante con PUT /api/products/:id.
 */
export type UpdateProductRequest = {
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  isActive?: boolean;
};
