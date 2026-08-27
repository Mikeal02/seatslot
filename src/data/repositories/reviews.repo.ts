import { supabase } from "@/integrations/supabase/client";

export interface MovieReview {
  id: string;
  movie_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  author_name: string;
  is_mine: boolean;
}

export const reviewsRepository = {
  /** Reads go through the sanitised RPC so reviewer identities stay private. */
  async listForMovie(movieId: string): Promise<MovieReview[]> {
    const { data, error } = await supabase.rpc("get_movie_reviews", {
      p_movie_id: movieId,
    });
    if (error) throw error;
    return (data || []) as MovieReview[];
  },

  async create(input: {
    userId: string;
    movieId: string;
    rating: number;
    text: string | null;
  }) {
    const { error } = await supabase.from("reviews").insert({
      user_id: input.userId,
      movie_id: input.movieId,
      rating: input.rating,
      review_text: input.text,
    });
    if (error) throw error;
  },

  async update(
    reviewId: string,
    input: { rating: number; text: string | null },
  ) {
    const { error } = await supabase
      .from("reviews")
      .update({ rating: input.rating, review_text: input.text })
      .eq("id", reviewId);
    if (error) throw error;
  },

  async remove(reviewId: string) {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);
    if (error) throw error;
  },
};
