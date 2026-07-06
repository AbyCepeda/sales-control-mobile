import { OrderItemForm } from "@/src/components/orders/OrderItemForm";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import type { CreateOrderItemRequest } from "@/src/features/orders/order.types";
import { getOrderPaymentSummary } from "@/src/features/orders/orderPayment.utils";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

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
  customerOrder: DraftCustomerOrder;
  customerIndex: number;
  customersCount: number;
  customerTotal: number;
  itemInputClassName?: string;

  /**
   * Controla si el cliente inicia abierto o cerrado.
   *
   * Para qué sirve:
   * - En formularios grandes podemos iniciar cerrado.
   *
   * Beneficio:
   * - Si el pedido tiene muchos clientes/artículos, no saturamos la pantalla.
   */
  defaultExpanded?: boolean;

  /**
   * ID local del cliente que debe iniciar abierto.
   *
   * Para qué sirve:
   * - Cuando agregamos un cliente nuevo, podemos abrirlo automáticamente.
   *
   * Beneficio:
   * - El usuario no tiene que buscarlo ni presionar "Editar cliente".
   */
  expandedCustomerLocalId?: string | null;

  /**
   * ID local del artículo que debe iniciar abierto.
   *
   * Para qué sirve:
   * - Cuando agregamos un artículo nuevo, podemos abrirlo automáticamente.
   *
   * Beneficio:
   * - El usuario no tiene que presionar "Editar artículo" después de agregarlo.
   */
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
 * Para qué sirve:
 * - Muestra datos del cliente.
 * - Muestra resumen de pago.
 * - Permite abrir/cerrar sus campos y artículos.
 * - Permite agregar/quitar artículos.
 *
 * Beneficio:
 * - Crear y editar pedido quedan más limpios.
 * - Si hay muchos artículos, el usuario puede cerrar clientes que no está editando.
 */
export function OrderCustomerForm({
  customerOrder,
  customerIndex,
  customersCount,
  customerTotal,
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

  /**
   * Abre automáticamente el cliente cuando su localId coincide
   * con el último cliente agregado.
   *
   * Para qué sirve:
   * - Si agregamos un cliente nuevo, lo mostramos abierto.
   *
   * Beneficio:
   * - El usuario puede capturarlo inmediatamente.
   */
  useEffect(() => {
    if (expandedCustomerLocalId === customerOrder.localId) {
      setIsExpanded(true);
    }
  }, [expandedCustomerLocalId, customerOrder.localId]);

  const paymentSummary = getOrderPaymentSummary(
    customerOrder.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      isPaid: item.isPaid,
    })),
  );

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
            Pagado: ${paymentSummary.paidTotal.toFixed(2)}
          </Text>

          <Text className="mt-1 text-sm font-bold text-orange-600">
            Pendiente: ${paymentSummary.pendingTotal.toFixed(2)}
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
