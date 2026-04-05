import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Save, Ticket, Calendar, Clock, Film, MapPin, LogOut, Star, TrendingUp, Crown, ChevronRight, Award, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import { PointsHistory } from '@/components/loyalty/PointsHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Profile as ProfileType, Booking } from '@/types/database';
import { format, parseISO } from 'date-fns';

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth'); return; }
    if (user) fetchProfileAndBookings();
  }, [user, authLoading]);

  const fetchProfileAndBookings = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles').select('*').eq('user_id', user!.id).single();
      if (profileError) throw profileError;
      setProfile(profileData as ProfileType);
      setFullName(profileData.full_name || '');
      setPhone(profileData.phone || '');

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`*, showtime:showtimes(*, movie:movies(*), screen:screens(*, theatre:theatres(*))), booked_seats:booked_seats(*, seat:seats(*))`)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (bookingsError) throw bookingsError;
      setBookings(bookingsData as Booking[]);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('user_id', user!.id);
      if (error) throw error;
      toast({ title: 'Profile updated', description: 'Your profile has been updated successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  const confirmedBookings = bookings.filter(b => b.booking_status === 'confirmed');
  const totalSpent = confirmedBookings.reduce((sum, b) => sum + b.total_amount, 0);
  const totalTickets = confirmedBookings.reduce((sum, b) => sum + (b.booked_seats?.length || 0), 0);
  const uniqueMovies = new Set(confirmedBookings.map(b => b.showtime?.movie?.title)).size;

  // Favorite genre calculation
  const genreCounts: Record<string, number> = {};
  confirmedBookings.forEach(b => {
    b.showtime?.movie?.genre?.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
  });
  const favoriteGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Determine member tier based on total spent
  const getTier = () => {
    if (totalSpent >= 10000) return { name: 'Platinum', color: 'from-purple-500 to-pink-500', icon: Crown, progress: 100 };
    if (totalSpent >= 5000) return { name: 'Gold', color: 'from-amber-500 to-orange-500', icon: Award, progress: (totalSpent / 10000) * 100 };
    if (totalSpent >= 1000) return { name: 'Silver', color: 'from-slate-400 to-slate-300', icon: Star, progress: (totalSpent / 5000) * 100 };
    return { name: 'Bronze', color: 'from-amber-700 to-amber-600', icon: Sparkles, progress: (totalSpent / 1000) * 100 };
  };
  const tier = getTier();
  const TierIcon = tier.icon;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-10">
        <div className="max-w-5xl mx-auto">
          {/* Cinematic Profile Hero */}
          <motion.div 
            className="relative overflow-hidden rounded-3xl mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Gradient background */}
            <div className="absolute inset-0 cinema-gradient opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(0_0%_100%/0.15)_0%,transparent_60%)]" />
            <div className="absolute inset-0 noise-overlay pointer-events-none" />

            <div className="relative p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar with tier ring */}
                <div className="relative">
                  <div className={`absolute -inset-1 rounded-full bg-gradient-to-br ${tier.color} opacity-60 blur-sm`} />
                  <Avatar className="relative h-24 w-24 sm:h-28 sm:w-28 border-4 border-white/20 shadow-2xl">
                    <AvatarFallback className="text-3xl font-black bg-background/20 text-white backdrop-blur-sm">
                      {getInitials(fullName, profile?.email || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg border-2 border-white/20`}>
                    <TierIcon className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* User info */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {fullName || 'Welcome, Cinephile!'}
                  </h1>
                  <p className="text-white/70 text-sm mt-1">{profile?.email || user?.email}</p>

                  {/* Tier badge */}
                  <div className="mt-3 flex items-center gap-3 justify-center sm:justify-start">
                    <Badge className={`bg-gradient-to-r ${tier.color} text-white border-0 px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-lg`}>
                      <TierIcon className="h-3 w-3 mr-1.5" />
                      {tier.name} Member
                    </Badge>
                    <span className="text-white/50 text-xs">Since {profile ? format(parseISO(profile.created_at), 'MMM yyyy') : ''}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={handleSignOut} 
                  className="shrink-0 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>

              {/* Tier progress */}
              <div className="mt-6 max-w-sm mx-auto sm:mx-0">
                <div className="flex justify-between text-[10px] text-white/60 mb-1.5 uppercase tracking-wider font-medium">
                  <span>{tier.name}</span>
                  <span>{tier.name === 'Platinum' ? 'Max Tier' : `Next: ${totalSpent >= 5000 ? 'Platinum' : totalSpent >= 1000 ? 'Gold' : 'Silver'}`}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${tier.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(tier.progress, 100)}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[
              { label: 'Total Tickets', value: totalTickets, icon: Ticket, color: 'text-primary', delay: 0.1 },
              { label: 'Movies Watched', value: uniqueMovies, icon: Film, color: 'text-accent', delay: 0.2 },
              { label: 'Fav Genre', value: favoriteGenre, icon: Star, color: 'text-primary', delay: 0.3 },
              { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: TrendingUp, color: 'text-accent', delay: 0.4 },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: stat.delay, duration: 0.4 }}
              >
                <Card className="bg-card border-border/30 glow-card hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
                        <p className="text-lg sm:text-xl font-black tracking-tight">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="bg-card border border-border/40 p-1 rounded-xl w-full sm:w-auto">
              <TabsTrigger value="bookings" className="rounded-lg text-xs sm:text-sm font-medium">
                <Ticket className="h-4 w-4 mr-1.5" />Bookings
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-lg text-xs sm:text-sm font-medium">
                <User className="h-4 w-4 mr-1.5" />Profile
              </TabsTrigger>
              <TabsTrigger value="rewards" className="rounded-lg text-xs sm:text-sm font-medium">
                <Award className="h-4 w-4 mr-1.5" />Rewards
              </TabsTrigger>
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              {bookings.length === 0 ? (
                <Card className="bg-card border-border/30">
                  <CardContent className="py-16 text-center">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Ticket className="h-10 w-10 text-primary/40" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                      Start exploring movies and book your first ticket for an unforgettable cinematic experience!
                    </p>
                    <Button asChild className="cinema-gradient btn-professional rounded-full px-6">
                      <Link to="/movies">Browse Movies</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking, i) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link to={`/booking/confirmation/${booking.id}`} className="block group">
                        <Card className="bg-card border-border/30 hover:border-primary/20 transition-all duration-300 glow-card overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row">
                              {/* Movie poster */}
                              {booking.showtime?.movie?.poster_url && (
                                <div className="relative sm:w-28 h-32 sm:h-auto overflow-hidden shrink-0">
                                  <img
                                    src={booking.showtime.movie.poster_url}
                                    alt={booking.showtime.movie.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card sm:block hidden" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent sm:hidden" />
                                </div>
                              )}

                              {/* Booking details */}
                              <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                                <div>
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <h4 className="font-bold text-base sm:text-lg tracking-tight group-hover:text-primary transition-colors">
                                      {booking.showtime?.movie?.title || 'Unknown Movie'}
                                    </h4>
                                    <Badge 
                                      variant={booking.booking_status === 'confirmed' ? 'default' : 'destructive'}
                                      className={booking.booking_status === 'confirmed' ? 'cinema-gradient border-0 text-primary-foreground text-[10px] shrink-0' : 'shrink-0 text-[10px]'}
                                    >
                                      {booking.booking_status === 'confirmed' ? '✓ Confirmed' : 'Cancelled'}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-3 w-3 text-primary/60" />
                                      <span>{booking.showtime?.show_date ? format(parseISO(booking.showtime.show_date), 'MMM d, yyyy') : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3 w-3 text-primary/60" />
                                      <span>{booking.showtime?.show_time ? format(parseISO(`2000-01-01T${booking.showtime.show_time}`), 'h:mm a') : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3 w-3 text-primary/60" />
                                      <span className="truncate">{booking.showtime?.screen?.theatre?.name || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Ticket className="h-3 w-3 text-primary/60" />
                                      <span className="truncate">{booking.booked_seats?.map(bs => `${bs.seat?.row_label}${bs.seat?.seat_number}`).join(', ') || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                                  <span className="text-[10px] text-muted-foreground">
                                    {format(parseISO(booking.created_at), 'MMM d, yyyy • h:mm a')}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-base cinema-gradient-text">₹{booking.total_amount}</span>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="bg-card border-border/30 glow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg cinema-gradient flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    Personal Information
                  </CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" value={profile?.email || user?.email || ''} className="pl-10 bg-muted/30" disabled />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="pl-10 input-professional" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9999999999" className="pl-10 input-professional" />
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="cinema-gradient btn-professional rounded-xl px-6">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="space-y-6">
              <LoyaltyCard />
              <PointsHistory />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}
