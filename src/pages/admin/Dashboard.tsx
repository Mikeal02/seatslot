import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Ticket, Users, Building2, TrendingUp, Calendar, Star, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, subDays, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

interface Stats {
  totalMovies: number;
  nowShowingMovies: number;
  totalBookings: number;
  totalRevenue: number;
  totalTheatres: number;
  totalUsers: number;
  avgRating: number;
  todayBookings: number;
}

interface DailyBooking {
  date: string;
  bookings: number;
  revenue: number;
}

interface GenreDistribution {
  name: string;
  value: number;
}

const CHART_COLORS = [
  'hsl(0, 84%, 60%)', 'hsl(43, 96%, 56%)', 'hsl(200, 70%, 50%)',
  'hsl(150, 60%, 45%)', 'hsl(280, 60%, 55%)', 'hsl(30, 80%, 55%)',
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyData, setDailyData] = useState<DailyBooking[]>([]);
  const [genreData, setGenreData] = useState<GenreDistribution[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [moviesRes, bookingsRes, theatresRes, profilesRes, reviewsRes] = await Promise.all([
        supabase.from('movies').select('id, status, genre, rating'),
        supabase.from('bookings').select('id, total_amount, booking_status, created_at, showtime_id'),
        supabase.from('theatres').select('id'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('rating'),
      ]);

      const movies = moviesRes.data || [];
      const bookings = bookingsRes.data || [];
      const theatres = theatresRes.data || [];
      const reviews = reviewsRes.data || [];

      const confirmedBookings = bookings.filter((b) => b.booking_status === 'confirmed');
      const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      const today = new Date().toISOString().split('T')[0];
      const todayBookings = confirmedBookings.filter(b => b.created_at.startsWith(today)).length;

      setStats({
        totalMovies: movies.length,
        nowShowingMovies: movies.filter((m) => m.status === 'now_showing').length,
        totalBookings: confirmedBookings.length,
        totalRevenue,
        totalTheatres: theatres.length,
        totalUsers: profilesRes.count || 0,
        avgRating: Math.round(avgRating * 10) / 10,
        todayBookings,
      });

      // Daily bookings for last 14 days
      const dailyMap: Record<string, { bookings: number; revenue: number }> = {};
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyMap[d] = { bookings: 0, revenue: 0 };
      }
      confirmedBookings.forEach(b => {
        const d = b.created_at.split('T')[0];
        if (dailyMap[d]) {
          dailyMap[d].bookings++;
          dailyMap[d].revenue += Number(b.total_amount);
        }
      });
      setDailyData(Object.entries(dailyMap).map(([date, data]) => ({
        date: format(parseISO(date), 'MMM d'),
        ...data,
      })));

      // Genre distribution
      const genreCounts: Record<string, number> = {};
      movies.forEach(m => {
        (m.genre || []).forEach((g: string) => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      });
      setGenreData(
        Object.entries(genreCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name, value }))
      );

      // Recent bookings
      const recent = confirmedBookings
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 5);
      setRecentBookings(recent);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Movies', value: stats?.totalMovies || 0, icon: Film, description: `${stats?.nowShowingMovies || 0} now showing`, color: 'text-primary' },
    { title: 'Total Bookings', value: stats?.totalBookings || 0, icon: Ticket, description: `${stats?.todayBookings || 0} today`, color: 'text-accent' },
    { title: 'Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, description: 'Total revenue', color: 'text-green-500' },
    { title: 'Theatres', value: stats?.totalTheatres || 0, icon: Building2, description: 'Active theatres', color: 'text-blue-500' },
    { title: 'Users', value: stats?.totalUsers || 0, icon: Users, description: 'Registered users', color: 'text-purple-500' },
    { title: 'Avg Rating', value: stats?.avgRating || 0, icon: Star, description: `From ${stats?.totalBookings || 0} reviews`, color: 'text-yellow-500' },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your cinema operations</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3" />
          Live
        </Badge>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <Card className="bg-card border-border hover:border-primary/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-5">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${card.color}`} />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-5">
                <div className="text-lg sm:text-2xl font-bold">{card.value}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-card border-border">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Revenue Trend (14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-4 pb-4">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(240 6% 8%)', border: '1px solid hsl(240 4% 16%)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'hsl(0 0% 98%)' }}
                    itemStyle={{ color: 'hsl(0 84% 60%)' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(0, 84%, 60%)" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bookings Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-card border-border">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Ticket className="h-4 w-4 text-accent" />
                Daily Bookings (14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-4 pb-4">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(240 6% 8%)', border: '1px solid hsl(240 4% 16%)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'hsl(0 0% 98%)' }}
                  />
                  <Bar dataKey="bookings" fill="hsl(43, 96%, 56%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Genre Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="bg-card border-border">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base">Genre Distribution</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-4 pb-4">
              {genreData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={genreData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {genreData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No genre data available</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {recentBookings.length > 0 ? (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div>
                        <p className="text-sm font-medium">Booking #{booking.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(booking.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">₹{Number(booking.total_amount).toLocaleString()}</p>
                        <Badge variant="outline" className="text-[10px]">{booking.booking_status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No recent bookings</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Occupancy Rates */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
        <Card className="bg-card border-border">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Manage Movies', href: '/admin/movies', icon: Film },
                { label: 'Manage Showtimes', href: '/admin/showtimes', icon: Calendar },
                { label: 'Manage Theatres', href: '/admin/theatres', icon: Building2 },
                { label: 'View Analytics', href: '#', icon: TrendingUp },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all text-center"
                >
                  <action.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">{action.label}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
