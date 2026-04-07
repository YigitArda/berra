import { ModelClient } from './model-client';

export default async function ModelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ModelClient slug={slug} />;
}
