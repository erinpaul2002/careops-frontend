"use client";

import PublicBookingUI from "@/components/PublicBooking/PublicBookingUI";
import { usePublicBooking } from "@/components/PublicBooking/usePublicBooking";
import type { PublicBookingProps } from "@/components/PublicBooking/types";

export default function PublicBooking({ workspaceId }: PublicBookingProps) {
  const {
    services,
    selectedServiceId,
    date,
    slotTimezone,
    slots,
    selectedStartsAt,
    fieldValues,
    publicFlowConfig,
    loading,
    slotLoading,
    error,
    successMessage,
    onMetaChange,
    onFieldChange,
    onSubmit,
  } = usePublicBooking({ workspaceId });

  return (
    <PublicBookingUI
      workspaceId={workspaceId}
      services={services}
      selectedServiceId={selectedServiceId}
      date={date}
      slotTimezone={slotTimezone}
      slots={slots}
      selectedStartsAt={selectedStartsAt}
      fieldValues={fieldValues}
      publicFlowConfig={publicFlowConfig}
      loading={loading}
      slotLoading={slotLoading}
      error={error}
      successMessage={successMessage}
      onMetaChange={onMetaChange}
      onFieldChange={onFieldChange}
      onSubmit={onSubmit}
    />
  );
}
