import {
  deleteSyncedSyncQueueItems,
  getPendingSyncQueueItems,
  updateSyncQueueItemStatus,
} from "@/src/features/sync/syncQueue.service";
import { getToken } from "@/src/utils/tokenStorage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL no está configurada.");
}

type UpdateOrderSyncPayload = {
  id: number;
  body: unknown;
};

type CreateCustomerOrderPaymentSyncPayload = {
  customerOrderId: number;
  body: unknown;
};

export type SyncPendingOrdersResult = {
  total: number;
  synced: number;
  failed: number;
};

async function syncCreateOrder(payload: unknown, token: string) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Error ${response.status}: ${
        errorText || "No se pudo sincronizar el pedido."
      }`,
    );
  }
}

async function syncUpdateOrder(payload: UpdateOrderSyncPayload, token: string) {
  const response = await fetch(`${API_BASE_URL}/orders/${payload.id}/full`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload.body),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Error ${response.status}: ${
        errorText || "No se pudo sincronizar la edición del pedido."
      }`,
    );
  }
}

async function syncCreateCustomerOrderPayment(
  payload: CreateCustomerOrderPaymentSyncPayload,
  token: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/customer-orders/${payload.customerOrderId}/payments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload.body),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Error ${response.status}: ${
        errorText || "No se pudo sincronizar el abono del cliente."
      }`,
    );
  }
}

/**
 * Sincroniza acciones offline:
 * - CREATE_ORDER: pedidos nuevos.
 * - UPDATE_ORDER: ediciones de pedidos existentes.
 * - CREATE_ORDER_PAYMENT: abonos registrados sin internet.
 *
 * Nueva lógica:
 * - CREATE_ORDER_PAYMENT ahora usa customerOrderId.
 *
 * Beneficio:
 * - El abono offline se sincroniza con el cliente correcto dentro del pedido.
 */
export async function syncPendingOrders(): Promise<SyncPendingOrdersResult> {
  const pendingItems = await getPendingSyncQueueItems();

  const syncItems = pendingItems.filter((item) => {
    return (
      item.type === "CREATE_ORDER" ||
      item.type === "UPDATE_ORDER" ||
      item.type === "CREATE_ORDER_PAYMENT"
    );
  });

  const token = await getToken();

  if (!token) {
    throw new Error("No hay token de sesión. Inicia sesión de nuevo.");
  }

  let synced = 0;
  let failed = 0;

  for (const item of syncItems) {
    try {
      const payload = JSON.parse(item.payload);

      if (item.type === "CREATE_ORDER") {
        await syncCreateOrder(payload, token);
      }

      if (item.type === "UPDATE_ORDER") {
        await syncUpdateOrder(payload as UpdateOrderSyncPayload, token);
      }

      if (item.type === "CREATE_ORDER_PAYMENT") {
        await syncCreateCustomerOrderPayment(
          payload as CreateCustomerOrderPaymentSyncPayload,
          token,
        );
      }

      await updateSyncQueueItemStatus(item.id, "SYNCED", null);
      synced += 1;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error desconocido al sincronizar.";

      await updateSyncQueueItemStatus(item.id, "FAILED", message);
      failed += 1;
    }
  }

  await deleteSyncedSyncQueueItems();

  return {
    total: syncItems.length,
    synced,
    failed,
  };
}
