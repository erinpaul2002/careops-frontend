import AppShell from "@/components/AppShell";

export default function OwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell role="owner" basePath="/owner">
      {children}
    </AppShell>
  );
}
