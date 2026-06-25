import type { OrderStatus } from "@/src/features/orders/order.types";
import { Pressable, Text, View } from "react-native";

/**
 * Opción disponible para cambiar el estado de un pedido.
 *
 * Para qué sirve:
 * - Centraliza los estados que puede tener un pedido.
 *
 * Beneficio:
 * - Si después agregamos otro estado, solo se modifica aquí.
 */
const orderStatusOptions: {
  label: string;
  value: OrderStatus;
}[] = [
  {
    label: "Pendiente",
    value: "PENDING",
  },
  {
    label: "Pagado",
    value: "PAID",
  },
  {
    label: "Entregado",
    value: "DELIVERED",
  },
  {
    label: "Cancelado",
    value: "CANCELLED",
  },
];

/**
 * Props del selector de estado.
 */
type OrderStatusSelectorProps = {
  /**
   * Estado actual del pedido.
   */
  value: OrderStatus;

  /**
   * Función que se ejecuta cuando el usuario selecciona otro estado.
   */
  onChange: (status: OrderStatus) => void;

  /**
   * Texto opcional arriba del selector.
   */
  label?: string;

  /**
   * Sirve para bloquear el selector mientras se guarda.
   */
  disabled?: boolean;

  /**
   * Clases extra para el contenedor.
   */
  className?: string;
};

/**
 * Selector reutilizable de estado de pedido.
 *
 * Para qué sirve:
 * - Muestra botones para cambiar entre Pendiente, Pagado, Entregado y Cancelado.
 *
 * Beneficio:
 * - Evita repetir esta lógica en varias pantallas.
 * - Mantiene el mismo diseño en lista de pedidos y detalle de pedido.
 */
export function OrderStatusSelector({
  value,
  onChange,
  label = "Estado del pedido",
  disabled = false,
  className = "",
}: OrderStatusSelectorProps) {
  return (
    <View className={className}>
      <Text className="font-extrabold text-slate-950">{label}</Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {orderStatusOptions.map((statusOption) => {
          const isSelected = value === statusOption.value;

          return (
            <Pressable
              key={statusOption.value}
              className={`rounded-xl px-3 py-2 active:opacity-80 ${
                isSelected ? "bg-slate-950" : "bg-slate-100"
              } ${disabled ? "opacity-60" : ""}`}
              disabled={disabled}
              onPress={() => onChange(statusOption.value)}
            >
              <Text
                className={`text-xs font-bold ${
                  isSelected ? "text-white" : "text-slate-700"
                }`}
              >
                {statusOption.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
