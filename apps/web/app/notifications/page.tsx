'use client';

export default async function NotificationsPage() {
  await requireServerSession('/notifications');

  return <NotificationsClient />;
}
