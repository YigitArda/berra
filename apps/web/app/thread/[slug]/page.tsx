import { ThreadClient } from './thread-client';

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ThreadClient slug={slug} />;
}
