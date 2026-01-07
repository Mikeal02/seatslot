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
  genres?: { id: number; name: string }[];
  credits?: {
    cast: { name: string; character: string }[];
    crew: { name: string; job: string }[];
  };
  videos?: {
    results: { key: string; site: string; type: string; official: boolean }[];
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
  
  // Prefer official YouTube trailers
  const officialTrailer = videos.results.find(
    v => v.site === 'YouTube' && v.type === 'Trailer' && v.official
  );
  if (officialTrailer) return officialTrailer.key;
  
  // Fallback to any YouTube trailer
  const anyTrailer = videos.results.find(
    v => v.site === 'YouTube' && v.type === 'Trailer'
  );
  if (anyTrailer) return anyTrailer.key;
  
  // Fallback to any YouTube video
  const anyYouTube = videos.results.find(v => v.site === 'YouTube');
  return anyYouTube?.key || null;
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
  };

  if (includeDetails) {
    const director = movie.credits?.crew.find(c => c.job === 'Director');
    const cast = movie.credits?.cast.slice(0, 10).map(c => c.name) || [];
    const genres = movie.genres?.map(g => g.name) || [];
    const trailerKey = getTrailerKey(movie.videos);

    return {
      ...base,
      duration_minutes: movie.runtime || 120,
      genre: genres,
      director: director?.name || null,
      cast_members: cast,
      trailer_key: trailerKey,
    };
  }

  return base;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if API key is configured
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
        const data = await fetchFromTMDB(`/movie/${movieId}?append_to_response=credits,videos`);
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
