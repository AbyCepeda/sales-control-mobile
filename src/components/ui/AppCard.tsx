import type { ReactNode } from "react";
import { View } from "react-native";

/**
 * Props del componente AppCard.
 *
 * Para qué sirve:
 * - Define qué puede recibir una card reutilizable.
 *
 * Beneficio:
 * - Podemos usar la misma card en Dashboard, Pedidos, Clientes, Productos, etc.
 */
type AppCardProps = {
  /**
   * Contenido interno de la card.
   *
   * Ejemplo:
   * <AppCard>
   *   <Text>Pedido #1</Text>
   * </AppCard>
   */
  children: ReactNode;

  /**
   * Clases extra opcionales.
   *
   * Para qué sirve:
   * - Permite modificar margen, padding o colores en casos específicos.
   *
   * Beneficio:
   * - Reutilizamos la card base sin perder flexibilidad.
   */
  className?: string;
};

/**
 * Card base reutilizable.
 *
 * Para qué sirve:
 * - Evita repetir muchas veces:
 *   rounded-3xl bg-white p-5 shadow-sm
 *
 * Beneficio:
 * - Si después quieres cambiar el diseño de todas las cards,
 *   solo editas este archivo.
 */
export function AppCard({ children, className = "" }: AppCardProps) {
  return (
    <View className={`rounded-3xl bg-white p-5 shadow-sm ${className}`}>
      {children}
    </View>
  );
}
