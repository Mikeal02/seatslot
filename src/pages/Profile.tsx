import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Save, Ticket, Calendar, Clock, Film, MapPin, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchProfileAndBookings();
    }
  }, [user, authLoading]);

  const fetchProfileAndBookings = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as ProfileType);
      setFullName(profileData.full_name || '');
      setPhone(profileData.phone || '');

      // Fetch bookings with related data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          showtime:showtimes(
            *,
            movie:movies(*),
            screen:screens(
              *,
              theatre:theatres(*)
            )
          ),
          booked_seats:booked_seats(
            *,
            seat:seats(*)
          )
        `)
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
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const totalSpent = bookings
    .filter(b => b.booking_status === 'confirmed')
    .reduce((sum, b) => sum + b.total_amount, 0);

  const totalTickets = bookings
    .filter(b => b.booking_status === 'confirmed')
    .reduce((sum, b) => sum + (b.booked_seats?.length || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border border-border">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary">
                {getInitials(fullName, profile?.email || user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold mb-1">
                {fullName || 'Welcome!'}
              </h1>
              <p className="text-muted-foreground mb-4">
                {profile?.email || user?.email}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
                  <Ticket className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Tickets</p>
                    <p className="font-bold">{totalTickets}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
                  <Film className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Movies Watched</p>
                    <p className="font-bold">{bookings.filter(b => b.booking_status === 'confirmed').length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
                  <span className="text-lg">₹</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="font-bold">₹{totalSpent.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="shrink-0">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile Settings</TabsTrigger>
              <TabsTrigger value="bookings">Booking History</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details here
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || user?.email || ''}
                        className="pl-10"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9999999999"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="cinema-gradient"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Booking History</CardTitle>
                  <CardDescription>
                    View all your past and upcoming bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start exploring movies and book your first ticket!
                      </p>
                      <Button asChild>
                        <Link to="/movies">Browse Movies</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-colors"
                        >
                          {booking.showtime?.movie?.poster_url && (
                            <img
                              src={booking.showtime.movie.poster_url}
                              alt={booking.showtime.movie.title}
                              className="w-20 h-28 object-cover rounded-md shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-lg">
                                {booking.showtime?.movie?.title || 'Unknown Movie'}
                              </h4>
                              <Badge 
                                variant={booking.booking_status === 'confirmed' ? 'default' : 'destructive'}
                              >
                                {booking.booking_status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {booking.showtime?.show_date 
                                    ? format(parseISO(booking.showtime.show_date), 'MMM d, yyyy')
                                    : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                  {booking.showtime?.show_time 
                                    ? format(parseISO(`2000-01-01T${booking.showtime.show_time}`), 'h:mm a')
                                    : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="truncate">
                                  {booking.showtime?.screen?.theatre?.name || 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Ticket className="h-3.5 w-3.5" />
                                <span>
                                  {booking.booked_seats?.map(bs => 
                                    `${bs.seat?.row_label}${bs.seat?.seat_number}`
                                  ).join(', ') || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                              <span className="text-xs text-muted-foreground">
                                Booked on {format(parseISO(booking.created_at), 'MMM d, yyyy')}
                              </span>
                              <span className="font-bold text-primary">
                                ₹{booking.total_amount}
                              </span>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            className="shrink-0 self-start sm:self-center"
                          >
                            <Link to={`/booking/confirmation/${booking.id}`}>
                              View Ticket
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
