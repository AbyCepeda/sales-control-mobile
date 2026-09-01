import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabIconName =
  | "home-outline"
  | "home"
  | "cube-outline"
  | "cube"
  | "people-outline"
  | "people"
  | "receipt-outline"
  | "receipt"
  | "person-circle-outline"
  | "person-circle";

function TabIcon({
  name,
  color,
  size,
}: {
  name: TabIconName;
  color: string;
  size: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#020617",
        tabBarInactiveTintColor: "#64748b",

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
          marginTop: 2,
        },

        tabBarIconStyle: {
          marginTop: 6,
        },

        tabBarStyle: {
          height: 64 + bottomPadding,
          paddingTop: 6,
          paddingBottom: bottomPadding,
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          backgroundColor: "#ffffff",
        },

        tabBarItemStyle: {
          paddingVertical: 4,
        },

        tabBarHideOnKeyboard: true,

        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              color={color}
              size={Platform.OS === "android" ? 24 : 22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: "Productos",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "cube" : "cube-outline"}
              color={color}
              size={Platform.OS === "android" ? 24 : 22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="customers"
        options={{
          title: "Clientes",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "people" : "people-outline"}
              color={color}
              size={Platform.OS === "android" ? 24 : 22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "receipt" : "receipt-outline"}
              color={color}
              size={Platform.OS === "android" ? 24 : 22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: "Usuarios",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "person-circle" : "person-circle-outline"}
              color={color}
              size={Platform.OS === "android" ? 24 : 22}
            />
          ),
        }}
      />
    </Tabs>
  );
}
