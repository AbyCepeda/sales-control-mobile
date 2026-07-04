import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import type { CreateOrderItemRequest } from "@/src/features/orders/order.types";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

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
 * - El componente no maneja la lógica del pedido completo.
 * - La pantalla padre sigue controlando el estado.
 */
type OrderItemFormProps = {
  customerLocalId: string;
  item: DraftOrderItem;
  itemIndex: number;
  itemsCount: number;
  inputClassName?: string;

  /**
   * Controla si el artículo inicia abierto o cerrado.
   *
   * Para qué sirve:
   * - En clientes con muchos artículos podemos iniciar cerrados.
   *
   * Beneficio:
   * - Evitamos mostrar 100 formularios completos al mismo tiempo.
   */
  defaultExpanded?: boolean;

  onRemoveItem: (customerLocalId: string, itemLocalId: string) => void;
  onToggleItemPaid: (customerLocalId: string, itemLocalId: string) => void;
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
 * - Muestra primero un resumen compacto del artículo.
 * - Permite abrir/cerrar los campos de edición.
 * - Permite cambiar SKU, nombre, descripción, cantidad, precio y estado de pago.
 *
 * Beneficio:
 * - Si un cliente tiene muchos artículos, la pantalla no se vuelve enorme.
 * - Solo abres el artículo que necesitas editar.
 */
export function OrderItemForm({
  customerLocalId,
  item,
  itemIndex,
  itemsCount,
  inputClassName = "",
  defaultExpanded = false,
  onRemoveItem,
  onToggleItemPaid,
  onUpdateItem,
}: OrderItemFormProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const subtotal = item.quantity * item.unitPrice;

  return (
    <View className="rounded-xl bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-extrabold text-slate-950">
            Artículo #{itemIndex + 1}
          </Text>

          <Text className="mt-1 text-sm font-bold text-slate-700">
            {item.name.trim() || "Sin nombre"}
          </Text>

          <Text className="mt-1 text-xs text-slate-500">
            SKU: {item.sku.trim() || "Sin SKU"}
          </Text>

          <Text className="mt-1 text-xs text-slate-500">
            Cantidad: {item.quantity} | Precio: ${item.unitPrice.toFixed(2)}
          </Text>

          <Text className="mt-1 text-sm font-bold text-slate-700">
            Subtotal: ${subtotal.toFixed(2)}
          </Text>

          <Text
            className={`mt-1 text-sm font-bold ${
              item.isPaid ? "text-emerald-700" : "text-orange-600"
            }`}
          >
            {item.isPaid ? "Pagado" : "Pendiente de pago"}
          </Text>
        </View>

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

      <Pressable
        className="mt-4 rounded-xl bg-slate-950 px-4 py-3 active:opacity-80"
        onPress={() => setIsExpanded((current) => !current)}
      >
        <Text className="text-center font-bold text-white">
          {isExpanded ? "Ocultar artículo" : "Editar artículo"}
        </Text>
      </Pressable>

      {isExpanded ? (
        <View className="mt-4">
          <AppButton
            title={item.isPaid ? "Pagado" : "Pendiente de pago"}
            variant={item.isPaid ? "success" : "outline"}
            className="self-start px-3 py-2"
            textClassName="text-xs"
            onPress={() => onToggleItemPaid(customerLocalId, item.localId)}
          />

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
            Subtotal: ${subtotal.toFixed(2)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
