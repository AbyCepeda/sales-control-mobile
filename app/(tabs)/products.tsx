import { Text, View } from "react-native";

/**
 * Pantalla temporal de productos.
 *
 * Más adelante aquí mostraremos:
 * - productos activos
 * - stock
 * - precios
 * - crear/editar productos si el usuario es ADMIN
 */
export default function ProductsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-gray-900">Productos</Text>

      <Text className="mt-2 text-center text-base text-gray-500">
        Aquí aparecerá la lista de productos.
      </Text>
    </View>
  );
}
