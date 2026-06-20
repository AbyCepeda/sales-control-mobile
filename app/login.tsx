import { setCredentials } from "@/src/features/auth/auth.slice";
import { useLoginMutation } from "@/src/services/authApi";
import { useAppDispatch } from "@/src/store/hooks";
import { saveToken } from "@/src/utils/tokenStorage";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

/**
 * Pantalla de login.
 *
 * Beneficio:
 * - Conecta el móvil/web con POST /api/auth/login.
 * - Guarda el token en Redux.
 * - Guarda el token en storage para mantener sesión.
 * - Redirige al dashboard cuando el login es correcto.
 */
export default function LoginScreen() {
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("admin123");

  const [login, { isLoading }] = useLoginMutation();

  async function handleLogin() {
    try {
      if (!email.trim() || !password.trim()) {
        Alert.alert("Campos requeridos", "Ingresa correo y contraseña.");
        return;
      }

      const response = await login({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();

      const token = response.data.token;
      const user = response.data.user;

      await saveToken(token);

      dispatch(
        setCredentials({
          token,
          user,
        }),
      );

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("LOGIN_ERROR:", JSON.stringify(error, null, 2));

      Alert.alert(
        "Error al iniciar sesión",
        error?.data?.message ??
          "Revisa tus credenciales o que el backend esté encendido.",
      );
    }
  }

  return (
    <View className="flex-1 justify-center bg-slate-950 px-6">
      <View className="mb-10">
        <Text className="text-4xl font-extrabold text-white">
          Sales Control
        </Text>

        <Text className="mt-2 text-base text-slate-400">
          Inicia sesión para administrar ventas, clientes y pedidos.
        </Text>
      </View>

      <View className="rounded-3xl bg-white p-6">
        <Text className="mb-1 text-sm font-semibold text-slate-700">
          Correo
        </Text>

        <TextInput
          className="mb-4 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
          placeholder="admin@test.com"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text className="mb-1 text-sm font-semibold text-slate-700">
          Contraseña
        </Text>

        <TextInput
          className="mb-6 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
          placeholder="admin123"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          className={`rounded-xl py-4 active:opacity-80 ${
            isLoading ? "bg-slate-500" : "bg-slate-950"
          }`}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-center text-base font-bold text-white">
              Entrar
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
