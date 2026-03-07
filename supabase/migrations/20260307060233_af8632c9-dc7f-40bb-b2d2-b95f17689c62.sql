
-- Generate showtimes for movies missing them
INSERT INTO showtimes (movie_id, screen_id, show_date, show_time)
SELECT m.id, s.id, d.show_date, t.show_time
FROM movies m
CROSS JOIN screens s
CROSS JOIN (
  SELECT CURRENT_DATE + i AS show_date FROM generate_series(0, 6) AS i
) d
CROSS JOIN (
  VALUES ('10:00'::time), ('13:30'::time), ('17:00'::time), ('20:30'::time)
) AS t(show_time)
WHERE m.id IN ('75ece0ed-504b-481f-9277-f30f8a195abd', 'ecd712b1-243d-4163-b331-c8b9c17ec51b')
AND NOT EXISTS (
  SELECT 1 FROM showtimes st WHERE st.movie_id = m.id AND st.show_date >= CURRENT_DATE
);
