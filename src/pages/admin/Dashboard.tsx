import { useEffect, useState } from 'react';
import { Film, Ticket, Users, Building2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalMovies: number;
  nowShowingMovies: number;
  totalBookings: number;
  totalRevenue: number;
  totalTheatres: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [moviesRes, bookingsRes, theatresRes] = await Promise.all([
        supabase.from('movies').select('id, status'),
        supabase.from('bookings').select('id, total_amount, booking_status'),
        supabase.from('theatres').select('id'),
      ]);

      const movies = moviesRes.data || [];
      const bookings = bookingsRes.data || [];
      const theatres = theatresRes.data || [];

      const confirmedBookings = bookings.filter((b) => b.booking_status === 'confirmed');
      const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

      setStats({
        totalMovies: movies.length,
        nowShowingMovies: movies.filter((m) => m.status === 'now_showing').length,
        totalBookings: confirmedBookings.length,
        totalRevenue,
        totalTheatres: theatres.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Movies',
      value: stats?.totalMovies || 0,
      icon: Film,
      description: `${stats?.nowShowingMovies || 0} now showing`,
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: Ticket,
      description: 'Confirmed bookings',
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      description: 'From all bookings',
    },
    {
      title: 'Theatres',
      value: stats?.totalTheatres || 0,
      icon: Building2,
      description: 'Active theatres',
    },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Card key={card.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Welcome to CineBook Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Use the sidebar to manage movies, showtimes, and theatres. This admin panel allows you to:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Add, edit, and delete movies</li>
              <li>Create and manage showtimes</li>
              <li>Configure theatres and screens</li>
              <li>View booking statistics</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
