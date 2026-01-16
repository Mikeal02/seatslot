import { useState, useEffect } from 'react';
import { Star, User, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface Review {
  id: string;
  user_id: string;
  movie_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

interface MovieReviewsProps {
  movieId: string;
}

export function MovieReviews({ movieId }: MovieReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [movieId, user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile info for each review
      const reviewsWithProfiles = await Promise.all(
        (data as Review[]).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', review.user_id)
            .single();
          return { ...review, profile };
        })
      );

      setReviews(reviewsWithProfiles);

      // Find user's review
      if (user) {
        const myReview = reviewsWithProfiles.find(r => r.user_id === user.id);
        if (myReview) {
          setUserReview(myReview);
          setRating(myReview.rating);
          setReviewText(myReview.review_text || '');
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to leave a review.',
      });
      return;
    }

    if (rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Rating required',
        description: 'Please select a star rating.',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({ rating, review_text: reviewText || null })
          .eq('id', userReview.id);

        if (error) throw error;
        toast({ title: 'Review updated' });
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert({
            user_id: user.id,
            movie_id: movieId,
            rating,
            review_text: reviewText || null,
          });

        if (error) throw error;
        toast({ title: 'Review submitted' });
      }

      setIsEditing(false);
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit review.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userReview) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', userReview.id);

      if (error) throw error;

      setUserReview(null);
      setRating(0);
      setReviewText('');
      setIsEditing(false);
      toast({ title: 'Review deleted' });
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete review.',
      });
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const StarRating = ({ value, interactive = false }: { value: number; interactive?: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= (interactive ? (hoverRating || value) : value)
                ? 'fill-accent text-accent'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Reviews
            {averageRating && (
              <span className="text-sm font-normal text-muted-foreground">
                ({averageRating} avg • {reviews.length} reviews)
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Write/Edit Review Form */}
        {user && (isEditing || !userReview) && (
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
            <h4 className="font-medium">
              {userReview ? 'Edit Your Review' : 'Write a Review'}
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Your rating</p>
              <StarRating value={rating} interactive />
            </div>
            <Textarea
              placeholder="Share your thoughts about this movie... (optional)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
              </Button>
              {userReview && (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* User's existing review */}
        {user && userReview && !isEditing && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Your Review</span>
                <StarRating value={userReview.rating} />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-1" /> Edit
              </Button>
            </div>
            {userReview.review_text && (
              <p className="text-sm text-muted-foreground">{userReview.review_text}</p>
            )}
          </div>
        )}

        {/* Reviews List */}
        {reviews.filter(r => r.user_id !== user?.id).length === 0 && !userReview ? (
          <p className="text-center text-muted-foreground py-8">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews
              .filter(r => r.user_id !== user?.id)
              .map((review) => (
                <div key={review.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {review.profile?.full_name?.[0] || review.profile?.email?.[0] || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {review.profile?.full_name || 'Anonymous'}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <StarRating value={review.rating} />
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground pt-1">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
