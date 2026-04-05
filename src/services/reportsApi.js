import api from "../lib/api";

/**
 * Fetch inventory report from backend
 * period: "weekly" | "monthly" | "custom"
 * start/end: "YYYY-MM-DD" (only for custom)
 */
export const fetchReport = async (period = "monthly", start = null, end = null) => {
  const params = new URLSearchParams({ period });
  if (period === "custom" && start && end) {
    params.append("start", start);
    params.append("end", end);
  }
  const { data } = await api.get(`/reports?${params.toString()}`);
  return data;
};