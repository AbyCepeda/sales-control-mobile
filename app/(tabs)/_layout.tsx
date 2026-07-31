import { useAppSelector } from "@/src/store/hooks";
import { Tabs } from "expo-router";

/**
 * Layout de tabs principales.
 *
 * Beneficio:
 * - Define las pantallas visibles en la navegación inferior.
 * - Oculta Usuarios si el usuario no es ADMIN.
 */
export default function TabLayout() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "ADMIN";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#020617",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: "Productos",
        }}
      />

      <Tabs.Screen
        name="customers"
        options={{
          title: "Clientes",
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Pedidos",
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: "Usuarios",
          href: isAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}
