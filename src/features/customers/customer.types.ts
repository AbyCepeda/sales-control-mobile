/**
 * Cliente recibido desde el backend.
 *
 * Debe coincidir con el modelo Customer del backend.
 */
export type Customer = {
  id: number;
  name: string;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Body para crear cliente.
 *
 * Beneficio:
 * - Permite registrar clientes desde el móvil.
 * - Luego esos clientes se pueden usar para crear pedidos.
 */
export type CreateCustomerRequest = {
  name: string;
  phone?: string | null;
  notes?: string | null;
};

/**
 * Body para actualizar cliente.
 *
 * Beneficio:
 * - Permite editar datos del cliente sin borrar su historial.
 */
export type UpdateCustomerRequest = {
  name?: string;
  phone?: string | null;
  notes?: string | null;
  isActive?: boolean;
};
