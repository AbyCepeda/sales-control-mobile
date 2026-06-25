import type { KeyboardTypeOptions } from "react-native";
import { Text, TextInput, View } from "react-native";

/**
 * Props del input reutilizable.
 */
type AppInputProps = {
  /**
   * Texto opcional arriba del input.
   */
  label?: string;

  /**
   * Placeholder del input.
   */
  placeholder: string;

  /**
   * Valor actual del input.
   */
  value: string;

  /**
   * Función que actualiza el valor.
   */
  onChangeText: (value: string) => void;

  /**
   * Tipo de teclado.
   *
   * Ejemplo:
   * - default
   * - numeric
   * - phone-pad
   * - email-address
   */
  keyboardType?: KeyboardTypeOptions;

  /**
   * Permite textos largos.
   */
  multiline?: boolean;

  /**
   * Clases extra para el contenedor.
   */
  className?: string;

  /**
   * Clases extra para el TextInput.
   */
  inputClassName?: string;
};

/**
 * Input reutilizable.
 *
 * Para qué sirve:
 * - Evita repetir TextInput con las mismas clases.
 *
 * Beneficio:
 * - Si después queremos cambiar bordes, colores o tamaño,
 *   solo editamos este componente.
 */
export function AppInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  multiline = false,
  className = "",
  inputClassName = "",
}: AppInputProps) {
  return (
    <View className={className}>
      {label ? (
        <Text className="mb-2 text-sm font-bold text-slate-700">{label}</Text>
      ) : null}

      <TextInput
        className={`rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 ${inputClassName}`}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}
