import { OrderItemForm } from "@/src/components/orders/OrderItemForm";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import type { CreateOrderItemRequest } from "@/src/features/orders/order.types";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

/**
 * Artículo temporal usado dentro del formulario de cliente.
 */
type DraftOrderItem = CreateOrderItemRequest & {
  localId: string;
};

/**
 * Cliente temporal usado dentro del formulario de pedido.
 */
type DraftCustomerOrder = {
  localId: string;
  customerOrderId?: number;
  name: string;
  phone: string;
  notes: string;
  items: DraftOrderItem[];
};

/**
 * Props del formulario reutilizable de cliente.
 */
type OrderCustomerFormProps = {
  customerOrder: DraftCustomerOrder;
  customerIndex: number;
  customersCount: number;
  customerTotal: number;

  /**
   * Total pagado por abonos.
   *
   * Para qué sirve:
   * - Ya no calculamos pagado por artículos marcados.
   * - Ahora usamos los abonos reales del cliente.
   *
   * Beneficio:
   * - El resumen del cliente coincide con la sección "Abonos de cliente".
   */
  customerPaidTotal: number;

  /**
   * Total pendiente después de abonos.
   */
  customerPendingTotal: number;

  itemInputClassName?: string;
  defaultExpanded?: boolean;
  expandedCustomerLocalId?: string | null;
  expandedItemLocalId?: string | null;

  onRemoveCustomer: (customerLocalId: string) => void;

  onUpdateCustomer: (
    customerLocalId: string,
    field: "name" | "phone" | "notes",
    value: string,
  ) => void;

  onAddItem: (customerLocalId: string) => void;

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
 * Formulario reutilizable de cliente dentro de un pedido.
 *
 * Importante:
 * - El resumen "Pagado" y "Pendiente" ahora viene desde el padre.
 * - El padre calcula usando customerOrder.payments.
 *
 * Beneficio:
 * - Ya no muestra $0 cuando el cliente sí tiene abonos.
 */
export function OrderCustomerForm({
  customerOrder,
  customerIndex,
  customersCount,
  customerTotal,
  customerPaidTotal,
  customerPendingTotal,
  itemInputClassName = "",
  defaultExpanded = true,
  expandedCustomerLocalId = null,
  expandedItemLocalId = null,
  onRemoveCustomer,
  onUpdateCustomer,
  onAddItem,
  onRemoveItem,
  onToggleItemPaid,
  onUpdateItem,
}: OrderCustomerFormProps) {
  const [isExpanded, setIsExpanded] = useState(
    expandedCustomerLocalId === customerOrder.localId || defaultExpanded,
  );

  useEffect(() => {
    if (expandedCustomerLocalId === customerOrder.localId) {
      setIsExpanded(true);
    }
  }, [expandedCustomerLocalId, customerOrder.localId]);

  return (
    <View className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-slate-950">
            Cliente #{customerIndex + 1}
          </Text>

          <Text className="mt-1 text-sm font-bold text-slate-700">
            {customerOrder.name.trim() || "Sin nombre"}
          </Text>

          <Text className="mt-1 text-sm font-bold text-emerald-700">
            Total cliente: ${customerTotal.toFixed(2)}
          </Text>

          <Text className="mt-1 text-sm font-bold text-emerald-700">
            Pagado: ${customerPaidTotal.toFixed(2)}
          </Text>

          <Text className="mt-1 text-sm font-bold text-orange-600">
            Pendiente: ${customerPendingTotal.toFixed(2)}
          </Text>

          <Text className="mt-1 text-sm text-slate-500">
            Artículos: {customerOrder.items.length}
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

      <Pressable
        className="mt-4 rounded-xl bg-slate-950 px-4 py-3 active:opacity-80"
        onPress={() => setIsExpanded((current) => !current)}
      >
        <Text className="text-center font-bold text-white">
          {isExpanded ? "Ocultar cliente" : "Editar cliente"}
        </Text>
      </Pressable>

      {isExpanded ? (
        <>
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
                defaultExpanded={
                  expandedItemLocalId === item.localId || itemIndex === 0
                }
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
        </>
      ) : null}
    </View>
  );
}
