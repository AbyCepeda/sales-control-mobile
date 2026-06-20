import { logout } from "@/src/features/auth/auth.slice";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { removeToken } from "@/src/utils/tokenStorage";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

/**
 * Dashboard inicial.
 *
 * Beneficio:
 * - Confirma que el login guardó correctamente el usuario.
 * - Permite cerrar sesión limpiando Redux y SecureStore.
 */
export default function DashboardScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  async function handleLogout() {
    await removeToken();
    dispatch(logout());
    router.replace("/login");
  }

  return (
    <View className="flex-1 bg-slate-100 px-5 pt-16">
      <Text className="text-3xl font-extrabold text-slate-950">Dashboard</Text>

      <Text className="mt-1 text-base text-slate-500">
        Resumen inicial del sistema
      </Text>

      <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
        <Text className="text-sm font-semibold text-slate-500">
          Usuario activo
        </Text>

        <Text className="mt-2 text-2xl font-extrabold text-slate-950">
          {user?.name ?? "Sin usuario"}
        </Text>

        <Text className="mt-1 text-base text-slate-600">
          {user?.email ?? "Sin correo"}
        </Text>

        <View className="mt-4 self-start rounded-full bg-slate-950 px-4 py-2">
          <Text className="text-sm font-bold text-white">
            {user?.role ?? "N/A"}
          </Text>
        </View>
      </View>

      <View className="mt-5 rounded-3xl bg-white p-5">
        <Text className="text-lg font-bold text-slate-950">
          Próximos módulos
        </Text>

        <Text className="mt-2 text-slate-600">
          Productos, clientes, pedidos y estadísticas.
        </Text>
      </View>

      <Pressable
        className="mt-6 rounded-xl bg-red-600 py-4"
        onPress={handleLogout}
      >
        <Text className="text-center text-base font-bold text-white">
          Cerrar sesión
        </Text>
      </Pressable>
    </View>
  );
}
