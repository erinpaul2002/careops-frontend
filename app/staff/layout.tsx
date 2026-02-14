import AppShell from "@/components/AppShell";

export default function StaffLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell role="staff" basePath="/staff">
      {children}
    </AppShell>
  );
}
