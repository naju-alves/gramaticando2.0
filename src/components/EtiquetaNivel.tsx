const estilos: Record<number, string> = {
  1: "bg-p1-soft text-p1",
  2: "bg-p2-soft text-p2",
  3: "bg-p3-soft text-p3",
};

const romanos: Record<number, string> = { 1: "I", 2: "II", 3: "III" };

export function EtiquetaNivel({ idNivel, nome }: { idNivel: number; nome?: string | undefined }) {
  return (
    <span
      className={`inline-block rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide ${
        estilos[idNivel] ?? "bg-accent-soft text-accent"
      }`}
    >
      {nome ?? `Etiqueta ${romanos[idNivel] ?? idNivel}`}
    </span>
  );
}
