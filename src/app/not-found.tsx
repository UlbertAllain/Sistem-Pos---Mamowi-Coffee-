import Link from 'next/link';

export default function NotFound() {
  return <main className="not-found"><span>404</span><h1>Halaman tidak ditemukan</h1><p>Alamat yang dibuka tidak tersedia pada scope POS.</p><Link href="/dashboard" className="button button-primary button-md">Kembali ke dashboard</Link></main>;
}
