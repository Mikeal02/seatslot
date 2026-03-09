import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
  runtime?: number;
  budget?: number;
  revenue?: number;
  tagline?: string;
  original_language?: string;
  original_title?: string;
  popularity?: number;
  status?: string;
  homepage?: string;
  imdb_id?: string;
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  production_companies?: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  genres?: { id: number; name: string }[];
  belongs_to_collection?: { id: number; name: string; poster_path: string | null; backdrop_path: string | null } | null;
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null; order: number; known_for_department: string; popularity: number; gender: number }[];
    crew: { id: number; name: string; job: string; department: string; profile_path: string | null; popularity: number }[];
  };
  videos?: {
    results: { key: string; site: string; type: string; official: boolean; name: string; published_at: string }[];
  };
  images?: {
    backdrops: { file_path: string; width: number; height: number; vote_average: number }[];
    posters: { file_path: string; width: number; height: number; vote_average: number }[];
    logos: { file_path: string; width: number; height: number }[];
  };
  keywords?: {
    keywords: { id: number; name: string }[];
  };
  release_dates?: {
    results: { iso_3166_1: string; release_dates: { certification: string; type: number; release_date: string; note: string }[] }[];
  };
  similar?: { results: TMDBMovie[] };
  recommendations?: { results: TMDBMovie[] };
  external_ids?: {
    imdb_id: string | null;
    facebook_id: string | null;
    instagram_id: string | null;
    twitter_id: string | null;
    wikidata_id: string | null;
  };
  ["watch/providers"]?: {
    results: Record<string, {
      link: string;
      flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
      rent?: { provider_id: number; provider_name: string; logo_path: string }[];
      buy?: { provider_id: number; provider_name: string; logo_path: string }[];
    }>;
  };
}

