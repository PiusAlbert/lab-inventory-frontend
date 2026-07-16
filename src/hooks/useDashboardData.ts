import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export type DashboardSortBy =
  | "name"
  | "sku"
  | "created_at"
  | "current_stock"
  | "minimum_threshold";

export type DashboardSortDir = "asc" | "desc";

export type DashboardFilters = {
  labId?: string | null;
  search?: string;
  categoryId?: string | null;
  lowStockOnly?: boolean;
  expiringDays?: number;
  sortBy?: DashboardSortBy;
  sortDir?: DashboardSortDir;
};

export type DashboardItem = {
  id: string;
  name: string;
  sku: string;
  categoryId: string | null;
  categoryName: string | null;
  unitOfMeasure: string;
  minimumThreshold: number;
  currentStock: number;
  inventoryValue: number;
  nearestExpiryDate: string | null;
  expiringBatchCount: number;
  isLowStock: boolean;
  shortage: number;
};

export type DashboardMetrics = {
  totalItems: number;
  lowStockItems: number;
  expiringItems: number;
  totalStockUnits: number;
  totalInventoryValue: number;
};

export type DashboardMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type DashboardData = {
  meta: DashboardMeta;
  metrics: DashboardMetrics;
  items: DashboardItem[];
};

type UseDashboardDataArgs = {
  page: number;
  pageSize: number;
  filters?: DashboardFilters;
};

const EMPTY_DASHBOARD: DashboardData = Object.freeze({
  meta: {
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  metrics: {
    totalItems: 0,
    lowStockItems: 0,
    expiringItems: 0,
    totalStockUnits: 0,
    totalInventoryValue: 0,
  },
  items: [],
});

function normalizeNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePayload(payload: any): DashboardData {
  const meta = payload?.meta ?? {};
  const metrics = payload?.metrics ?? {};

  return {
    meta: {
      page: normalizeNumber(meta.page, 1),
      pageSize: normalizeNumber(meta.pageSize, 25),
      totalItems: normalizeNumber(meta.totalItems, 0),
      totalPages: normalizeNumber(meta.totalPages, 0),
      hasNextPage: Boolean(meta.hasNextPage),
      hasPreviousPage: Boolean(meta.hasPreviousPage),
    },
    metrics: {
      totalItems: normalizeNumber(metrics.totalItems, 0),
      lowStockItems: normalizeNumber(metrics.lowStockItems, 0),
      expiringItems: normalizeNumber(metrics.expiringItems, 0),
      totalStockUnits: normalizeNumber(metrics.totalStockUnits, 0),
      totalInventoryValue: normalizeNumber(metrics.totalInventoryValue, 0),
    },
    items: Array.isArray(payload?.items) ? payload.items : [],
  };
}

export function useDashboardData({
  page,
  pageSize,
  filters = {},
}: UseDashboardDataArgs) {
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const requestIdRef = useRef(0);

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        page,
        pageSize,
        labId: filters.labId ?? null,
        search: filters.search?.trim() ?? "",
        categoryId: filters.categoryId ?? null,
        lowStockOnly: Boolean(filters.lowStockOnly),
        expiringDays: filters.expiringDays ?? 30,
        sortBy: filters.sortBy ?? "name",
        sortDir: filters.sortDir ?? "asc",
      }),
    [page, pageSize, filters]
  );

  const fetchDashboard = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const params = JSON.parse(queryKey);

    setLoading(true);
    setError(null);

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_dashboard_inventory_page",
      {
        p_lab_id: params.labId,
        p_search: params.search || null,
        p_category_id: params.categoryId,
        p_low_stock_only: params.lowStockOnly,
        p_expiring_days: params.expiringDays,
        p_page: params.page,
        p_page_size: params.pageSize,
        p_sort_by: params.sortBy,
        p_sort_dir: params.sortDir,
      }
    );

    if (requestId !== requestIdRef.current) return;

    if (rpcError) {
      setError(new Error(rpcError.message));
      setLoading(false);
      return;
    }

    setData(normalizePayload(rpcData));
    setLoading(false);
  }, [queryKey]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    items: data.items,
    metrics: data.metrics,
    meta: data.meta,
    loading,
    error,
    refetch: fetchDashboard,
  };
}
