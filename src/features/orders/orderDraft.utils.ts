import type { CreateOrderCustomerRequest } from "@/src/features/orders/order.types";
import type {
  DraftCustomerOrder,
  DraftOrderItem,
} from "@/src/features/orders/orderDraft.types";

/**
 * Resultado de validación del pedido temporal.
 *
 * Para qué sirve:
 * - Nos dice si el pedido es válido.
 * - Si no es válido, devuelve título y mensaje para mostrar en Alert.
 *
 * Beneficio:
 * - Las pantallas no tienen que repetir toda la lógica de validación.
 */
export type DraftOrderValidationResult =
  | {
      isValid: true;
    }
  | {
      isValid: false;
      title: string;
      message: string;
    };

/**
 * Genera IDs locales para listas temporales.
 *
 * Para qué sirve:
 * - React necesita una key estable cuando renderizamos clientes y artículos.
 *
 * Beneficio:
 * - Evita errores visuales al agregar o quitar elementos.
 */
export function createLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Convierte texto a número seguro.
 *
 * Para qué sirve:
 * - Los inputs trabajan con string.
 * - El backend necesita números para quantity y unitPrice.
 *
 * Beneficio:
 * - Evita mandar NaN al backend.
 */
export function parseNumber(value: string) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

/**
 * Crea un artículo vacío para formularios.
 *
 * Para qué sirve:
 * - Inicializa un artículo nuevo cuando el usuario agrega producto.
 *
 * Beneficio:
 * - Todo artículo empieza con valores controlados.
 * - Por default inicia como pendiente de pago.
 */
export function createEmptyItem(): DraftOrderItem {
  return {
    localId: createLocalId(),
    sku: "",
    name: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    isPaid: false,
  };
}

/**
 * Crea un cliente vacío con un artículo inicial.
 *
 * Para qué sirve:
 * - Inicializa el formulario con cliente + artículo.
 *
 * Beneficio:
 * - El usuario puede empezar a capturar sin presionar botones extra.
 */
export function createEmptyCustomerOrder(): DraftCustomerOrder {
  return {
    localId: createLocalId(),
    name: "",
    phone: "",
    notes: "",
    items: [createEmptyItem()],
  };
}

/**
 * Valida un pedido temporal antes de enviarlo al backend.
 *
 * Para qué sirve:
 * - Revisa que el pedido tenga clientes.
 * - Revisa que cada cliente tenga nombre.
 * - Revisa que cada cliente tenga artículos.
 * - Revisa SKU, nombre, cantidad y precio.
 *
 * Beneficio:
 * - Crear pedido y editar pedido usan la misma validación.
 * - Si cambiamos una regla, solo la cambiamos aquí.
 */
export function validateDraftOrder(
  draftCustomers: DraftCustomerOrder[],
): DraftOrderValidationResult {
  if (!draftCustomers.length) {
    return {
      isValid: false,
      title: "Agrega clientes",
      message: "El pedido debe tener al menos un cliente.",
    };
  }

  for (const customerOrder of draftCustomers) {
    if (!customerOrder.name.trim()) {
      return {
        isValid: false,
        title: "Nombre requerido",
        message: "Cada cliente debe tener un nombre.",
      };
    }

    if (!customerOrder.items.length) {
      return {
        isValid: false,
        title: "Faltan artículos",
        message: `Agrega al menos un artículo para ${customerOrder.name}.`,
      };
    }

    for (const item of customerOrder.items) {
      if (!item.sku.trim()) {
        return {
          isValid: false,
          title: "SKU requerido",
          message: "Todos los artículos necesitan SKU.",
        };
      }

      if (!item.name.trim()) {
        return {
          isValid: false,
          title: "Nombre requerido",
          message: "Todos los artículos necesitan nombre.",
        };
      }

      if (item.quantity <= 0) {
        return {
          isValid: false,
          title: "Cantidad inválida",
          message: "La cantidad debe ser mayor a cero.",
        };
      }

      if (item.unitPrice <= 0) {
        return {
          isValid: false,
          title: "Precio inválido",
          message: "El precio unitario debe ser mayor a cero.",
        };
      }
    }
  }

  return {
    isValid: true,
  };
}

/**
 * Convierte clientes temporales del formulario al payload que espera el backend.
 *
 * Para qué sirve:
 * - Toma los datos editables de la pantalla.
 * - Limpia espacios vacíos.
 * - Convierte campos vacíos a null cuando corresponde.
 * - Conserva isPaid por artículo.
 *
 * Beneficio:
 * - Crear pedido y editar pedido usan el mismo armado de payload.
 * - Evitamos duplicar el mismo map en varias pantallas.
 * - Si cambia la estructura que espera el backend, se modifica aquí.
 */
export function buildOrderCustomersPayload(
  draftCustomers: DraftCustomerOrder[],
): CreateOrderCustomerRequest[] {
  return draftCustomers.map((customerOrder) => ({
    name: customerOrder.name.trim(),
    phone: customerOrder.phone.trim() || null,
    notes: customerOrder.notes.trim() || null,
    items: customerOrder.items.map((item) => ({
      sku: item.sku.trim(),
      name: item.name.trim(),
      description: item.description?.trim() || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,

      /**
       * Conservamos el pago individual del artículo.
       *
       * Para qué sirve:
       * - El backend sabe si este artículo ya está pagado.
       *
       * Beneficio:
       * - No se pierde el estado Pagado/Pendiente al crear o editar.
       */
      isPaid: item.isPaid ?? false,
    })),
  }));
}
