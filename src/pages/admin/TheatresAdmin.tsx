import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Theatre, Screen } from '@/types/database';

interface TheatreWithScreens extends Theatre {
  screens: Screen[];
}

export default function TheatresAdmin() {
  const { toast } = useToast();
  const [theatres, setTheatres] = useState<TheatreWithScreens[]>([]);
  const [loading, setLoading] = useState(true);
  const [theatreDialogOpen, setTheatreDialogOpen] = useState(false);
  const [screenDialogOpen, setScreenDialogOpen] = useState(false);
  const [editingTheatre, setEditingTheatre] = useState<Theatre | null>(null);
  const [selectedTheatreId, setSelectedTheatreId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Theatre form
  const [theatreName, setTheatreName] = useState('');
  const [theatreLocation, setTheatreLocation] = useState('');
  const [theatreCity, setTheatreCity] = useState('');

  // Screen form
  const [screenName, setScreenName] = useState('');
  const [totalRows, setTotalRows] = useState('10');
  const [seatsPerRow, setSeatsPerRow] = useState('15');

  useEffect(() => {
    fetchTheatres();
  }, []);

  const fetchTheatres = async () => {
    try {
      const { data, error } = await supabase
        .from('theatres')
        .select('*, screens(*)')
        .order('name');

      if (error) throw error;
      setTheatres(data as TheatreWithScreens[]);
    } catch (error) {
      console.error('Error fetching theatres:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetTheatreForm = () => {
    setTheatreName('');
    setTheatreLocation('');
    setTheatreCity('');
    setEditingTheatre(null);
  };

  const resetScreenForm = () => {
    setScreenName('');
    setTotalRows('10');
    setSeatsPerRow('15');
    setSelectedTheatreId(null);
  };

  const openEditTheatreDialog = (theatre: Theatre) => {
    setEditingTheatre(theatre);
    setTheatreName(theatre.name);
    setTheatreLocation(theatre.location);
    setTheatreCity(theatre.city);
    setTheatreDialogOpen(true);
  };

  const handleSaveTheatre = async () => {
    if (!theatreName.trim() || !theatreLocation.trim() || !theatreCity.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all fields.',
      });
      return;
    }

    setSaving(true);

    const theatreData = {
      name: theatreName.trim(),
      location: theatreLocation.trim(),
      city: theatreCity.trim(),
    };

    try {
      if (editingTheatre) {
        const { error } = await supabase
          .from('theatres')
          .update(theatreData)
          .eq('id', editingTheatre.id);

        if (error) throw error;
        toast({ title: 'Theatre updated successfully' });
      } else {
        const { error } = await supabase.from('theatres').insert(theatreData);

        if (error) throw error;
        toast({ title: 'Theatre added successfully' });
      }

      setTheatreDialogOpen(false);
      resetTheatreForm();
      fetchTheatres();
    } catch (error: any) {
      console.error('Error saving theatre:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save theatre.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTheatre = async (theatreId: string) => {
    try {
      const { error } = await supabase.from('theatres').delete().eq('id', theatreId);

      if (error) throw error;
      toast({ title: 'Theatre deleted successfully' });
      fetchTheatres();
    } catch (error: any) {
      console.error('Error deleting theatre:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete theatre.',
      });
    }
  };

  const handleAddScreen = async () => {
    if (!screenName.trim() || !selectedTheatreId) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all fields.',
      });
      return;
    }

    setSaving(true);

    try {
      // Create screen
      const { data: screenData, error: screenError } = await supabase
        .from('screens')
        .insert({
          theatre_id: selectedTheatreId,
          name: screenName.trim(),
          total_rows: parseInt(totalRows) || 10,
          seats_per_row: parseInt(seatsPerRow) || 15,
        })
        .select()
        .single();

      if (screenError) throw screenError;

      // Generate seats for the screen
      const rows = parseInt(totalRows) || 10;
      const seatsCount = parseInt(seatsPerRow) || 15;
      const seats = [];

      for (let row = 1; row <= rows; row++) {
        for (let seat = 1; seat <= seatsCount; seat++) {
          const rowLabel = String.fromCharCode(64 + row); // A, B, C, etc.
          let seatType: 'regular' | 'premium' | 'vip' = 'regular';
          let price = 150;

          if (row <= 3) {
            seatType = 'regular';
            price = 150;
          } else if (row <= Math.floor(rows * 0.7)) {
            seatType = 'premium';
            price = 250;
          } else {
            seatType = 'vip';
            price = 400;
          }

          seats.push({
            screen_id: screenData.id,
            row_label: rowLabel,
            seat_number: seat,
            seat_type: seatType,
            price,
          });
        }
      }

      const { error: seatsError } = await supabase.from('seats').insert(seats);

      if (seatsError) throw seatsError;

      toast({ title: 'Screen added successfully with seats' });
      setScreenDialogOpen(false);
      resetScreenForm();
      fetchTheatres();
    } catch (error: any) {
      console.error('Error adding screen:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add screen.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScreen = async (screenId: string) => {
    try {
      const { error } = await supabase.from('screens').delete().eq('id', screenId);

      if (error) throw error;
      toast({ title: 'Screen deleted successfully' });
      fetchTheatres();
    } catch (error: any) {
      console.error('Error deleting screen:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete screen.',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Theatres & Screens</h1>
        <Dialog open={theatreDialogOpen} onOpenChange={(open) => {
          setTheatreDialogOpen(open);
          if (!open) resetTheatreForm();
        }}>
          <DialogTrigger asChild>
            <Button className="cinema-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Add Theatre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTheatre ? 'Edit Theatre' : 'Add New Theatre'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="theatreName">Theatre Name *</Label>
                <Input
                  id="theatreName"
                  value={theatreName}
                  onChange={(e) => setTheatreName(e.target.value)}
                  placeholder="e.g., CinePlex Central"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theatreLocation">Location *</Label>
                <Input
                  id="theatreLocation"
                  value={theatreLocation}
                  onChange={(e) => setTheatreLocation(e.target.value)}
                  placeholder="e.g., 123 Main Street"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theatreCity">City *</Label>
                <Input
                  id="theatreCity"
                  value={theatreCity}
                  onChange={(e) => setTheatreCity(e.target.value)}
                  placeholder="e.g., Mumbai"
                />
              </div>
              <Button onClick={handleSaveTheatre} disabled={saving} className="cinema-gradient">
                {saving ? 'Saving...' : editingTheatre ? 'Update Theatre' : 'Add Theatre'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Screen Dialog */}
      <Dialog open={screenDialogOpen} onOpenChange={(open) => {
        setScreenDialogOpen(open);
        if (!open) resetScreenForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Screen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="screenName">Screen Name *</Label>
              <Input
                id="screenName"
                value={screenName}
                onChange={(e) => setScreenName(e.target.value)}
                placeholder="e.g., Screen 1 - IMAX"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalRows">Total Rows</Label>
                <Input
                  id="totalRows"
                  type="number"
                  value={totalRows}
                  onChange={(e) => setTotalRows(e.target.value)}
                  min="1"
                  max="26"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seatsPerRow">Seats per Row</Label>
                <Input
                  id="seatsPerRow"
                  type="number"
                  value={seatsPerRow}
                  onChange={(e) => setSeatsPerRow(e.target.value)}
                  min="1"
                  max="30"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Seats will be automatically generated with Regular, Premium, and VIP sections.
            </p>
            <Button onClick={handleAddScreen} disabled={saving} className="cinema-gradient">
              {saving ? 'Saving...' : 'Add Screen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {theatres.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No theatres yet</h2>
          <p className="text-muted-foreground mb-6">
            Add your first theatre to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {theatres.map((theatre) => (
            <Card key={theatre.id} className="bg-card border-border">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {theatre.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {theatre.location}, {theatre.city}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTheatreId(theatre.id);
                      setScreenDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Screen
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditTheatreDialog(theatre)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Theatre?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{theatre.name}" and all its screens.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTheatre(theatre.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                {theatre.screens.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No screens added yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Screen</TableHead>
                        <TableHead>Rows</TableHead>
                        <TableHead>Seats/Row</TableHead>
                        <TableHead>Total Seats</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {theatre.screens.map((screen) => (
                        <TableRow key={screen.id}>
                          <TableCell className="font-medium">{screen.name}</TableCell>
                          <TableCell>{screen.total_rows}</TableCell>
                          <TableCell>{screen.seats_per_row}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {screen.total_rows * screen.seats_per_row} seats
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Screen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{screen.name}" and all its seats.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteScreen(screen.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
