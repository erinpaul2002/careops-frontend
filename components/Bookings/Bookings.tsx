"use client";

import BookingsUI from "@/components/Bookings/BookingsUI";
import { useBookings } from "@/components/Bookings/useBookings";

export default function Bookings() {
  const {
    loading,
    error,
    bookings,
    statusFilter,
    mutatingBookingId,
    onStatusFilterChange,
    onUpdateStatus,
    onRefresh,
  } = useBookings();

  return (
    <BookingsUI
      loading={loading}
      error={error}
      bookings={bookings}
      statusFilter={statusFilter}
      mutatingBookingId={mutatingBookingId}
      onStatusFilterChange={onStatusFilterChange}
      onUpdateStatus={onUpdateStatus}
      onRefresh={onRefresh}
    />
  );
}
