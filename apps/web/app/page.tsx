import Link from 'next/link';

export default async function HomePage() {
  let apiHealth: string;

  try {
    const res = await fetch('http://localhost:4000/api/health', { cache: 'no-store' });
    apiHealth = res.ok ? 'API erişilebilir' : 'API yanıtı başarısız';
  } catch {
    apiHealth = 'API erişimi yok (lokalde api çalışmıyor olabilir).';
  }

  return (
    <main style={{ maxWidth: 800, margin: '48px auto', padding: '0 16px', fontFamily: 'Inter, sans-serif' }}>
      <h1>Berra Next.js Migration</h1>
      <p>Bu uygulama, mevcut frontend&apos;in modüler TypeScript/Next.js geçiş başlangıcıdır.</p>
      <p><strong>Durum:</strong> {apiHealth}</p>
      <p><Link href="/login">Yeni auth akışını test et</Link></p>
      <p><Link href="/feed">Yeni feed akışını test et</Link></p>
    </main>
  );
}
