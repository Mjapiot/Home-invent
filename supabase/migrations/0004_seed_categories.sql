insert into public.categories (id, name_fr, icon, tracks_expiry) values
  ('alimentaire',   'Alimentaire',      '🍝', true),
  ('boissons',      'Boissons',         '🍷', true),
  ('medicaments',   'Médicaments',      '💊', true),
  ('hygiene-beaute','Hygiène & Beauté', '🧴', true),
  ('entretien',     'Entretien',        '🧽', false),
  ('vetements',     'Vêtements',        '👗', false),
  ('linge',         'Linge de maison',  '🛏️', false),
  ('bricolage',     'Bricolage',        '🔧', false),
  ('electronique',  'Électronique',     '🔌', false),
  ('papeterie',     'Papeterie',        '✏️', false),
  ('autre',         'Autre',            '📦', false)
on conflict (id) do nothing;
