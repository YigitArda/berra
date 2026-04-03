import { requireServerSession } from '../../lib/auth/server';
import { ForumClient } from './forum-client';

export default async function ForumPage() {
  await requireServerSession('/forum');
  return <ForumClient />;
}
