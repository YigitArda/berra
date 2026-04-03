import { requireServerSession } from '../../../lib/auth/server';
import { NewThreadClient } from './new-thread-client';

export default async function NewThreadPage() {
  await requireServerSession('/forum/new');
  return <NewThreadClient />;
}
