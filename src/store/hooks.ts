import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";

/**
 * Hook tipado para dispatch.
 *
 * En vez de usar useDispatch normal, usamos este para que TypeScript
 * conozca los actions disponibles.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Hook tipado para leer el estado global.
 *
 * Así TypeScript sabe que existe state.auth, state.api, etc.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
