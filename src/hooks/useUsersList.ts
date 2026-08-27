"use client";

import { usersService } from "@/services";
import type { UserFilters } from "@/services/users.service";
import { useAsync } from "./useAsync";

export function useUsersList(filters: UserFilters) {
  return useAsync(() => usersService.listUsers(filters), [JSON.stringify(filters)]);
}
