import { useState } from 'react';
import { SlidersHorizontal, X, Star, Clock, Calendar, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export interface FilterOptions {
  minRating: number;
  maxDuration: number;
  sortBy: 'rating' | 'release_date' | 'title' | 'duration';
  sortOrder: 'asc' | 'desc';
  genres: string[];
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
  genres: string[];
}

export const defaultFilters: FilterOptions = {
  minRating: 0,
  maxDuration: 300,
  sortBy: 'rating',
  sortOrder: 'desc',
  genres: [],
};

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onReset,
  genres 
}: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters = 
    filters.minRating > 0 || 
    filters.maxDuration < 300 || 
    filters.genres.length > 0 ||
    filters.sortBy !== 'rating' ||
    filters.sortOrder !== 'desc';

  const handleGenreToggle = (genre: string) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter(g => g !== genre)
      : [...filters.genres, genre];
    onFiltersChange({ ...filters, genres: newGenres });
  };

  const activeFilterCount = [
    filters.minRating > 0,
    filters.maxDuration < 300,
    filters.genres.length > 0,
  ].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <Badge 
              variant="default" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Advanced Filters
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                <X className="h-4 w-4 mr-1" /> Reset
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Fine-tune your movie search
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Rating Filter */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              Minimum Rating: {filters.minRating}/10
            </Label>
            <Slider
              value={[filters.minRating]}
              min={0}
              max={10}
              step={0.5}
              onValueChange={([value]) => 
                onFiltersChange({ ...filters, minRating: value })
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Any</span>
              <span>10</span>
            </div>
          </div>

          {/* Duration Filter */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Max Duration: {filters.maxDuration} min
            </Label>
            <Slider
              value={[filters.maxDuration]}
              min={60}
              max={300}
              step={15}
              onValueChange={([value]) => 
                onFiltersChange({ ...filters, maxDuration: value })
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1h</span>
              <span>5h+</span>
            </div>
          </div>

          {/* Sort Options */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort By
            </Label>
            <div className="flex gap-2">
              <Select
                value={filters.sortBy}
                onValueChange={(value: FilterOptions['sortBy']) => 
                  onFiltersChange({ ...filters, sortBy: value })
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="release_date">Release Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.sortOrder}
                onValueChange={(value: 'asc' | 'desc') => 
                  onFiltersChange({ ...filters, sortOrder: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">High to Low</SelectItem>
                  <SelectItem value="asc">Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Genre Filter */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Genres
            </Label>
            <div className="flex flex-wrap gap-2">
              {genres.map(genre => (
                <Badge
                  key={genre}
                  variant={filters.genres.includes(genre) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                  {filters.genres.includes(genre) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              onReset();
              setOpen(false);
            }}
          >
            Reset All
          </Button>
          <Button 
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
