import { useEffect, useRef, useState } from "react";

import { formatDay, formatShortDay, parseDay } from "../../utils/overview";

const HEIGHT = 232;
const MARGIN = { top: 18, right: 44, bottom: 26, left: 30 };
const DAY_MS = 24 * 60 * 60 * 1000;

/** 0, a quarter, a half, three quarters and the goal — whole numbers only, no repeats. */
const yTicks = (max) => [...new Set([0, 0.25, 0.5, 0.75, 1].map((step) => Math.round(max * step)))];

/**
 * Complete teams day by day across the window (#69): one series on one axis, the «все команды»
 * line it is climbing towards, and — while the window is open and there is a week's worth to go
 * on — where the last week's pace leads by the close.
 *
 * The drawing is for the eye; the «Таблицей» view underneath carries the same numbers exactly, for
 * a screen reader and for anyone who wants the figure rather than the slope.
 */
const TrajectoryChart = ({ history, projection, isToday }) => {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { days, endDate } = history;
  const first = parseDay(days[0].date);
  const lastDay = days[days.length - 1];
  const end = endDate ? parseDay(endDate) : parseDay(lastDay.date);
  const spanDays = Math.max(1, Math.round((end - first) / DAY_MS));
  const goal = lastDay.totalTeams;
  const yMax = Math.max(1, goal, ...days.map((day) => day.completeTeams));

  const x = (date) => MARGIN.left + (Math.round((parseDay(date) - first) / DAY_MS) / spanDays)
    * (width - MARGIN.left - MARGIN.right);
  const y = (value) => MARGIN.top + (1 - value / yMax) * (HEIGHT - MARGIN.top - MARGIN.bottom);

  const points = days.map((day) => [x(day.date), y(day.completeTeams)]);
  const line = points.map(([px, py], index) => `${index ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  const baseline = y(0);
  const area = `${line} L${points[points.length - 1][0].toFixed(1)} ${baseline} L${points[0][0].toFixed(1)} ${baseline} Z`;
  const [lastX, lastY] = points[points.length - 1];
  const endX = endDate ? x(endDate) : lastX;
  const narrow = width < 520;

  const onPointer = (event) => {
    const box = event.currentTarget.ownerSVGElement.getBoundingClientRect();
    // Into the drawing's own units: mid-resize the rendered width runs ahead of `width`.
    const px = (event.clientX - box.left) * (width / box.width);
    let nearest = 0;
    points.forEach(([pointX], index) => {
      if (Math.abs(pointX - px) < Math.abs(points[nearest][0] - px)) nearest = index;
    });
    setHover(nearest);
  };

  const hovered = hover == null ? null : days[hover];
  const tipLeft = hover == null ? 0 : Math.min(width - 170, Math.max(0, points[hover][0] + 12));
  const tipTop = hover == null ? 0 : Math.max(0, points[hover][1] - 72);

  return (
    <div className="trajectory">
      <div className="trajectory-plot" ref={wrapRef}>
        <svg
          className="trajectory-svg"
          viewBox={`0 0 ${width} ${HEIGHT}`}
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Собранные команды по дням: ${lastDay.completeTeams} из ${goal} на ${formatDay(lastDay.date)}.`}
        >
          {yTicks(yMax).map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === goal ? "trajectory-goal" : "trajectory-grid"}
              />
              <text x={MARGIN.left - 8} y={y(tick) + 4} textAnchor="end">{tick}</text>
            </g>
          ))}
          {goal > 0 && (
            <text x={MARGIN.left + 4} y={y(goal) - 6} className="trajectory-note">все команды</text>
          )}

          <text x={MARGIN.left} y={HEIGHT - 6} textAnchor="start">{formatShortDay(days[0].date)}</text>
          {endDate && (
            <>
              <line x1={endX} x2={endX} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} className="trajectory-marker" />
              <text x={endX} y={HEIGHT - 6} textAnchor="end">
                {narrow ? "" : "закрытие · "}{formatShortDay(endDate)}
              </text>
            </>
          )}

          <path d={area} className="trajectory-area" />

          {projection && (
            <>
              <line
                x1={lastX}
                y1={lastY}
                x2={endX}
                y2={y(projection.projected)}
                className="trajectory-projection"
              />
              <circle cx={endX} cy={y(projection.projected)} r="4" className="trajectory-projection-end" />
              <text x={endX + 8} y={y(projection.projected) + 4} className="trajectory-note">
                ≈{Math.round(projection.projected)}
              </text>
            </>
          )}
          {isToday && endDate && lastX < endX - 24 && (
            <>
              <line x1={lastX} x2={lastX} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} className="trajectory-marker" />
              <text x={lastX} y={MARGIN.top - 6} textAnchor="middle" className="trajectory-note">сегодня</text>
            </>
          )}

          <path d={line} className="trajectory-line" />
          <circle cx={lastX} cy={lastY} r="5" className="trajectory-end" />
          <text
            x={projection || lastX > width - MARGIN.right - 24 ? lastX - 10 : lastX + 10}
            y={lastY - 10}
            textAnchor={projection || lastX > width - MARGIN.right - 24 ? "end" : "start"}
            className="trajectory-value"
          >
            {lastDay.completeTeams}
          </text>

          {hovered && (
            <>
              <line
                x1={points[hover][0]}
                x2={points[hover][0]}
                y1={MARGIN.top}
                y2={HEIGHT - MARGIN.bottom}
                className="trajectory-crosshair"
              />
              <circle cx={points[hover][0]} cy={points[hover][1]} r="4" className="trajectory-end" />
            </>
          )}
          <rect
            x={MARGIN.left}
            y={0}
            width={Math.max(0, width - MARGIN.left - MARGIN.right)}
            height={HEIGHT}
            fill="transparent"
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {hovered && (
          <div className="trajectory-tip" style={{ left: tipLeft, top: tipTop }} aria-hidden="true">
            <strong>{formatDay(hovered.date)}</strong>
            <span>собраны <b>{hovered.completeTeams} из {hovered.totalTeams}</b></span>
            <span>в командах <b>{hovered.studentsInTeams} чел.</b></span>
          </div>
        )}
      </div>

      <div className="trajectory-foot">
        <span className="trajectory-key"><i className="key-line" aria-hidden="true" />собраны 3 + 3</span>
        {projection && (
          <span className="trajectory-key"><i className="key-dash" aria-hidden="true" />при темпе последней недели</span>
        )}
        <span className="trajectory-key"><i className="key-goal" aria-hidden="true" />все команды</span>
        <details className="trajectory-table">
          <summary>Таблицей</summary>
          <div className="trajectory-table-scroll">
            <table aria-label="Собранные команды по дням">
              <thead>
                <tr>
                  <th scope="col">День</th>
                  <th scope="col">Команд</th>
                  <th scope="col">Собрано</th>
                  <th scope="col">В командах</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day.date}>
                    <td>{formatDay(day.date)}</td>
                    <td>{day.totalTeams}</td>
                    <td>{day.completeTeams}</td>
                    <td>{day.studentsInTeams}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
};

export default TrajectoryChart;
