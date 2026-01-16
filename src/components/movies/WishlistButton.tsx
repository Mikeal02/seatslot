import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  movieId: string;
  movieTitle?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
}

export function WishlistButton({ 
  movieId, 
  movieTitle, 
  size = 'icon', 
  variant = 'ghost',
  className 
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist, loading } = useWishlist();
  const inWishlist = isInWishlist(movieId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(movieId, movieTitle);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'transition-all',
        inWishlist && 'text-red-500 hover:text-red-600',
        className
      )}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-all',
          inWishlist && 'fill-current'
        )}
      />
    </Button>
  );
}
