import { requireServerSession } from '../../lib/auth/server';
import { NotificationsClient } from './notifications-client';

export default async function NotificationsPage() {
  await requireServerSession('/notifications');

  return <NotificationsClient />;
}
