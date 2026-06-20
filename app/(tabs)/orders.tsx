import { Text, View } from "react-native";

export default function OrdersScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-3xl font-extrabold text-slate-950">Pedidos</Text>

      <Text className="mt-2 text-center text-base text-slate-500">
        Aquí mostraremos los pedidos realizados.
      </Text>
    </View>
  );
}
