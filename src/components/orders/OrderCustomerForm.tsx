import { OrderItemForm } from "@/src/components/orders/OrderItemForm";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import type { CreateOrderItemRequest } from "@/src/features/orders/order.types";
import { Text, View } from "react-native";

/**
 * Artículo temporal usado dentro del formulario de cliente.
 *
 * Para qué sirve:
 * - Representa un artículo antes de guardarse en backend.
 *
 * Beneficio:
 * - El formulario puede reutilizarse tanto al crear como al editar pedidos.
 */
type DraftOrderItem = CreateOrderItemRequest & {
  localId: string;
};

/**
 * Cliente temporal usado dentro del formulario de pedido.
 *
 * Para qué sirve:
 * - Representa un cliente capturado dentro de un pedido.
 *
 * Beneficio:
 * - Podemos capturar clientes sin depender de una lista previa.
 */
type DraftCustomerOrder = {
  localId: string;
  name: string;
  phone: string;
  notes: string;
  items: DraftOrderItem[];
};

/**
 * Props del formulario reutilizable de cliente.
 *
 * Para qué sirve:
 * - Define qué información y acciones necesita este componente.
 *
 * Beneficio:
 * - La pantalla padre mantiene la lógica.
 * - Este componente solo se encarga de pintar la UI del cliente.
 */
type OrderCustomerFormProps = {
  /**
   * Cliente temporal que se está editando.
   */
  customerOrder: DraftCustomerOrder;

  /**
   * Posición visual del cliente.
   */
  customerIndex: number;

  /**
   * Total de clientes en el pedido.
   *
   * Para qué sirve:
   * - Solo mostramos "Quitar" si hay más de un cliente.
   */
  customersCount: number;

  /**
   * Total calculado de este cliente.
   */
  customerTotal: number;

  /**
   * Fondo extra para inputs de artículos.
   *
   * Para qué sirve:
   * - En algunas pantallas el artículo vive dentro de una card gris.
   * - Esto permite que los inputs se vean blancos si hace falta.
   */
  itemInputClassName?: string;

  /**
   * Función para quitar cliente.
   */
  onRemoveCustomer: (customerLocalId: string) => void;

  /**
   * Función para actualizar nombre, teléfono o notas del cliente.
   */
  onUpdateCustomer: (
    customerLocalId: string,
    field: "name" | "phone" | "notes",
    value: string,
  ) => void;

  /**
   * Función para agregar artículo a este cliente.
   */
  onAddItem: (customerLocalId: string) => void;

  /**
   * Función para quitar artículo.
   */
  onRemoveItem: (customerLocalId: string, itemLocalId: string) => void;

  /**
   * Función para cambiar Pagado/Pendiente de un artículo.
   */
  onToggleItemPaid: (customerLocalId: string, itemLocalId: string) => void;

  /**
   * Función para actualizar campos del artículo.
   */
  onUpdateItem: (
    customerLocalId: string,
    itemLocalId: string,
    field: keyof CreateOrderItemRequest,
    value: string,
  ) => void;
};

/**
 * Formulario reutilizable de cliente dentro de un pedido.
 *
 * Para qué sirve:
 * - Muestra datos del cliente.
 * - Muestra sus artículos.
 * - Permite agregar/quitar artículos.
 *
 * Beneficio:
 * - Evitamos repetir el bloque de cliente en:
 *   - Crear pedido
 *   - Editar pedido
 *
 * - Si después cambiamos diseño del cliente, solo tocamos este archivo.
 */
export function OrderCustomerForm({
  customerOrder,
  customerIndex,
  customersCount,
  customerTotal,
  itemInputClassName = "",
  onRemoveCustomer,
  onUpdateCustomer,
  onAddItem,
  onRemoveItem,
  onToggleItemPaid,
  onUpdateItem,
}: OrderCustomerFormProps) {
  return (
    <View className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-slate-950">
            Cliente #{customerIndex + 1}
          </Text>

          <Text className="mt-1 text-sm font-bold text-emerald-700">
            Total cliente: ${customerTotal.toFixed(2)}
          </Text>
        </View>

        {customersCount > 1 ? (
          <AppButton
            title="Quitar"
            variant="danger"
            className="px-3 py-2"
            textClassName="text-xs"
            onPress={() => onRemoveCustomer(customerOrder.localId)}
          />
        ) : null}
      </View>

      <AppInput
        className="mt-4"
        inputClassName="bg-white"
        placeholder="Nombre del cliente"
        value={customerOrder.name}
        onChangeText={(value) =>
          onUpdateCustomer(customerOrder.localId, "name", value)
        }
      />

      <AppInput
        className="mt-3"
        inputClassName="bg-white"
        placeholder="Teléfono del cliente"
        keyboardType="phone-pad"
        value={customerOrder.phone}
        onChangeText={(value) =>
          onUpdateCustomer(customerOrder.localId, "phone", value)
        }
      />

      <AppInput
        className="mt-3"
        inputClassName="bg-white"
        placeholder="Notas del cliente"
        value={customerOrder.notes}
        onChangeText={(value) =>
          onUpdateCustomer(customerOrder.localId, "notes", value)
        }
        multiline
      />

      <Text className="mt-5 text-base font-extrabold text-slate-950">
        Artículos
      </Text>

      <View className="mt-3 gap-3">
        {customerOrder.items.map((item, itemIndex) => (
          <OrderItemForm
            key={item.localId}
            customerLocalId={customerOrder.localId}
            item={item}
            itemIndex={itemIndex}
            itemsCount={customerOrder.items.length}
            inputClassName={itemInputClassName}
            onRemoveItem={onRemoveItem}
            onToggleItemPaid={onToggleItemPaid}
            onUpdateItem={onUpdateItem}
          />
        ))}
      </View>

      <AppButton
        title="+ Agregar artículo"
        variant="secondary"
        className="mt-4"
        onPress={() => onAddItem(customerOrder.localId)}
      />
    </View>
  );
}
