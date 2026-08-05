-- ============================================================
-- Keba Entertainmentz — Content Seed
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Genres
INSERT INTO genres (id, name, slug) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Melodrama',       'melodrama'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'Comedy',          'comedy'),
  ('aaaaaaaa-0003-0003-0003-000000000003', 'Thriller / Drama','thriller-drama'),
  ('aaaaaaaa-0004-0004-0004-000000000004', 'Drama',           'drama')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- 2. Content (10 original series)
INSERT INTO content (
  id, title, slug, description, type,
  genre_ids, release_year,
  thumbnail_url, poster_url, backdrop_url,
  is_featured, is_published
) VALUES

-- MELODRAMA (4 series)
(
  'cccccccc-0001-0001-0001-000000000001',
  'Dr Amina', 'dr-amina',
  'Amina, an undocumented immigrant, has only a few days before deportation. She finds TRUE LOVE in her effort to earn enough money to get out of South Africa. Will she break the law for love?',
  'series',
  ARRAY['aaaaaaaa-0001-0001-0001-000000000001'],
  2025,
  '/content/dr-amina.png', '/content/dr-amina.png', '/content/dr-amina.png',
  true, true
),
(
  'cccccccc-0002-0002-0002-000000000002',
  'D NPA Sergent', 'd-npa-sergent',
  'Malibongwe, an NPA armed investigator, is torn between duty and love when she discovers that the man she loved and protected is the CRIME she was investigating.',
  'series',
  ARRAY['aaaaaaaa-0001-0001-0001-000000000001'],
  2025,
  '/content/d-npa-sergent.png', '/content/d-npa-sergent.png', '/content/d-npa-sergent.png',
  true, true
),
(
  'cccccccc-0003-0003-0003-000000000003',
  'My Millionaire Reject', 'my-millionaire-reject',
  'Mbatta, a South African sexy Gen Z, is torn between family and love when she finds out that her lover — rejected by her Zulu mom — is a millionaire in Nigeria.',
  'series',
  ARRAY['aaaaaaaa-0001-0001-0001-000000000001'],
  2025,
  '/content/my-millionaire-reject.png', '/content/my-millionaire-reject.png', '/content/my-millionaire-reject.png',
  true, true
),
(
  'cccccccc-0004-0004-0004-000000000004',
  'Khadijja', 'khadijja',
  'A prominent social media influencer discovers that one of her secret followers is the answer to both her hidden public identity and her romance frustration.',
  'series',
  ARRAY['aaaaaaaa-0001-0001-0001-000000000001'],
  2025,
  '/content/khadijja.png', '/content/khadijja.png', '/content/khadijja.png',
  false, true
),

-- DRAMA (1 series)
(
  'cccccccc-0005-0005-0005-000000000005',
  'Trapped?', 'trapped',
  'Rose, a Gen Z professional accountant in Sandton, goes seeking personal spiritual and financial solutions from a man of God — only to get trapped by "human philosophy and the teachings of men". Love or faith trapped?',
  'series',
  ARRAY['aaaaaaaa-0004-0004-0004-000000000004'],
  2025,
  '/content/trapped.png', '/content/trapped.png', '/content/trapped.png',
  false, true
),

-- COMEDY (1 series)
(
  'cccccccc-0006-0006-0006-000000000006',
  'BeautyFooled', 'beautyfooled',
  'A comedy series depicting three Gen Z South African ladies looking for a career break in modelling.',
  'series',
  ARRAY['aaaaaaaa-0002-0002-0002-000000000002'],
  2025,
  '/content/beautyfooled.png', '/content/beautyfooled.png', '/content/beautyfooled.png',
  false, true
),

-- THRILLER / DRAMA (4 series)
(
  'cccccccc-0007-0007-0007-000000000007',
  'Igazi Mix', 'igazi-mix',
  'A millennial single South African mom and her teen child battle societal norms because the child has a foreign father. The teen is torn between two nationalities.',
  'series',
  ARRAY['aaaaaaaa-0003-0003-0003-000000000003'],
  2025,
  '/content/igazi-mix.png', '/content/igazi-mix.png', '/content/igazi-mix.png',
  true, true
),
(
  'cccccccc-0008-0008-0008-000000000008',
  'Peter Afrika: Dessert Betray', 'peter-afrika-dessert-betray',
  'An African operative is assisted by a smart journalist to take on the corruption mafia of the Sahel region.',
  'series',
  ARRAY['aaaaaaaa-0003-0003-0003-000000000003'],
  2025,
  '/content/peter-afrika-dessert-betray.jpg', '/content/peter-afrika-dessert-betray.jpg', '/content/peter-afrika-dessert-betray.jpg',
  false, true
),
(
  'cccccccc-0009-0009-0009-000000000009',
  'Peter Afrika: Shadows of Lagos', 'peter-afrika-shadows-of-lagos',
  'An African operative defies all the odds to save West Africa from the caliphate mafia.',
  'series',
  ARRAY['aaaaaaaa-0003-0003-0003-000000000003'],
  2025,
  '/content/peter-afrika-shadows-of-lagos.jpg', '/content/peter-afrika-shadows-of-lagos.jpg', '/content/peter-afrika-shadows-of-lagos.jpg',
  false, true
),
(
  'cccccccc-0010-0010-0010-000000000010',
  'Peter Afrika: Empire of Lies', 'peter-afrika-empire-of-lies',
  'An African undercover agent infiltrates the diamond BBBEE Mafia of South Africa to save the politics of the day.',
  'series',
  ARRAY['aaaaaaaa-0003-0003-0003-000000000003'],
  2025,
  '/content/peter-afrika-empire-of-lies.jpg', '/content/peter-afrika-empire-of-lies.jpg', '/content/peter-afrika-empire-of-lies.jpg',
  false, true
)

ON CONFLICT (id) DO UPDATE SET
  title        = EXCLUDED.title,
  description  = EXCLUDED.description,
  genre_ids    = EXCLUDED.genre_ids,
  thumbnail_url = EXCLUDED.thumbnail_url,
  poster_url   = EXCLUDED.poster_url,
  backdrop_url = EXCLUDED.backdrop_url,
  is_featured  = EXCLUDED.is_featured,
  is_published = EXCLUDED.is_published;
