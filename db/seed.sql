INSERT INTO resource_categories (name) VALUES
  ('Meeting Room'), ('Equipment'), ('Vehicle'), ('Workspace')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (name, email, team) VALUES
  ('Nimali Perera', 'nimali@example.com', 'Engineering'),
  ('Kasun Fernando', 'kasun@example.com', 'Design'),
  ('Ayesha Silva', 'ayesha@example.com', 'Operations')
ON CONFLICT (email) DO NOTHING;

INSERT INTO resources (category_id, name, description, location, capacity) VALUES
  ((SELECT id FROM resource_categories WHERE name = 'Meeting Room'), 'Boardroom A', 'Large boardroom with video conferencing', 'Floor 3', 12),
  ((SELECT id FROM resource_categories WHERE name = 'Meeting Room'), 'Huddle Room 1', 'Small room for quick syncs', 'Floor 2', 4),
  ((SELECT id FROM resource_categories WHERE name = 'Equipment'), 'Projector Kit', 'Portable projector with screen', 'Store Room', NULL),
  ((SELECT id FROM resource_categories WHERE name = 'Vehicle'), 'Company Van', '9-seater van', 'Basement Parking', 9),
  ((SELECT id FROM resource_categories WHERE name = 'Workspace'), 'Design Lab', 'Workshop space with whiteboards', 'Floor 1', 8)
ON CONFLICT (name) DO NOTHING;

-- Demo reservations relative to "now" (only when the table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM reservations) THEN
    INSERT INTO reservations (resource_id, user_id, title, start_time, end_time) VALUES
      ((SELECT id FROM resources WHERE name = 'Boardroom A'),
       (SELECT id FROM users WHERE email = 'nimali@example.com'),
       'Sprint planning', date_trunc('hour', now()) + interval '2 hours', date_trunc('hour', now()) + interval '3 hours'),
      ((SELECT id FROM resources WHERE name = 'Company Van'),
       (SELECT id FROM users WHERE email = 'ayesha@example.com'),
       'Client site visit', date_trunc('hour', now()) + interval '1 day', date_trunc('hour', now()) + interval '1 day 4 hours'),
      ((SELECT id FROM resources WHERE name = 'Design Lab'),
       (SELECT id FROM users WHERE email = 'kasun@example.com'),
       'Design workshop', date_trunc('hour', now()) - interval '3 days', date_trunc('hour', now()) - interval '3 days' + interval '2 hours');
  END IF;
END $$;
