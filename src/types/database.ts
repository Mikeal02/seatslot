export interface Movie {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  duration_minutes: number;
  rating: number | null;
  genre: string[];
  cast_members: string[];
  director: string | null;
  release_date: string | null;
  status: 'now_showing' | 'coming_soon';
  trailer_key?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Theatre {
  id: string;
  name: string;
  location: string;
  city: string;
  created_at: string;
}

export interface Screen {
  id: string;
  theatre_id: string;
  name: string;
  total_rows: number;
  seats_per_row: number;
  created_at: string;
  theatre?: Theatre;
}

export interface Seat {
  id: string;
  screen_id: string;
  row_label: string;
  seat_number: number;
  seat_type: 'regular' | 'premium' | 'vip';
  price: number;
  created_at: string;
}

export interface Showtime {
  id: string;
  movie_id: string;
  screen_id: string;
  show_date: string;
  show_time: string;
  created_at: string;
  movie?: Movie;
  screen?: Screen & { theatre?: Theatre };
}

export interface Booking {
  id: string;
  user_id: string;
  showtime_id: string;
  total_amount: number;
  booking_status: 'confirmed' | 'cancelled';
  created_at: string;
  showtime?: Showtime;
  booked_seats?: BookedSeat[];
}

export interface BookedSeat {
  id: string;
  booking_id: string;
  seat_id: string;
  showtime_id: string;
  created_at: string;
  seat?: Seat;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
}
