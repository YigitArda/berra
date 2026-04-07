import { TagClient } from './tag-client';

export default async function TagLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TagClient slug={slug} />;
}
