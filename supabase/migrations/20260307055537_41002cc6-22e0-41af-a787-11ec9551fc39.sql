-- Delete old expired showtimes
DELETE FROM showtimes WHERE show_date < CURRENT_DATE;

-- Generate showtimes for all movies across multiple screens for the next 7 days
INSERT INTO showtimes (movie_id, screen_id, show_date, show_time)
SELECT 
  m.id,
  s.screen_id,
  CURRENT_DATE + d.day_offset,
  t.show_time
FROM movies m
CROSS JOIN (
  VALUES 
    ('aaaa1111-1111-1111-1111-111111111111'::uuid),
    ('bbbb1111-1111-1111-1111-111111111111'::uuid),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'::uuid)
) AS s(screen_id)
CROSS JOIN (
  VALUES (0), (1), (2), (3), (4), (5), (6)
) AS d(day_offset)
CROSS JOIN (
  VALUES ('10:00'::time), ('13:30'::time), ('17:00'::time), ('20:30'::time)
) AS t(show_time)
ON CONFLICT DO NOTHING;