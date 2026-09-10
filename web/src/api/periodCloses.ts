import { api } from "@/api/client";
import type { PeriodClose } from "@/types/domain";

export const periodClosesApi = {
  list: () => api.get<PeriodClose[]>("/period-closes"),
  close: (periodEndDate: string) => api.post<PeriodClose>("/period-closes", { periodEndDate }),
};
