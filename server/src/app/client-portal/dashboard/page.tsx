import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { getDashboardMetrics, getRecentActivity, type RecentActivity } from '@/lib/actions/dashboard';
import { DashboardActions } from '@/components/dashboard/DashboardActions';

export default async function Dashboard() {
  try {
    const [metrics, activities] = await Promise.all([
      getDashboardMetrics(),
      getRecentActivity()
    ]);

    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--color-text-900))]">Dashboard</h1>
          <p className="mt-1 text-sm text-[rgb(var(--color-text-600))]">
            Welcome back! Here's an overview of your account.
          </p>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card>
            <CardContent className="p-8">
              <div className="text-sm font-medium text-[rgb(var(--color-text-600))] truncate">
                Open Support Tickets
              </div>
              <div className="mt-2 text-4xl font-bold text-[rgb(var(--color-primary-500))]">
                {metrics.openTickets}
              </div>
              <div className="mt-4">
                <a href="/client-portal/tickets" className="text-[rgb(var(--color-primary-500))] hover:text-[rgb(var(--color-primary-600))] text-sm font-medium">
                  View all tickets →
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="text-sm font-medium text-[rgb(var(--color-text-600))] truncate">
                Pending Invoices
              </div>
              <div className="mt-2 text-4xl font-bold text-[rgb(var(--color-secondary-500))]">
                {metrics.pendingInvoices}
              </div>
              <div className="mt-4">
                <a href="/client-portal/billing" className="text-[rgb(var(--color-secondary-500))] hover:text-[rgb(var(--color-secondary-600))] text-sm font-medium">
                  View billing →
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="text-sm font-medium text-[rgb(var(--color-text-600))] truncate">
                Active Assets
              </div>
              <div className="mt-2 text-4xl font-bold text-[rgb(var(--color-accent-500))]">
                {metrics.activeAssets}
              </div>
              <div className="mt-4">
                <a href="/client-portal/assets" className="text-[rgb(var(--color-accent-500))] hover:text-[rgb(var(--color-accent-600))] text-sm font-medium">
                  View assets →
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {activities.map((activity: RecentActivity, index: number): JSX.Element => {
                let borderColor = 'border-[rgb(var(--color-primary-500))]';
                let bgColor = 'bg-[rgb(var(--color-primary-50))]';
                let textColor = 'text-[rgb(var(--color-primary-700))]';
                let timeColor = 'text-[rgb(var(--color-primary-500))]';

                if (activity.type === 'invoice') {
                  borderColor = 'border-[rgb(var(--color-secondary-400))]';
                  bgColor = 'bg-[rgb(var(--color-secondary-50))]';
                  textColor = 'text-[rgb(var(--color-secondary-700))]';
                  timeColor = 'text-[rgb(var(--color-secondary-500))]';
                } else if (activity.type === 'asset') {
                  borderColor = 'border-[rgb(var(--color-accent-500))]';
                  bgColor = 'bg-[rgb(var(--color-accent-50))]';
                  textColor = 'text-[rgb(var(--color-accent-700))]';
                  timeColor = 'text-[rgb(var(--color-accent-500))]';
                }

                return (
                  <div
                    key={`${activity.type}-${index}`}
                    className={`border-l-4 ${borderColor} ${bgColor} p-4 rounded-r-lg`}
                  >
                    <div className="flex">
                      <div className="ml-3">
                        <p className={`text-sm ${textColor}`}>
                          {activity.title}
                        </p>
                        <p className={`mt-1 text-xs ${timeColor}`}>
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardActions />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-[rgb(var(--color-text-700))]">
              <p>There was an error loading the dashboard. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
