import { ModelClient } from './model-client';

export function generateStaticParams() {
  return [];
}

export default async function ModelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ModelClient slug={slug} />;
}
