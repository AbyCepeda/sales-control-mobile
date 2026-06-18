import { Text, View } from "react-native";

/**
 * Pantalla temporal de clientes.
 *
 * Más adelante aquí mostraremos:
 * - lista de clientes
 * - crear cliente
 * - ver historial de pedidos por cliente
 */
export default function CustomersScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-gray-900">Clientes</Text>

      <Text className="mt-2 text-center text-base text-gray-500">
        Aquí aparecerá la lista de clientes.
      </Text>
    </View>
  );
}
