import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TrafficChart } from "@/components/admin/traffic-chart";

const series = [
  { label: "11-01", value: 2 },
  { label: "11-02", value: 9 },
  { label: "11-03", value: 4 },
  { label: "11-04", value: 0 },
];

function markup(data: { label: string; value: number }[]) {
  return renderToStaticMarkup(<TrafficChart data={data} unit="page views" />);
}

describe("TrafficChart", () => {
  it("asks for two points instead of drawing a meaningless line", () => {
    const html = markup([{ label: "11-01", value: 1 }]);
    expect(html).toContain("at least two days");
    expect(html).not.toContain("<svg");
  });

  it("labels the y-axis so the height of the line means something", () => {
    const html = markup(series);
    // Peak 9 rounds up to a 10 ceiling, so the axis reads 0 / 5 / 10.
    expect(html).toMatch(/>0</);
    expect(html).toMatch(/>5</);
    expect(html).toMatch(/>10</);
  });

  it("summarises total, daily average and the peak day", () => {
    const html = markup(series);
    expect(html).toContain("Total");
    expect(html).toMatch(/>15</); // 2 + 9 + 4 + 0
    expect(html).toContain("Peak");
    expect(html).toContain("on 11-02");
  });

  it("keeps the first and last x labels so the window is readable", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      label: `d${String(i + 1).padStart(2, "0")}`,
      value: i,
    }));
    const html = markup(many);
    expect(html).toContain(">d01<");
    expect(html).toContain(">d30<");
    // Six labels at most: 30 dates would otherwise crowd into an unreadable band.
    const xLabels = html.match(/>d\d\d</g) ?? [];
    expect(xLabels.length).toBeLessThanOrEqual(6);
  });

  it("gives every point a tooltip with its value and unit", () => {
    const html = markup(series);
    expect(html).toContain("11-02: 9 page views");
  });

  it("colours the labels with a theme token, never a bare class that may not exist", () => {
    const html = markup(series);
    expect(html).toContain("fill:var(--gray-50)");
  });
});
