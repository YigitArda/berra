import { requireServerSession } from '../../lib/auth/server';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  await requireServerSession('/dashboard');

  return <DashboardClient />;
}
