import type { Booking, BookingStatus } from "@/lib/api/types";

export interface BookingsState {
  loading: boolean;
  error: string | null;
  bookings: Booking[];
  statusFilter: "all" | BookingStatus;
  mutatingBookingId: string | null;
}

export interface BookingsUIProps extends BookingsState {
  onStatusFilterChange: (status: "all" | BookingStatus) => Promise<void>;
  onUpdateStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  onRefresh: () => Promise<void>;
}
