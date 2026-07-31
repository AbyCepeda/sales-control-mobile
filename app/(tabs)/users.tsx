import type { UserRole } from "@/src/features/auth/auth.types";
import type { User } from "@/src/features/users/user.types";
import {
    useCreateUserMutation,
    useGetUsersQuery,
    useUpdateUserMutation,
    useUpdateUserStatusMutation,
} from "@/src/services/usersApi";
import { useAppSelector } from "@/src/store/hooks";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

function getRoleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    ADMIN: "Administrador",
    SELLER: "Vendedor",
  };

  return labels[role];
}

function UserRoleButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`rounded-xl px-4 py-3 active:opacity-80 ${
        selected ? "bg-slate-950" : "border border-slate-300 bg-white"
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-sm font-bold ${
          selected ? "text-white" : "text-slate-700"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function UserCard({
  user,
  onToggleStatus,
  onChangeRole,
  isLoading,
}: {
  user: User;
  onToggleStatus: (user: User) => void;
  onChangeRole: (user: User) => void;
  isLoading: boolean;
}) {
  return (
    <View className="rounded-3xl bg-white p-5 shadow-sm">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-slate-950">
            {user.name}
          </Text>

          <Text className="mt-1 text-sm text-slate-500">{user.email}</Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            <View className="rounded-full bg-slate-100 px-3 py-1">
              <Text className="text-xs font-bold text-slate-700">
                {getRoleLabel(user.role)}
              </Text>
            </View>

            <View
              className={`rounded-full px-3 py-1 ${
                user.isActive ? "bg-emerald-100" : "bg-red-100"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  user.isActive ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {user.isActive ? "Activo" : "Desactivado"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="mt-5 gap-3">
        <Pressable
          className="rounded-xl border border-slate-300 py-3 active:opacity-80"
          disabled={isLoading}
          onPress={() => onChangeRole(user)}
        >
          <Text className="text-center font-bold text-slate-950">
            Cambiar rol
          </Text>
        </Pressable>

        <Pressable
          className={`rounded-xl py-3 active:opacity-80 ${
            user.isActive ? "bg-red-600" : "bg-emerald-600"
          }`}
          disabled={isLoading}
          onPress={() => onToggleStatus(user)}
        >
          <Text className="text-center font-bold text-white">
            {user.isActive ? "Desactivar usuario" : "Activar usuario"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function UsersScreen() {
  const authUser = useAppSelector((state) => state.auth.user);
  const isAdmin = authUser?.role === "ADMIN";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("SELLER");

  const {
    data: usersResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetUsersQuery(undefined, {
    skip: !isAdmin,
  });

  const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [updateUserStatus, { isLoading: isUpdatingStatus }] =
    useUpdateUserStatusMutation();

  const users = usersResponse?.data ?? [];
  const isActionLoading = isCreatingUser || isUpdatingUser || isUpdatingStatus;

  async function handleCreateUser() {
    if (!name.trim()) {
      Alert.alert("Nombre obligatorio", "Escribe el nombre del usuario.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Email obligatorio", "Escribe el email del usuario.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Contraseña inválida",
        "La contraseña debe tener mínimo 6 caracteres.",
      );
      return;
    }

    try {
      await createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      }).unwrap();

      setName("");
      setEmail("");
      setPassword("");
      setRole("SELLER");

      Alert.alert("Usuario creado", "El usuario se creó correctamente.");
    } catch {
      Alert.alert(
        "No se pudo crear",
        "Revisa que el email no esté repetido y vuelve a intentar.",
      );
    }
  }

  function handleToggleStatus(user: User) {
    const nextStatus = !user.isActive;

    Alert.alert(
      nextStatus ? "Activar usuario" : "Desactivar usuario",
      nextStatus
        ? `¿Quieres activar a ${user.name}?`
        : `¿Quieres desactivar a ${user.name}? Ya no podrá iniciar sesión.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: nextStatus ? "Activar" : "Desactivar",
          style: nextStatus ? "default" : "destructive",
          onPress: async () => {
            try {
              await updateUserStatus({
                id: user.id,
                body: {
                  isActive: nextStatus,
                },
              }).unwrap();

              Alert.alert(
                "Usuario actualizado",
                nextStatus
                  ? "El usuario fue activado."
                  : "El usuario fue desactivado.",
              );
            } catch {
              Alert.alert(
                "No se pudo actualizar",
                "Intenta de nuevo en unos segundos.",
              );
            }
          },
        },
      ],
    );
  }

  function handleChangeRole(user: User) {
    const nextRole: UserRole = user.role === "ADMIN" ? "SELLER" : "ADMIN";

    Alert.alert(
      "Cambiar rol",
      `¿Quieres cambiar a ${user.name} de ${getRoleLabel(
        user.role,
      )} a ${getRoleLabel(nextRole)}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cambiar",
          onPress: async () => {
            try {
              await updateUser({
                id: user.id,
                body: {
                  role: nextRole,
                },
              }).unwrap();

              Alert.alert(
                "Rol actualizado",
                "El rol se actualizó correctamente.",
              );
            } catch {
              Alert.alert(
                "No se pudo cambiar el rol",
                "Intenta de nuevo en unos segundos.",
              );
            }
          },
        },
      ],
    );
  }

  if (!isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100 px-5">
        <View className="rounded-3xl bg-white p-6">
          <Text className="text-center text-2xl font-extrabold text-slate-950">
            Sin permisos
          </Text>

          <Text className="mt-2 text-center text-slate-500">
            Solo un administrador puede ver esta pantalla.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="px-5 pb-10 pt-16">
        <View>
          <Text className="text-3xl font-extrabold text-slate-950">
            Usuarios
          </Text>

          <Text className="mt-1 text-base text-slate-500">
            Administra vendedores y accesos del sistema.
          </Text>
        </View>

        <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <Text className="text-xl font-extrabold text-slate-950">
            Crear usuario
          </Text>

          <Text className="mt-1 text-sm text-slate-500">
            Úsalo para crear vendedores o administradores.
          </Text>

          <Text className="mt-5 text-sm font-bold text-slate-700">Nombre</Text>
          <TextInput
            className="mt-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950"
            placeholder="Ej. Juan Pérez"
            value={name}
            onChangeText={setName}
          />

          <Text className="mt-4 text-sm font-bold text-slate-700">Email</Text>
          <TextInput
            className="mt-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950"
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text className="mt-4 text-sm font-bold text-slate-700">
            Contraseña
          </Text>
          <TextInput
            className="mt-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text className="mt-5 text-sm font-bold text-slate-700">Rol</Text>
          <View className="mt-3 flex-row gap-3">
            <UserRoleButton
              label="Vendedor"
              selected={role === "SELLER"}
              onPress={() => setRole("SELLER")}
            />

            <UserRoleButton
              label="Admin"
              selected={role === "ADMIN"}
              onPress={() => setRole("ADMIN")}
            />
          </View>

          <Pressable
            className="mt-5 rounded-xl bg-slate-950 py-4 active:opacity-80"
            disabled={isCreatingUser}
            onPress={handleCreateUser}
          >
            <Text className="text-center font-bold text-white">
              {isCreatingUser ? "Creando..." : "Crear usuario"}
            </Text>
          </Pressable>
        </View>

        <View className="mt-7">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-extrabold text-slate-950">
              Lista de usuarios
            </Text>

            {isFetching ? (
              <Text className="text-xs text-slate-400">Actualizando...</Text>
            ) : null}
          </View>

          {isLoading ? (
            <View className="mt-6 items-center rounded-3xl bg-white p-8">
              <ActivityIndicator />
              <Text className="mt-3 text-slate-500">Cargando usuarios...</Text>
            </View>
          ) : error ? (
            <View className="mt-6 rounded-3xl bg-white p-6">
              <Text className="text-xl font-extrabold text-red-600">
                No se pudieron cargar los usuarios
              </Text>

              <Text className="mt-2 text-slate-500">
                Revisa tu conexión o vuelve a iniciar sesión.
              </Text>

              <Pressable
                className="mt-5 rounded-xl bg-slate-950 py-4 active:opacity-80"
                onPress={() => refetch()}
              >
                <Text className="text-center font-bold text-white">
                  Reintentar
                </Text>
              </Pressable>
            </View>
          ) : users.length ? (
            <View className="mt-4 gap-4">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isLoading={isActionLoading}
                  onToggleStatus={handleToggleStatus}
                  onChangeRole={handleChangeRole}
                />
              ))}
            </View>
          ) : (
            <View className="mt-6 rounded-3xl bg-white p-6">
              <Text className="text-center text-slate-500">
                Todavía no hay usuarios registrados.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
