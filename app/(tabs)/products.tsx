import {
  useCreateProductMutation,
  useGetProductsQuery,
} from "@/src/services/productsApi";
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

/**
 * Convierte el precio recibido desde backend a texto monetario.
 *
 * Prisma Decimal normalmente llega como string.
 */
function formatPrice(price: string): string {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return "$0.00";
  }

  return `$${numericPrice.toFixed(2)}`;
}

/**
 * Pantalla de productos.
 *
 * Beneficio:
 * - Lista productos reales desde el backend.
 * - Permite crear productos si el usuario es ADMIN.
 * - Usa RTK Query para cache, loading, error y recarga automática.
 */
export default function ProductsScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const {
    data: productsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetProductsQuery();

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();

  const products = productsResponse?.data ?? [];

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
  }

  async function handleCreateProduct() {
    try {
      const trimmedName = name.trim();
      const trimmedDescription = description.trim();
      const numericPrice = Number(price);
      const numericStock = Number(stock);

      if (!trimmedName) {
        Alert.alert("Campo requerido", "Ingresa el nombre del producto.");
        return;
      }

      if (Number.isNaN(numericPrice) || numericPrice <= 0) {
        Alert.alert("Precio inválido", "Ingresa un precio mayor a 0.");
        return;
      }

      if (Number.isNaN(numericStock) || numericStock < 0) {
        Alert.alert("Stock inválido", "Ingresa un stock válido.");
        return;
      }

      await createProduct({
        name: trimmedName,
        description: trimmedDescription || null,
        price: numericPrice,
        stock: numericStock,
      }).unwrap();

      resetForm();
      setShowCreateForm(false);

      Alert.alert("Producto creado", "El producto se registró correctamente.");
    } catch (error: any) {
      console.error("CREATE_PRODUCT_ERROR:", JSON.stringify(error, null, 2));

      Alert.alert(
        "Error al crear producto",
        error?.data?.message ?? "No se pudo crear el producto.",
      );
    }
  }

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="px-5 pb-10 pt-16">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-slate-950">
              Productos
            </Text>

            <Text className="mt-1 text-base text-slate-500">
              Lista de productos disponibles
            </Text>
          </View>

          <Pressable
            className="rounded-xl bg-slate-950 px-4 py-3 active:opacity-80"
            onPress={() => refetch()}
          >
            <Text className="text-sm font-bold text-white">
              {isFetching ? "..." : "Recargar"}
            </Text>
          </Pressable>
        </View>

        {isAdmin ? (
          <Pressable
            className="mt-5 rounded-2xl bg-slate-950 py-4 active:opacity-80"
            onPress={() => setShowCreateForm((currentValue) => !currentValue)}
          >
            <Text className="text-center text-base font-bold text-white">
              {showCreateForm ? "Cancelar" : "+ Nuevo producto"}
            </Text>
          </Pressable>
        ) : (
          <View className="mt-5 rounded-2xl bg-white p-4">
            <Text className="text-sm text-slate-500">
              Solo un administrador puede crear productos.
            </Text>
          </View>
        )}

        {showCreateForm ? (
          <View className="mt-5 rounded-3xl bg-white p-5">
            <Text className="text-xl font-extrabold text-slate-950">
              Crear producto
            </Text>

            <Text className="mt-1 text-sm text-slate-500">
              Registra nombre, descripción, precio y stock inicial.
            </Text>

            <View className="mt-5">
              <Text className="mb-1 text-sm font-semibold text-slate-700">
                Nombre
              </Text>

              <TextInput
                className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
                placeholder="Ej. Gorra negra"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="mt-4">
              <Text className="mb-1 text-sm font-semibold text-slate-700">
                Descripción
              </Text>

              <TextInput
                className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
                placeholder="Ej. Gorra ajustable"
                placeholderTextColor="#94a3b8"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-1 text-sm font-semibold text-slate-700">
                  Precio
                </Text>

                <TextInput
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
                  placeholder="250"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>

              <View className="flex-1">
                <Text className="mb-1 text-sm font-semibold text-slate-700">
                  Stock
                </Text>

                <TextInput
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
                  placeholder="10"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
            </View>

            <Pressable
              className={`mt-6 rounded-xl py-4 active:opacity-80 ${
                isCreating ? "bg-slate-500" : "bg-slate-950"
              }`}
              onPress={handleCreateProduct}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-center text-base font-bold text-white">
                  Guardar producto
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View className="mt-10 items-center justify-center rounded-3xl bg-white p-8">
            <ActivityIndicator />
            <Text className="mt-3 text-slate-500">Cargando productos...</Text>
          </View>
        ) : error ? (
          <View className="mt-8 rounded-3xl bg-white p-6">
            <Text className="text-xl font-extrabold text-red-600">
              No se pudieron cargar los productos
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
        ) : products.length === 0 ? (
          <View className="mt-8 rounded-3xl bg-white p-6">
            <Text className="text-xl font-extrabold text-slate-950">
              No hay productos
            </Text>

            <Text className="mt-2 text-slate-500">
              Todavía no tienes productos registrados.
            </Text>
          </View>
        ) : (
          <View className="mt-6 gap-4">
            {products.map((product) => (
              <View
                key={product.id}
                className="rounded-3xl bg-white p-5 shadow-sm"
              >
                <View className="flex-row items-start justify-between gap-4">
                  <View className="flex-1">
                    <Text className="text-xl font-extrabold text-slate-950">
                      {product.name}
                    </Text>

                    <Text className="mt-1 text-sm text-slate-500">
                      {product.description ?? "Sin descripción"}
                    </Text>
                  </View>

                  <View
                    className={`rounded-full px-3 py-1 ${
                      product.isActive ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        product.isActive ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {product.isActive ? "Activo" : "Inactivo"}
                    </Text>
                  </View>
                </View>

                <View className="mt-5 flex-row gap-3">
                  <View className="flex-1 rounded-2xl bg-slate-100 p-4">
                    <Text className="text-xs font-semibold text-slate-500">
                      Precio
                    </Text>

                    <Text className="mt-1 text-xl font-extrabold text-slate-950">
                      {formatPrice(product.price)}
                    </Text>
                  </View>

                  <View className="flex-1 rounded-2xl bg-slate-100 p-4">
                    <Text className="text-xs font-semibold text-slate-500">
                      Stock
                    </Text>

                    <Text
                      className={`mt-1 text-xl font-extrabold ${
                        product.stock <= 0
                          ? "text-red-600"
                          : product.stock <= 5
                            ? "text-orange-500"
                            : "text-slate-950"
                      }`}
                    >
                      {product.stock}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
