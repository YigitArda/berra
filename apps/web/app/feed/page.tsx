import { requireServerSession } from '../../lib/auth/server';
import { FeedClient } from './feed-client';

export default async function FeedPage() {
  await requireServerSession('/feed');

  return <FeedClient />;
}
