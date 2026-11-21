/**
 * Recettes cumulées de la journée, heure par heure : trait plein jusqu'à maintenant, pointillés
 * jusqu'à minuit. `values[h]` = total cumulé à la fin de l'heure `h` (la dernière valeur est
 * l'heure en cours) ; `minutes` place le point « maintenant » dans l'heure courante.
 */
export function DayChart({
  values,
  minutes = 0,
  label,
}: {
  values: number[];
  minutes?: number;
  label: string;
}) {
  const w = 640;
  const h = 150;
  const hours = 24;
  const max = Math.max(...values, 1) * 1.1;
  const x = (hour: number) => (hour / hours) * w;
  const y = (v: number) => h - 10 - (v / max) * (h - 30);
  const last = values.length - 1;
  const nowX = x(last + minutes / 60);
  // Un point par heure pleine (valeur en début d'heure), puis le point « maintenant ».
  const points: [number, number][] = [[0, y(0)]];
  for (let i = 0; i < last; i += 1) points.push([x(i + 1), y(values[i])]);
  points.push([nowX, y(values[last])]);
  const solid = points
    .map(
      ([px, py], i) =>
        `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`,
    )
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h + 22}`}
      className="w-full"
      role="img"
      aria-label={label}
    >
      <line
        x1="0"
        x2={w}
        y1={h - 10}
        y2={h - 10}
        className="stroke-border"
        strokeWidth="1"
      />
      <path
        d={solid}
        fill="none"
        className="stroke-signal"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {nowX < w ? (
        <line
          x1={nowX}
          x2={w}
          y1={y(values[last])}
          y2={y(values[last])}
          className="stroke-signal"
          strokeWidth="2"
          strokeDasharray="4 5"
          opacity="0.6"
        />
      ) : null}
      <circle cx={nowX} cy={y(values[last])} r="4.5" className="fill-signal" />
      {[0, 6, 12, 18].map((hour) => (
        <text
          key={hour}
          x={x(hour)}
          y={h + 14}
          className="fill-muted-foreground text-[11px]"
        >
          {String(hour).padStart(2, "0")} h
        </text>
      ))}
      <text
        x={w}
        y={h + 14}
        textAnchor="end"
        className="fill-muted-foreground text-[11px]"
      >
        24 h
      </text>
    </svg>
  );
}

/** Courbe discrète d'une série (une valeur par jour). */
export function MiniLine({ values }: { values: number[] }) {
  const w = 240;
  const h = 56;
  const max = Math.max(...values, 1) * 1.15;
  const d = values
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${((i / Math.max(values.length - 1, 1)) * w).toFixed(1)} ${(h - 4 - (v / max) * (h - 12)).toFixed(1)}`,
    )
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" aria-hidden>
      <path
        d={d}
        fill="none"
        className="stroke-signal"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
