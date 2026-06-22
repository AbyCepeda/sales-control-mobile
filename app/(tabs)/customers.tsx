import {
  useCreateCustomerMutation,
  useGetCustomersQuery,
} from "@/src/services/customersApi";
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

/**
 * Pantalla de clientes.
 *
 * Para qué sirve:
 * - Muestra los clientes registrados en el backend.
 * - Permite crear clientes nuevos desde el móvil.
 * - Prepara la app para después seleccionar un cliente al crear pedidos.
 *
 * Beneficio:
 * - Ya no usamos datos falsos.
 * - Todo cliente creado aquí podrá usarse para pedidos.
 */
export default function CustomersScreen() {
  const { data, isLoading, error, refetch } = useGetCustomersQuery();

  const [createCustomer, { isLoading: isCreating }] =
    useCreateCustomerMutation();

  const [showForm, setShowForm] = useState(false);

  /**
   * Campos del formulario.
   *
   * Importante:
   * Tu backend usa:
   * - name
   * - phone
   * - notes
   *
   * No usa:
   * - address
   * - reference
   */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const customers = data?.data ?? [];

  /**
   * Crea un cliente nuevo.
   *
   * Para qué sirve:
   * - Envía los datos al backend.
   * - Limpia el formulario si todo sale bien.
   * - Actualiza la lista automáticamente por RTK Query.
   *
   * Beneficio:
   * - Puedes registrar clientes reales desde la app.
   */
  async function handleCreateCustomer() {
    try {
      if (!name.trim()) {
        Alert.alert("Nombre requerido", "Ingresa el nombre del cliente.");
        return;
      }

      await createCustomer({
        name: name.trim(),
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      }).unwrap();

      setName("");
      setPhone("");
      setNotes("");
      setShowForm(false);

      Alert.alert("Cliente creado", "El cliente se registró correctamente.");
    } catch (error: any) {
      console.error("CREATE_CUSTOMER_ERROR:", JSON.stringify(error, null, 2));

      Alert.alert(
        "Error al crear cliente",
        error?.data?.message ?? "No se pudo registrar el cliente.",
      );
    }
  }

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="px-5 pb-10 pt-16">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-slate-950">
              Clientes
            </Text>

            <Text className="mt-1 text-base text-slate-500">
              Personas registradas para crear pedidos.
            </Text>
          </View>

          <Pressable
            className="rounded-xl bg-slate-950 px-4 py-3 active:opacity-80"
            onPress={() => setShowForm((current) => !current)}
          >
            <Text className="text-sm font-bold text-white">
              {showForm ? "Cerrar" : "+ Nuevo"}
            </Text>
          </Pressable>
        </View>

        {showForm ? (
          <View className="mt-6 rounded-3xl bg-white p-5">
            <Text className="text-xl font-extrabold text-slate-950">
              Nuevo cliente
            </Text>

            <Text className="mt-1 text-sm text-slate-500">
              Registra los datos básicos del cliente.
            </Text>

            <TextInput
              className="mt-5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
              placeholder="Nombre del cliente"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              className="mt-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
              placeholder="Teléfono"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <TextInput
              className="mt-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
              placeholder="Notas"
              placeholderTextColor="#94a3b8"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <Pressable
              className={`mt-5 rounded-xl py-4 active:opacity-80 ${
                isCreating ? "bg-slate-500" : "bg-slate-950"
              }`}
              onPress={handleCreateCustomer}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-center font-bold text-white">
                  Guardar cliente
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View className="mt-8 items-center rounded-3xl bg-white p-8">
            <ActivityIndicator />

            <Text className="mt-3 text-slate-500">Cargando clientes...</Text>
          </View>
        ) : error ? (
          <View className="mt-8 rounded-3xl bg-white p-6">
            <Text className="text-xl font-extrabold text-red-600">
              No se pudieron cargar los clientes
            </Text>

            <Text className="mt-2 text-slate-500">
              Revisa que el backend esté encendido y que tu sesión siga activa.
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
        ) : (
          <View className="mt-6 gap-4">
            {customers.length ? (
              customers.map((customer) => (
                <View
                  key={customer.id}
                  className="rounded-3xl bg-white p-5 shadow-sm"
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-xl font-extrabold text-slate-950">
                        {customer.name}
                      </Text>

                      <Text className="mt-1 text-sm text-slate-500">
                        Teléfono: {customer.phone ?? "Sin teléfono"}
                      </Text>

                      <Text className="mt-1 text-sm text-slate-500">
                        Notas: {customer.notes ?? "Sin notas"}
                      </Text>
                    </View>

                    <View
                      className={`rounded-full px-3 py-1 ${
                        customer.isActive ? "bg-emerald-100" : "bg-red-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          customer.isActive
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {customer.isActive ? "Activo" : "Inactivo"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="rounded-3xl bg-white p-6">
                <Text className="text-center text-slate-500">
                  Todavía no hay clientes registrados.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
