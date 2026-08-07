import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk, staleTime } from '@/data/queryKeys';
import { reviewsRepository, type MovieReview } from '@/data/repositories/reviews.repo';

export function useMovieReviews(movieId: string) {
  return useQuery<MovieReview[]>({
    queryKey: qk.reviews.byMovie(movieId),
    queryFn: () => reviewsRepository.listForMovie(movieId),
    enabled: Boolean(movieId),
    staleTime: staleTime.session,
  });
}

export function useInvalidateMovieReviews(movieId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: qk.reviews.byMovie(movieId) });
}
