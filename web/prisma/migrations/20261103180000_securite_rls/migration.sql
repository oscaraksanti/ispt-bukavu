-- Sécurité de l'hébergement Supabase : les tables du schéma public sont
-- exposées par l'API REST de Supabase. L'application n'utilise pas cette API
-- (elle passe par Prisma avec le rôle propriétaire, non soumis au RLS).
-- Activer le RLS sans aucune politique ferme donc tout accès via l'API
-- publique, sans effet sur l'application.
-- À reprendre dans chaque migration qui crée une table.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
