-- Generate seats for screens that are missing them
INSERT INTO seats (screen_id, row_label, seat_number, seat_type, price)
SELECT 
  sc.id,
  chr(64 + r) as row_label,
  s as seat_number,
 CASE
    WHEN r > sc.total_rows - 2 THEN 'vip'
    WHEN r > sc.total_rows - 5 THEN 'premium'
    ELSE 'regular'
END as seat_type,
  CASE
    WHEN r > sc.total_rows - 2 THEN 350.00
    WHEN r > sc.total_rows - 5 THEN 250.00
    ELSE 150.00
END as price
FROM screens sc
CROSS JOIN generate_series(1, sc.total_rows) AS r
CROSS JOIN generate_series(1, sc.seats_per_row) AS s
WHERE NOT EXISTS (SELECT 1 FROM seats WHERE screen_id = sc.id)