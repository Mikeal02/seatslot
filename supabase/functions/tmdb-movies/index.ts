import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  runtime?: number;
  budget?: number;
  revenue?: number;
  tagline?: string;
  original_language?: string;
  popularity?: number;
  production_companies?: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  genres?: { id: number; name: string }[];
  belongs_to_collection?: { id: number; name: string; poster_path: string | null; backdrop_path: string | null } | null;
  credits?: {
    cast: { name: string; character: string; profile_path: string | null; order: number }[];
    crew: { name: string; job: string; department: string; profile_path: string | null }[];
  };
  videos?: {
    results: { key: string; site: string; type: string; official: boolean }[];
  };
  similar?: {
    results: TMDBMovie[];
  };
  recommendations?: {
    results: TMDBMovie[];
  };
}

async function fetchFromTMDB(endpoint: string): Promise<any> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured');
  }
  
  const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
  console.log(`Fetching from TMDB: ${endpoint}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`TMDB API error: ${response.status} - ${errorText}`);
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json();
}

function getTrailerKey(videos?: TMDBMovie['videos']): string | null {
  if (!videos?.results?.length) return null;
  
  const officialTrailer = videos.results.find(
    v => v.site === 'YouTube' && v.type === 'Trailer' && v.official
  );
  if (officialTrailer) return officialTrailer.key;
  
  const anyTrailer = videos.results.find(
    v => v.site === 'YouTube' && v.type === 'Trailer'
  );
  if (anyTrailer) return anyTrailer.key;
  
  const anyYouTube = videos.results.find(v => v.site === 'YouTube');
  return anyYouTube?.key || null;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function transformMovie(movie: TMDBMovie, includeDetails = false) {
  const base = {
    tmdb_id: movie.id,
    title: movie.title,
    description: movie.overview,
    poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE}/w500${movie.poster_path}` : null,
    backdrop_url: movie.backdrop_path ? `${TMDB_IMAGE_BASE}/original${movie.backdrop_path}` : null,
    release_date: movie.release_date,
    rating: Math.round(movie.vote_average * 10) / 10,
    popularity: movie.popularity || 0,
    budget: movie.budget || 0,
    revenue: movie.revenue || 0,
    original_language: movie.original_language || 'en',
  };

  if (includeDetails) {
    const director = movie.credits?.crew.find(c => c.job === 'Director');
    const writers = movie.credits?.crew
      .filter(c => c.department === 'Writing')
      .slice(0, 3)
      .map(c => c.name) || [];
    const cast = movie.credits?.cast
      .sort((a, b) => a.order - b.order)
      .slice(0, 15)
      .map(c => c.name) || [];
    const castWithPhotos = movie.credits?.cast
      .sort((a, b) => a.order - b.order)
      .slice(0, 15)
      .map(c => ({
        name: c.name,
        character: c.character,
        photo: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : null,
      })) || [];
    const genres = movie.genres?.map(g => g.name) || [];
    const trailerKey = getTrailerKey(movie.videos);
    const productionCompanies = movie.production_companies?.map(c => c.name) || [];

    // Similar movies
    const similarMovies = movie.similar?.results?.slice(0, 8).map(m => transformMovie(m)) || [];
    const recommendedMovies = movie.recommendations?.results?.slice(0, 8).map(m => transformMovie(m)) || [];

    // Collection info
    const collection = movie.belongs_to_collection ? {
      id: movie.belongs_to_collection.id,
      name: movie.belongs_to_collection.name,
      poster_url: movie.belongs_to_collection.poster_path 
        ? `${TMDB_IMAGE_BASE}/w500${movie.belongs_to_collection.poster_path}` : null,
      backdrop_url: movie.belongs_to_collection.backdrop_path
        ? `${TMDB_IMAGE_BASE}/original${movie.belongs_to_collection.backdrop_path}` : null,
    } : null;

    return {
      ...base,
      tagline: movie.tagline || null,
      duration_minutes: movie.runtime || 120,
      genre: genres,
      director: director?.name || null,
      writers,
      cast_members: cast,
      cast_details: castWithPhotos,
      trailer_key: trailerKey,
      production_companies: productionCompanies,
      budget_formatted: movie.budget ? formatCurrency(movie.budget) : null,
      revenue_formatted: movie.revenue ? formatCurrency(movie.revenue) : null,
      profit: movie.revenue && movie.budget ? movie.revenue - movie.budget : null,
      profit_formatted: movie.revenue && movie.budget ? formatCurrency(movie.revenue - movie.budget) : null,
      collection,
      similar_movies: similarMovies,
      recommended_movies: recommendedMovies,
    };
  }

  return base;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TMDB_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'TMDB_API_KEY not configured',
        movies: [],
        total_pages: 0,
        page: 1
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'now_playing';
    const movieId = url.searchParams.get('movie_id');
    const query = url.searchParams.get('query');
    const page = url.searchParams.get('page') || '1';

    console.log(`TMDB request: action=${action}, movieId=${movieId}, query=${query}`);

    let result;

    switch (action) {
      case 'now_playing': {
        const data = await fetchFromTMDB(`/movie/now_playing?page=${page}&region=US`);
        result = {
          movies: data.results.map((m: TMDBMovie) => transformMovie(m)),
          total_pages: data.total_pages,
          page: data.page,
        };
        break;
      }
      
      case 'upcoming': {
        const data = await fetchFromTMDB(`/movie/upcoming?page=${page}&region=US`);
        result = {
          movies: data.results.map((m: TMDBMovie) => transformMovie(m)),
          total_pages: data.total_pages,
          page: data.page,
        };
        break;
      }
      
      case 'popular': {
        const data = await fetchFromTMDB(`/movie/popular?page=${page}`);
        result = {
          movies: data.results.map((m: TMDBMovie) => transformMovie(m)),
          total_pages: data.total_pages,
          page: data.page,
        };
        break;
      }
      
      case 'details': {
        if (!movieId) {
          throw new Error('movie_id is required for details action');
        }
        const data = await fetchFromTMDB(`/movie/${movieId}?append_to_response=credits,videos,similar,recommendations`);
        result = transformMovie(data, true);
        break;
      }
      
      case 'search': {
        if (!query) {
          throw new Error('query is required for search action');
        }
        const data = await fetchFromTMDB(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`);
        result = {
          movies: data.results.map((m: TMDBMovie) => transformMovie(m)),
          total_pages: data.total_pages,
          page: data.page,
        };
        break;
      }

      case 'collection': {
        const collectionId = url.searchParams.get('collection_id');
        if (!collectionId) {
          throw new Error('collection_id is required for collection action');
        }
        const data = await fetchFromTMDB(`/collection/${collectionId}`);
        result = {
          name: data.name,
          overview: data.overview,
          poster_url: data.poster_path ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}` : null,
          backdrop_url: data.backdrop_path ? `${TMDB_IMAGE_BASE}/original${data.backdrop_path}` : null,
          movies: (data.parts || []).map((m: TMDBMovie) => transformMovie(m)),
        };
        break;
      }
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`TMDB response successful for action: ${action}`);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in tmdb-movies function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, movies: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
