GRANT SELECT ON public.niveis TO anon;
CREATE POLICY "read_public_school_levels" ON public.niveis FOR SELECT TO anon USING (true);