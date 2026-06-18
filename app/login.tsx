import { Text, View } from "react-native";

/**
 * Pantalla temporal para probar NativeWind.
 *
 * Sirve para confirmar que className funciona antes
 * de construir el login completo.
 */
export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-blue-600">Sales Control</Text>

      <Text className="mt-2 text-center text-base text-gray-500">
        NativeWind funcionando correctamente
      </Text>

      <View className="mt-6 rounded-xl bg-gray-100 px-5 py-4">
        <Text className="font-semibold text-gray-800">
          Ya podemos diseñar con Tailwind
        </Text>
      </View>
    </View>
  );
}
