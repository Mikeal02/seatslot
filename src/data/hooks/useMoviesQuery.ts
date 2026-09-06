import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { qk, staleTime } from "@/data/queryKeys";
import { moviesRepository } from "@/data/repositories/movies.repo";
import {
  buildCatalogue,
  EMPTY_CATALOGUE,
  type MovieCatalogue,
} from "@/data/models/movie";
import type { Movie } from "@/types/database";

/** Raw catalogue rows, seeded from the offline cache for an instant paint. */
export function useMovies() {
  return useQuery<Movie[]>({
    queryKey: qk.movies.list(),
    queryFn: () => moviesRepository.list(),
    staleTime: staleTime.static,
    initialData: () => moviesRepository.cached() ?? undefined,
    initialDataUpdatedAt: 0, // cached rows are stale on arrival → refetch in background
  });
}

/**
 * The catalogue with every derived slice (now showing, coming soon, spotlight,
 * genres) computed once and memoised.
 */
export function useMovieCatalogue(): {
  catalogue: MovieCatalogue;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
} {
  const { data, isLoading, isFetching, error } = useMovies();
  const catalogue = useMemo(
    () => (data?.length ? buildCatalogue(data) : EMPTY_CATALOGUE),
    [data],
  );
  return { catalogue, isLoading: isLoading && !data?.length, isFetching, error };
}

export function useMovie(id: string | undefined) {
  return useQuery<Movie | null>({
    queryKey: qk.movies.byId(id ?? ""),
    queryFn: () => moviesRepository.byId(id as string),
    enabled: Boolean(id),
    staleTime: staleTime.static,
  });
}

export function useInvalidateMovies() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: qk.movies.all });
}
