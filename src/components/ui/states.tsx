import { LoaderCircle, PackageOpen, TriangleAlert } from 'lucide-react';

export function LoadingState({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="state-panel">
      <LoaderCircle className="spin" size={24} />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="state-panel">
      <PackageOpen size={28} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="state-panel state-error">
      <TriangleAlert size={28} />
      <strong>Terjadi kesalahan</strong>
      <p>{message}</p>
    </div>
  );
}
