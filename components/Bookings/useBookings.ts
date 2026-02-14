"use client";

import { useCallback, useEffect, useState } from "react";
import { getBookings, updateBookingStatus } from "@/lib/api/client";
import type { BookingStatus } from "@/lib/api/types";
import type { BookingsState } from "@/components/Bookings/types";

const initialState: BookingsState = {
  loading: true,
  error: null,
  bookings: [],
  statusFilter: "all",
  mutatingBookingId: null,
};

export function useBookings() {
  const [state, setState] = useState<BookingsState>(initialState);

  const load = useCallback(async (statusFilter: "all" | BookingStatus) => {
    setState((previous) => ({ ...previous, loading: true, error: null, statusFilter }));

    try {
      const bookings = await getBookings({
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setState((previous) => ({ ...previous, loading: false, bookings, error: null }));
    } catch {
      setState((previous) => ({
        ...previous,
        loading: false,
        bookings: [],
        error: "Unable to load bookings.",
      }));
    }
  }, []);

  useEffect(() => {
    void load("all");
  }, [load]);

  const onStatusFilterChange = useCallback(
    async (status: "all" | BookingStatus) => {
      await load(status);
    },
    [load],
  );

  const onUpdateStatus = useCallback(async (bookingId: string, status: BookingStatus) => {
    setState((previous) => ({ ...previous, mutatingBookingId: bookingId }));

    try {
      await updateBookingStatus(bookingId, status);
      await load(state.statusFilter);
    } catch {
      setState((previous) => ({
        ...previous,
        error: "Unable to update booking status.",
      }));
    } finally {
      setState((previous) => ({ ...previous, mutatingBookingId: null }));
    }
  }, [load, state.statusFilter]);

  return {
    ...state,
    onStatusFilterChange,
    onUpdateStatus,
    onRefresh: () => load(state.statusFilter),
  };
}
