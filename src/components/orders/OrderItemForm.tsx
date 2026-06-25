import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import type { CreateOrderItemRequest } from "@/src/features/orders/order.types";
import { Text, View } from "react-native";

/**
 * Artículo temporal usado por los formularios de pedido.
 *
 * Para qué sirve:
 * - Representa un artículo antes de guardarlo en backend.
 *
 * Beneficio:
 * - Podemos reutilizar este mismo componente en crear pedido y editar pedido.
 */
type DraftOrderItem = CreateOrderItemRequest & {
  localId: string;
};

/**
 * Props del formulario de artículo.
 *
 * Para qué sirve:
 * - Define qué datos y acciones necesita el componente.
 *
 * Beneficio:
 * - El componente no maneja estado propio.
 * - La pantalla padre sigue controlando la lógica.
 */
type OrderItemFormProps = {
  /**
   * ID local del cliente al que pertenece este artículo.
   */
  customerLocalId: string;

  /**
   * Artículo que se está editando.
   */
  item: DraftOrderItem;

  /**
   * Posición visual del artículo.
   */
  itemIndex: number;

  /**
   * Total de artículos del cliente.
   *
   * Para qué sirve:
   * - Solo mostramos botón "Quitar" si hay más de un artículo.
   */
  itemsCount: number;

  /**
   * Fondo de los inputs.
   *
   * Para qué sirve:
   * - En crear pedido usamos el fondo normal.
   * - En editar pedido podemos usar bg-white dentro de cards grises.
   */
  inputClassName?: string;

  /**
   * Función para quitar artículo.
   */
  onRemoveItem: (customerLocalId: string, itemLocalId: string) => void;

  /**
   * Función para cambiar Pagado/Pendiente.
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
 * Formulario reutilizable de artículo.
 *
 * Para qué sirve:
 * - Muestra los campos de un artículo:
 *   SKU, nombre, descripción, cantidad, precio y estado de pago.
 *
 * Beneficio:
 * - Evitamos duplicar este bloque en crear pedido y editar pedido.
 * - Si después cambiamos el diseño de artículos, se modifica aquí.
 */
export function OrderItemForm({
  customerLocalId,
  item,
  itemIndex,
  itemsCount,
  inputClassName = "",
  onRemoveItem,
  onToggleItemPaid,
  onUpdateItem,
}: OrderItemFormProps) {
  return (
    <View className="rounded-xl bg-white p-4">
      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-extrabold text-slate-950">
            Artículo #{itemIndex + 1}
          </Text>

          {itemsCount > 1 ? (
            <AppButton
              title="Quitar"
              variant="danger"
              className="px-3 py-2"
              textClassName="text-xs"
              onPress={() => onRemoveItem(customerLocalId, item.localId)}
            />
          ) : null}
        </View>

        <AppButton
          title={item.isPaid ? "Pagado" : "Pendiente de pago"}
          variant={item.isPaid ? "success" : "outline"}
          className="self-start px-3 py-2"
          textClassName="text-xs"
          onPress={() => onToggleItemPaid(customerLocalId, item.localId)}
        />
      </View>

      <AppInput
        className="mt-3"
        inputClassName={inputClassName}
        placeholder="SKU / Código"
        value={item.sku}
        onChangeText={(value) =>
          onUpdateItem(customerLocalId, item.localId, "sku", value)
        }
      />

      <AppInput
        className="mt-3"
        inputClassName={inputClassName}
        placeholder="Nombre del artículo"
        value={item.name}
        onChangeText={(value) =>
          onUpdateItem(customerLocalId, item.localId, "name", value)
        }
      />

      <AppInput
        className="mt-3"
        inputClassName={inputClassName}
        placeholder="Descripción"
        value={item.description ?? ""}
        onChangeText={(value) =>
          onUpdateItem(customerLocalId, item.localId, "description", value)
        }
      />

      <View className="mt-3 flex-row gap-3">
        <AppInput
          className="flex-1"
          inputClassName={inputClassName}
          label="Cantidad"
          placeholder="Ej. 1"
          keyboardType="numeric"
          value={String(item.quantity)}
          onChangeText={(value) =>
            onUpdateItem(customerLocalId, item.localId, "quantity", value)
          }
        />

        <AppInput
          className="flex-1"
          inputClassName={inputClassName}
          label="Precio"
          placeholder="Ej. 250"
          keyboardType="numeric"
          value={String(item.unitPrice)}
          onChangeText={(value) =>
            onUpdateItem(customerLocalId, item.localId, "unitPrice", value)
          }
        />
      </View>

      <Text className="mt-3 text-right text-sm font-bold text-slate-700">
        Subtotal: ${(item.quantity * item.unitPrice).toFixed(2)}
      </Text>
    </View>
  );
}
