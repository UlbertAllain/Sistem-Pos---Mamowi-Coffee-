export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-espresso-950 via-espresso-900 to-espresso-800 px-4">
      {children}
    </div>
  );
}
