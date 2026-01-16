import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useWishlist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('movie_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setWishlist(data.map(w => w.movie_id));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const isInWishlist = (movieId: string) => wishlist.includes(movieId);

  const toggleWishlist = async (movieId: string, movieTitle?: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add movies to your wishlist.',
      });
      return false;
    }

    setLoading(true);
    try {
      if (isInWishlist(movieId)) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movieId);

        if (error) throw error;
        setWishlist(prev => prev.filter(id => id !== movieId));
        toast({
          title: 'Removed from wishlist',
          description: movieTitle ? `${movieTitle} removed from your wishlist.` : 'Movie removed from wishlist.',
        });
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({ user_id: user.id, movie_id: movieId });

        if (error) throw error;
        setWishlist(prev => [...prev, movieId]);
        toast({
          title: 'Added to wishlist',
          description: movieTitle ? `${movieTitle} added to your wishlist.` : 'Movie added to wishlist.',
        });
      }
      return true;
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update wishlist.',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { wishlist, isInWishlist, toggleWishlist, loading, fetchWishlist };
}
