
-- Concessions menu items table
CREATE TABLE public.concession_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'snacks',
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.concession_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view concession items" ON public.concession_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage concession items" ON public.concession_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Concession orders linked to bookings
CREATE TABLE public.concession_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.concession_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own concession orders" ON public.concession_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create concession orders" ON public.concession_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Concession order items
CREATE TABLE public.concession_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.concession_orders(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.concession_items(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.concession_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items" ON public.concession_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.concession_orders WHERE id = concession_order_items.order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create order items" ON public.concession_order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.concession_orders WHERE id = concession_order_items.order_id AND user_id = auth.uid())
);

-- Seed some concession items
INSERT INTO public.concession_items (name, description, price, category) VALUES
  ('Regular Popcorn', 'Classic buttered popcorn - small', 150, 'snacks'),
  ('Large Popcorn', 'Classic buttered popcorn - large', 250, 'snacks'),
  ('Caramel Popcorn', 'Sweet caramel coated popcorn', 200, 'snacks'),
  ('Nachos with Cheese', 'Crispy nachos with warm cheese dip', 180, 'snacks'),
  ('Samosa (2 pcs)', 'Classic vegetable samosa', 100, 'snacks'),
  ('Coca-Cola', 'Chilled Coca-Cola 500ml', 120, 'beverages'),
  ('Pepsi', 'Chilled Pepsi 500ml', 120, 'beverages'),
  ('Mineral Water', 'Packaged drinking water 500ml', 50, 'beverages'),
  ('Cold Coffee', 'Iced cold coffee with cream', 180, 'beverages'),
  ('Hot Dog', 'Classic hot dog with mustard', 200, 'snacks'),
  ('Combo 1', 'Large Popcorn + 2 Cokes', 400, 'combos'),
  ('Combo 2', 'Nachos + Large Popcorn + 2 Pepsi', 550, 'combos'),
  ('Family Combo', '2 Large Popcorn + 4 Drinks + Nachos', 900, 'combos');

-- Enable realtime for concession orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.concession_orders;
