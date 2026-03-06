import { useEffect } from 'react';
import { Movie } from '@/types/database';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  movie?: Movie;
  type?: 'website' | 'movie';
}

export function MetaTags({ title, description, image, movie, type = 'website' }: MetaTagsProps) {
  useEffect(() => {
    // Update document title
    const fullTitle = title ? `${title} | CineBook` : 'CineBook | Book Movie Tickets Online';
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description || 'Your ultimate destination for seamless movie ticket booking. Browse films, select seats, and book tickets instantly.');
    
    // Open Graph tags
    updateMetaTag('og:title', fullTitle, 'property');
    updateMetaTag('og:description', description || 'Your ultimate destination for seamless movie ticket booking.', 'property');
    updateMetaTag('og:type', type === 'movie' ? 'video.movie' : 'website', 'property');
    if (image) {
      updateMetaTag('og:image', image, 'property');
    }
    updateMetaTag('og:site_name', 'CineBook', 'property');
    updateMetaTag('og:url', window.location.href, 'property');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description || 'Your ultimate destination for seamless movie ticket booking.');
    if (image) {
      updateMetaTag('twitter:image', image);
    }

    // Movie-specific structured data
    if (movie && type === 'movie') {
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Movie',
        name: movie.title,
        description: movie.description,
        image: movie.poster_url || movie.backdrop_url,
        aggregateRating: movie.rating ? {
          '@type': 'AggregateRating',
          ratingValue: movie.rating,
          bestRating: '10',
        } : undefined,
        datePublished: movie.release_date,
        duration: movie.duration_minutes ? `PT${movie.duration_minutes}M` : undefined,
        genre: movie.genre,
      };

      // Remove existing structured data script
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Add new structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [title, description, image, movie, type]);

  return null;
}
