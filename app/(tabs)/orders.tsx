import { Text, View } from "react-native";

/**
 * Pantalla temporal de pedidos.
 *
 * Más adelante aquí mostraremos:
 * - pedidos recientes
 * - estado del pedido
 * - total
 * - cliente
 * - vendedor
 */
export default function OrdersScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-gray-900">Pedidos</Text>

      <Text className="mt-2 text-center text-base text-gray-500">
        Aquí aparecerá la lista de pedidos.
      </Text>
    </View>
  );
}
