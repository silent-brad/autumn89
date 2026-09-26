import std/[strutils, strformat, math, sequtils, times]
import utils

type MileDays = seq[tuple[date: string, miles: float]]

proc render_miles_chart*(data: MileDays): string =
  const
    width = 300
    height = 200
    pad_left = 40
    pad_bottom = 60
    pad_top = 10
    pad_right = 10
    start_date_str = "2026-09-22"

  let chart_w = width - pad_left - pad_right
  let chart_h = height - pad_top - pad_bottom

  # Build complete dataset from start_date to today with zero-filled gaps
  let start_date = parse(start_date_str, "yyyy-MM-dd")
  let end_date = now().format("yyyy-MM-dd").parse("yyyy-MM-dd")
  
  var plot_data: MileDays = @[]
  var current = start_date
  while current <= end_date:
    let date_str = current.format("yyyy-MM-dd")
    var miles = 0.0
    for d in data:
      if d.date == date_str:
        miles = d.miles
        break
    plot_data.add((date: date_str, miles: miles))
    current += 1.days

  # Compute Y range
  let max_miles = max(plot_data.map_it(it.miles))
  let y_max = if max_miles <= 0.0: 1.0
              elif plot_data.len == 1: ceil(max_miles + 1.0)
              else: ceil(max_miles * 1.1)

  # Compute number of Y ticks (aim for ~4-5)
  let raw_step = y_max / 4.0
  let magnitude = pow(10.0, floor(log10(if raw_step > 0: raw_step else: 1.0)))
  let nice_step = if raw_step / magnitude < 1.5: magnitude
                  elif raw_step / magnitude < 3.5: 2.0 * magnitude
                  elif raw_step / magnitude < 7.5: 5.0 * magnitude
                  else: 10.0 * magnitude
  let y_tick_step = if nice_step > 0: nice_step else: 1.0
  let y_ceil = ceil(y_max / y_tick_step) * y_tick_step
  let effective_y_max = if y_ceil > 0: y_ceil else: y_max

  # Map data to SVG coordinates
  proc to_x(i: int): float =
    if plot_data.len == 1:
      return float(pad_left) + float(chart_w) / 2.0
    return float(pad_left) + float(i) / float(plot_data.len - 1) * float(chart_w)

  proc to_y(miles: float): float =
    return float(pad_top) + float(chart_h) * (1.0 - miles / effective_y_max)

  var svg = ""

  # SVG header
  svg.add fmt"""<div class="chart-container"><svg class="miles-chart-svg" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">"""

  # Y-axis gridlines and tick labels
  var tick_val = 0.0
  while tick_val <= effective_y_max + 0.001:
    let y = to_y(tick_val)
    svg.add fmt"""<line x1="{pad_left}" y1="{y:.1f}" x2="{width - pad_right}" y2="{y:.1f}" class="chart-grid"/>"""
    let label = if tick_val == floor(tick_val): $int(tick_val) else: format_float(tick_val, ff_decimal, 1)
    svg.add fmt"""<text x="{pad_left - 4}" y="{y + 3.0:.1f}" text-anchor="end" class="chart-label chart-label-tick">{label}</text>"""
    tick_val += y_tick_step

  # Y-axis label
  let y_label_y = pad_top + chart_h div 2
  svg.add fmt"""<text x="10" y="{y_label_y}" text-anchor="middle" class="chart-label chart-label-axis" transform="rotate(-90 10 {y_label_y})">Miles</text>"""

  # X-axis label
  let x_label_x = pad_left + chart_w div 2
  svg.add fmt"""<text x="{x_label_x}" y="{height - 4}" text-anchor="middle" class="chart-label chart-label-axis">Date</text>"""

  # X-axis date labels (show every Nth to avoid overlap)
  let max_labels = chart_w div 18  # ~18px per label for tighter spacing
  let label_step = if plot_data.len <= max_labels: 1
                   else: (plot_data.len + max_labels - 1) div max_labels
  for i in 0 ..< plot_data.len:
    if i mod label_step == 0 or i == plot_data.len - 1:
      let x = to_x(i)
      let label = format_month_name(plot_data[i].date)
      let ty = float(height - pad_bottom + 10)
      svg.add fmt"""<text x="{x:.1f}" y="{ty:.1f}" text-anchor="end" class="chart-label chart-label-date" transform="rotate(-45 {x:.1f} {ty:.1f})">{label}</text>"""

  # Fill area under the line
  if plot_data.len >= 2:
    var fill_path = fmt"M{to_x(0):.1f},{to_y(0.0):.1f}"
    for i in 0 ..< plot_data.len:
      let x = to_x(i)
      let y = to_y(plot_data[i].miles)
      fill_path.add fmt" L{x:.1f},{y:.1f}"
    fill_path.add fmt" L{to_x(plot_data.len - 1):.1f},{to_y(0.0):.1f} Z"
    svg.add fmt"""<path d="{fill_path}" class="chart-fill"/>"""

  # Line
  if plot_data.len >= 2:
    var line_path = fmt"M{to_x(0):.1f},{to_y(plot_data[0].miles):.1f}"
    for i in 1 ..< plot_data.len:
      let x = to_x(i)
      let y = to_y(plot_data[i].miles)
      line_path.add fmt" L{x:.1f},{y:.1f}"
    svg.add fmt"""<path d="{line_path}" class="chart-line"/>"""

  # Data points with tooltips (only for days with miles > 0)
  for i in 0 ..< plot_data.len:
    if plot_data[i].miles > 0:
      let x = to_x(i)
      let y = to_y(plot_data[i].miles)
      let miles_str = format_float(plot_data[i].miles, ff_decimal, 1)
      let date_label = format_month_name(plot_data[i].date)
      let tooltip = date_label & ": " & miles_str & " mi"
      svg.add fmt"""<g class="chart-point-group" data-tooltip="{tooltip}">"""
      svg.add fmt"""<circle cx="{x:.1f}" cy="{y:.1f}" r="12" class="chart-hit-target"/>"""
      svg.add fmt"""<circle cx="{x:.1f}" cy="{y:.1f}" r="3" class="chart-point"/>"""
      svg.add fmt"""<circle cx="{x:.1f}" cy="{y:.1f}" r="1" class="chart-point-inner"/>"""
      svg.add "</g>"

  svg.add "</svg>"
  svg.add """<div class="chart-tooltip" style="display:none;position:absolute;z-index:10"></div>"""
  svg.add "</div>"
  return svg