async function fetchFromTMDB(endpoint: string): Promise<any> {
  if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY is not configured');
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
  const officialTrailer = videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official);
  if (officialTrailer) return officialTrailer.key;
  const anyTrailer = videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
  if (anyTrailer) return anyTrailer.key;
  const anyYouTube = videos.results.find(v => v.site === 'YouTube');
  return anyYouTube?.key || null;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function getCertification(releaseDates?: TMDBMovie['release_dates']): { certification: string; country: string } | null {
  if (!releaseDates?.results) return null;
  // Prefer US, then GB, then first found
  const preferred = ['US', 'GB', 'CA', 'AU'];
  for (const country of preferred) {
    const entry = releaseDates.results.find(r => r.iso_3166_1 === country);
    if (entry) {
      const cert = entry.release_dates.find(rd => rd.certification && rd.certification.length > 0);
      if (cert) return { certification: cert.certification, country };
    }
  }
  // Fallback to any certification
  for (const entry of releaseDates.results) {
    const cert = entry.release_dates.find(rd => rd.certification && rd.certification.length > 0);
    if (cert) return { certification: cert.certification, country: entry.iso_3166_1 };
  }
  return null;
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
    vote_count: movie.vote_count || 0,
    popularity: movie.popularity || 0,
    budget: movie.budget || 0,
    revenue: movie.revenue || 0,
    original_language: movie.original_language || 'en',
  };

  if (!includeDetails) return base;

  const director = movie.credits?.crew.find(c => c.job === 'Director');
  const writers = movie.credits?.crew
    .filter(c => c.department === 'Writing')
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5)
    .map(c => ({ name: c.name, job: c.job })) || [];
  const composers = movie.credits?.crew
    .filter(c => c.job === 'Original Music Composer' || c.job === 'Music')
    .slice(0, 3)
    .map(c => c.name) || [];
  const cinematographers = movie.credits?.crew
    .filter(c => c.job === 'Director of Photography')
    .slice(0, 2)
    .map(c => c.name) || [];
  const editors = movie.credits?.crew
    .filter(c => c.job === 'Editor')
    .slice(0, 3)
    .map(c => c.name) || [];
  const cast = movie.credits?.cast
    .sort((a, b) => a.order - b.order)
    .slice(0, 20)
    .map(c => c.name) || [];
  const castWithPhotos = movie.credits?.cast
    .sort((a, b) => a.order - b.order)
    .slice(0, 20)
    .map(c => ({
      id: c.id,
      name: c.name,
      character: c.character,
      photo: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : null,
      popularity: c.popularity,
      department: c.known_for_department,
    })) || [];
  const genres = movie.genres?.map(g => g.name) || [];
  const trailerKey = getTrailerKey(movie.videos);
  const productionCompanies = movie.production_companies?.map(c => ({
    name: c.name,
    logo: c.logo_path ? `${TMDB_IMAGE_BASE}/w200${c.logo_path}` : null,
    country: c.origin_country,
  })) || [];

  // Videos (all types)
  const allVideos = movie.videos?.results
    ?.filter(v => v.site === 'YouTube')
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 8)
    .map(v => ({
      key: v.key,
      name: v.name,
      type: v.type,
      official: v.official,
    })) || [];

  // Images
  const backdrops = movie.images?.backdrops
    ?.sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 10)
    .map(img => `${TMDB_IMAGE_BASE}/w1280${img.file_path}`) || [];
  const posters = movie.images?.posters
    ?.sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 6)
    .map(img => `${TMDB_IMAGE_BASE}/w500${img.file_path}`) || [];
  const logos = movie.images?.logos
    ?.slice(0, 3)
    .map(img => `${TMDB_IMAGE_BASE}/w300${img.file_path}`) || [];

  // Keywords
  const keywords = movie.keywords?.keywords?.slice(0, 15).map(k => k.name) || [];

  // Certification
  const certification = getCertification(movie.release_dates);

  // Spoken languages
  const spokenLanguages = movie.spoken_languages?.map(l => l.english_name) || [];
  const productionCountries = movie.production_countries?.map(c => c.name) || [];

  // Watch providers (US focus)
  const watchProviders = movie["watch/providers"]?.results;
  const usProviders = watchProviders?.US || watchProviders?.GB || null;
  const streaming = usProviders?.flatrate?.map(p => ({
    name: p.provider_name,
    logo: `${TMDB_IMAGE_BASE}/w92${p.logo_path}`,
  })) || [];
  const rentBuy = [
    ...(usProviders?.rent?.map(p => ({
      name: p.provider_name,
      logo: `${TMDB_IMAGE_BASE}/w92${p.logo_path}`,
      type: 'rent' as const,
    })) || []),
    ...(usProviders?.buy?.map(p => ({
      name: p.provider_name,
      logo: `${TMDB_IMAGE_BASE}/w92${p.logo_path}`,
      type: 'buy' as const,
    })) || []),
  ];

  // External IDs
  const externalIds = {
    imdb_id: movie.external_ids?.imdb_id || movie.imdb_id || null,
    facebook_id: movie.external_ids?.facebook_id || null,
    instagram_id: movie.external_ids?.instagram_id || null,
    twitter_id: movie.external_ids?.twitter_id || null,
  };

  // Similar & recommended movies
  const similarMovies = movie.similar?.results?.slice(0, 10).map(m => ({
    ...transformMovie(m),
    genre: m.genres?.map(g => g.name) || [],
  })) || [];
  const recommendedMovies = movie.recommendations?.results?.slice(0, 10).map(m => ({
    ...transformMovie(m),
    genre: m.genres?.map(g => g.name) || [],
  })) || [];

  // Collection
  const collection = movie.belongs_to_collection ? {
    id: movie.belongs_to_collection.id,
    name: movie.belongs_to_collection.name,
    poster_url: movie.belongs_to_collection.poster_path
      ? `${TMDB_IMAGE_BASE}/w500${movie.belongs_to_collection.poster_path}` : null,
    backdrop_url: movie.belongs_to_collection.backdrop_path
      ? `${TMDB_IMAGE_BASE}/original${movie.belongs_to_collection.backdrop_path}` : null,
  } : null;

  // Financial analytics
  const profit = (movie.revenue || 0) - (movie.budget || 0);
  const roi = movie.budget && movie.budget > 0 ? ((profit / movie.budget) * 100) : null;
  const revenueMultiplier = movie.budget && movie.budget > 0 ? ((movie.revenue || 0) / movie.budget) : null;

  return {
    ...base,
    original_title: movie.original_title !== movie.title ? movie.original_title : null,
    tagline: movie.tagline || null,
    status: movie.status || null,
    homepage: movie.homepage || null,
    duration_minutes: movie.runtime || 120,
    genre: genres,
    director: director ? { name: director.name, photo: director.profile_path ? `${TMDB_IMAGE_BASE}/w185${director.profile_path}` : null } : null,
    writers,
    composers,
    cinematographers,
    editors,
    cast_members: cast,
    cast_details: castWithPhotos,
    trailer_key: trailerKey,
    all_videos: allVideos,
    production_companies: productionCompanies,
    production_countries: productionCountries,
    spoken_languages: spokenLanguages,
    certification,
    keywords,
    backdrops,
    posters,
    logos,
    streaming_providers: streaming,
    rent_buy_providers: rentBuy,
    external_ids: externalIds,
    // Financials
    budget_formatted: movie.budget ? formatCurrency(movie.budget) : null,
    revenue_formatted: movie.revenue ? formatCurrency(movie.revenue) : null,
    profit: profit,
    profit_formatted: (movie.revenue && movie.budget) ? formatCurrency(Math.abs(profit)) : null,
    roi: roi !== null ? Math.round(roi) : null,
    revenue_multiplier: revenueMultiplier !== null ? Math.round(revenueMultiplier * 10) / 10 : null,
    is_profitable: profit > 0,
    // Related
    collection,
    similar_movies: similarMovies,
    recommended_movies: recommendedMovies,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TMDB_API_KEY) {
      return new Response(JSON.stringify({ error: 'TMDB_API_KEY not configured', movies: [], total_pages: 0, page: 1 }), {
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
        result = { movies: data.results.map((m: TMDBMovie) => transformMovie(m)), total_pages: data.total_pages, page: data.page };
        break;
      }
      case 'upcoming': {
        const data = await fetchFromTMDB(`/movie/upcoming?page=${page}&region=US`);
        result = { movies: data.results.map((m: TMDBMovie) => transformMovie(m)), total_pages: data.total_pages, page: data.page };
        break;
      }
      case 'popular': {
        const data = await fetchFromTMDB(`/movie/popular?page=${page}`);
        result = { movies: data.results.map((m: TMDBMovie) => transformMovie(m)), total_pages: data.total_pages, page: data.page };
        break;
      }
      case 'top_rated': {
        const data = await fetchFromTMDB(`/movie/top_rated?page=${page}`);
        result = { movies: data.results.map((m: TMDBMovie) => transformMovie(m)), total_pages: data.total_pages, page: data.page };
        break;
      }
      case 'trending': {
        const window = url.searchParams.get('window') || 'week';
        const data = await fetchFromTMDB(`/trending/movie/${window}?page=${page}`);
        result = { movies: data.results.map((m: TMDBMovie) => transformMovie(m)), total_pages: data.total_pages, page: data.page };
        break;
      }
      case 'details': {
        if (!movieId) throw new Error('movie_id is required for details action');
        const data = await fetchFromTMDB(
          `/movie/${movieId}?append_to_response=credits,videos,similar,recommendations,images,keywords,release_dates,external_ids,watch/providers`
        );
        result = transformMovie(data, true);
        break;
      }
      case 'search': {
        if (!query) throw new Error('query is required for search action');
        const data = await fetchFromTMDB(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`);
        result = { movies: data.results.map((m: TMDBMovie) => transformMovie(m)), total_pages: data.total_pages, page: data.page };
        break;
      }
      case 'collection': {
        const collectionId = url.searchParams.get('collection_id');
        if (!collectionId) throw new Error('collection_id is required');
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
      case 'person': {
        const personId = url.searchParams.get('person_id');
        if (!personId) throw new Error('person_id is required');
        const data = await fetchFromTMDB(`/person/${personId}?append_to_response=movie_credits,tv_credits,images,external_ids,tagged_images`);
        
        // Build full filmography from cast credits
        const castFilmography = (data.movie_credits?.cast || [])
          .filter((m: any) => m.release_date)
          .sort((a: any, b: any) => new Date(b.release_date || '1900').getTime() - new Date(a.release_date || '1900').getTime())
          .map((m: any) => ({
            tmdb_id: m.id,
            title: m.title,
            character: m.character,
            poster_url: m.poster_path ? `${TMDB_IMAGE_BASE}/w300${m.poster_path}` : null,
            backdrop_url: m.backdrop_path ? `${TMDB_IMAGE_BASE}/w780${m.backdrop_path}` : null,
            release_date: m.release_date,
            rating: Math.round((m.vote_average || 0) * 10) / 10,
            vote_count: m.vote_count || 0,
            popularity: m.popularity || 0,
            genre_ids: m.genre_ids || [],
            overview: m.overview || '',
            credit_type: 'cast' as const,
          }));

        // Crew credits (directed, produced, wrote)
        const crewFilmography = (data.movie_credits?.crew || [])
          .filter((m: any) => m.release_date && ['Director', 'Producer', 'Executive Producer', 'Writer', 'Screenplay', 'Story'].includes(m.job))
          .sort((a: any, b: any) => new Date(b.release_date || '1900').getTime() - new Date(a.release_date || '1900').getTime())
          .map((m: any) => ({
            tmdb_id: m.id,
            title: m.title,
            job: m.job,
            department: m.department,
            poster_url: m.poster_path ? `${TMDB_IMAGE_BASE}/w300${m.poster_path}` : null,
            backdrop_url: m.backdrop_path ? `${TMDB_IMAGE_BASE}/w780${m.backdrop_path}` : null,
            release_date: m.release_date,
            rating: Math.round((m.vote_average || 0) * 10) / 10,
            vote_count: m.vote_count || 0,
            popularity: m.popularity || 0,
            credit_type: 'crew' as const,
          }));

        // Deduplicate crew entries (same movie, different jobs)
        const crewDeduped: any[] = [];
        const crewSeen = new Set<number>();
        for (const c of crewFilmography) {
          if (!crewSeen.has(c.tmdb_id)) {
            crewSeen.add(c.tmdb_id);
            const jobs = crewFilmography.filter((x: any) => x.tmdb_id === c.tmdb_id).map((x: any) => x.job);
            crewDeduped.push({ ...c, job: jobs.join(', ') });
          }
        }

        // TV credits (limited)
        const tvCredits = (data.tv_credits?.cast || [])
          .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 10)
          .map((t: any) => ({
            tmdb_id: t.id,
            name: t.name,
            character: t.character,
            poster_url: t.poster_path ? `${TMDB_IMAGE_BASE}/w300${t.poster_path}` : null,
            first_air_date: t.first_air_date,
            rating: Math.round((t.vote_average || 0) * 10) / 10,
            episode_count: t.episode_count || 0,
          }));

        // Known-for: top movies by popularity
        const knownFor = [...castFilmography]
          .sort((a: any, b: any) => b.popularity - a.popularity)
          .slice(0, 8);

        // Career stats
        const totalMovies = castFilmography.length;
        const totalCrewCredits = crewDeduped.length;
        const avgRating = castFilmography.length > 0
          ? Math.round((castFilmography.reduce((s: number, m: any) => s + m.rating, 0) / castFilmography.length) * 10) / 10
          : 0;
        const highestRated = castFilmography.length > 0
          ? castFilmography.reduce((best: any, m: any) => m.rating > best.rating ? m : best, castFilmography[0])
          : null;
        const decadeBreakdown: Record<string, number> = {};
        for (const m of castFilmography) {
          const decade = m.release_date ? `${Math.floor(parseInt(m.release_date.split('-')[0]) / 10) * 10}s` : 'Unknown';
          decadeBreakdown[decade] = (decadeBreakdown[decade] || 0) + 1;
        }

        // External IDs
        const externalIds = {
          imdb_id: data.external_ids?.imdb_id || data.imdb_id || null,
          facebook_id: data.external_ids?.facebook_id || null,
          instagram_id: data.external_ids?.instagram_id || null,
          twitter_id: data.external_ids?.twitter_id || null,
          tiktok_id: data.external_ids?.tiktok_id || null,
          youtube_id: data.external_ids?.youtube_id || null,
          wikidata_id: data.external_ids?.wikidata_id || null,
        };

        // Also known as
        const alsoKnownAs = data.also_known_as || [];

        result = {
          id: data.id,
          name: data.name,
          biography: data.biography || '',
          birthday: data.birthday,
          deathday: data.deathday,
          place_of_birth: data.place_of_birth,
          photo: data.profile_path ? `${TMDB_IMAGE_BASE}/h632${data.profile_path}` : null,
          known_for_department: data.known_for_department,
          popularity: data.popularity,
          gender: data.gender,
          homepage: data.homepage || null,
          also_known_as: alsoKnownAs.slice(0, 5),
          external_ids: externalIds,
          // Career
          known_for: knownFor,
          filmography_cast: castFilmography,
          filmography_crew: crewDeduped,
          tv_credits: tvCredits,
          // Stats
          career_stats: {
            total_movies: totalMovies,
            total_crew_credits: totalCrewCredits,
            average_rating: avgRating,
            highest_rated: highestRated ? { title: highestRated.title, rating: highestRated.rating, tmdb_id: highestRated.tmdb_id } : null,
            decade_breakdown: decadeBreakdown,
            active_years: castFilmography.length > 0
              ? `${castFilmography[castFilmography.length - 1]?.release_date?.split('-')[0] || '?'} – ${castFilmography[0]?.release_date?.split('-')[0] || 'Present'}`
              : null,
          },
          // Photos
          photos: data.images?.profiles
            ?.slice(0, 20)
            .map((img: any) => ({
              url: `${TMDB_IMAGE_BASE}/w500${img.file_path}`,
              width: img.width,
              height: img.height,
              aspect_ratio: img.aspect_ratio,
              vote_average: img.vote_average,
            })) || [],
        };
        break;
      }
      case 'multi_search': {
        if (!query) throw new Error('query is required for multi_search');
        const data = await fetchFromTMDB(`/search/multi?query=${encodeURIComponent(query)}&page=1`);
        const movies = (data.results || [])
          .filter((r: any) => r.media_type === 'movie')
          .slice(0, 6)
          .map((m: any) => ({
            type: 'movie' as const,
            tmdb_id: m.id,
            title: m.title,
            poster_url: m.poster_path ? `${TMDB_IMAGE_BASE}/w200${m.poster_path}` : null,
            release_date: m.release_date || null,
            rating: Math.round((m.vote_average || 0) * 10) / 10,
            popularity: m.popularity || 0,
            genre_ids: m.genre_ids || [],
            overview: (m.overview || '').slice(0, 120),
          }));
        const people = (data.results || [])
          .filter((r: any) => r.media_type === 'person')
          .slice(0, 6)
          .map((p: any) => ({
            type: 'person' as const,
            tmdb_id: p.id,
            name: p.name,
            photo: p.profile_path ? `${TMDB_IMAGE_BASE}/w200${p.profile_path}` : null,
            known_for_department: p.known_for_department || 'Acting',
            popularity: p.popularity || 0,
            known_for: (p.known_for || []).slice(0, 3).map((k: any) => k.title || k.name).filter(Boolean),
          }));
        result = { movies, people };
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
