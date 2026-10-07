CREATE POLICY "deny_browser_usuario" ON public.usuario FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_browser_niveis" ON public.niveis FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_browser_conteudos" ON public.conteudos FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_browser_exercicios" ON public.exercicios FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_browser_alternativas" ON public.alternativas FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_browser_respostas" ON public.respostas FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);