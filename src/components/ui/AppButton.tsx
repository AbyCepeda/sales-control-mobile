import { ActivityIndicator, Pressable, Text } from "react-native";

/**
 * Variantes visuales del botón.
 *
 * Para qué sirve:
 * - Permite usar botones con diferentes estilos sin repetir clases.
 */
type AppButtonVariant =
  | "primary"
  | "success"
  | "danger"
  | "secondary"
  | "outline";

/**
 * Props del botón reutilizable.
 */
type AppButtonProps = {
  /**
   * Texto que se muestra dentro del botón.
   */
  title: string;

  /**
   * Acción que se ejecuta al presionar.
   */
  onPress: () => void;

  /**
   * Variante visual del botón.
   *
   * Ejemplo:
   * - primary: botón negro principal.
   * - success: botón verde para guardar.
   * - danger: botón rojo para eliminar.
   */
  variant?: AppButtonVariant;

  /**
   * Indica si el botón está cargando.
   *
   * Beneficio:
   * - Evita que el usuario presione varias veces mientras se guarda.
   */
  isLoading?: boolean;

  /**
   * Indica si el botón está deshabilitado.
   */
  disabled?: boolean;

  /**
   * Clases extra opcionales.
   */
  className?: string;

  /**
   * Clases extra para el texto.
   */
  textClassName?: string;
};

/**
 * Obtiene las clases del botón según la variante.
 *
 * Para qué sirve:
 * - Centraliza estilos.
 *
 * Beneficio:
 * - Evitamos copiar/pegar bg-slate-950, bg-emerald-600, etc.
 */
function getButtonClassName(variant: AppButtonVariant) {
  const variants: Record<AppButtonVariant, string> = {
    primary: "bg-slate-950",
    success: "bg-emerald-600",
    danger: "bg-red-600",
    secondary: "bg-slate-800",
    outline: "border border-dashed border-slate-400 bg-transparent",
  };

  return variants[variant];
}

/**
 * Obtiene las clases del texto según la variante.
 */
function getTextClassName(variant: AppButtonVariant) {
  if (variant === "outline") {
    return "text-slate-700";
  }

  return "text-white";
}

/**
 * Botón reutilizable de la app.
 *
 * Para qué sirve:
 * - Reemplaza Pressable + Text repetidos.
 *
 * Beneficio:
 * - Hace más limpio el código en pantallas grandes.
 * - Mantiene botones consistentes en toda la app.
 */
export function AppButton({
  title,
  onPress,
  variant = "primary",
  isLoading = false,
  disabled = false,
  className = "",
  textClassName = "",
}: AppButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      className={`rounded-xl px-4 py-3 active:opacity-80 ${
        isDisabled ? "bg-slate-500" : getButtonClassName(variant)
      } ${className}`}
      onPress={onPress}
      disabled={isDisabled}
    >
      {isLoading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text
          className={`text-center font-bold ${getTextClassName(
            variant,
          )} ${textClassName}`}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
