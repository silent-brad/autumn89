import prologue
import std/[options, strutils, strformat]
import common
import ../database/[models, miles as db_miles]
import ../types, ../templates, ../utils, ../chart

proc dashboard_page*(ctx: Context) {.async.} = gc_safe:
  let session = require_walker(ctx)
  if session.is_none: return
  let wid = session.get().walker_id
  let total = get_user_total_miles(db_conn, wid)
  let pct = min(total / 89.0 * 100.0, 100.0)
  var msg = none(string)
  if "success=signup" in ctx.request.query: msg = some("Account created successfully! Welcome to Autumn89!")
  elif "success=login" in ctx.request.query: msg = some("Login successful! Welcome back to Autumn89!")
  const ps = 10
  let recent = get_user_recent_entries(db_conn, wid, ps + 1, 0)
  let has_more_entries = recent.len > ps
  let entries = if has_more_entries: recent[0 ..< ps] else: recent
  let entries_html = render_mile_entries_table(entries, has_more = has_more_entries, next_page = 2)
  let chart_data = get_user_miles_by_date(db_conn, wid)
  let chart_html = render_miles_chart(chart_data)
  html_resp(ctx, render_template("dashboard.jinja", session, success_message = msg,
            current_total = some(total), progress_percent = some(pct),
            entries_html = entries_html, chart_html = chart_html))

proc log_page*(ctx: Context) {.async.} = gc_safe:
  let session = require_walker(ctx)
  if session.is_none: return
  let total = get_user_total_miles(db_conn, session.get().walker_id)
  html_resp(ctx, render_template("dashboard.jinja", session,
            current_total = some(total), progress_percent = some(min(total / 89.0 * 100.0, 100.0))))

proc do_log_miles*(ctx: Context) {.async.} = gc_safe:
  let session = require_walker(ctx)
  if session.is_none: return
  try:
    let miles = parse_float(ctx.get_post_params("miles"))
    if miles <= 0: html_resp(ctx, html_error("Miles must be positive")); return
    if miles > 50: html_resp(ctx, html_error("Miles cannot exceed 50 per entry")); return
    log_miles(db_conn, session.get().walker_id, miles)
    html_resp(ctx, html_success(&"Logged {miles:.1f} miles successfully!"))
  except:
    html_resp(ctx, html_error("Invalid miles value"))

proc do_edit_miles*(ctx: Context) {.async.} = gc_safe:
  let session = require_walker(ctx)
  if session.is_none: return
  try:
    let entry_id = parse_biggest_int(ctx.get_post_params("entry_id"))
    let entry = get_mile_entry_by_id(db_conn, entry_id)
    if entry.walker_id != session.get().walker_id:
      html_resp(ctx, html_error("You can only edit your own entries"), Http403); return
    let miles = parse_float(ctx.get_post_params("miles"))
    if miles <= 0: html_resp(ctx, html_error("Miles must be positive")); return
    if miles > 50: html_resp(ctx, html_error("Miles cannot exceed 50 per entry")); return
    update_mile_entry(db_conn, entry_id, miles)
    html_resp(ctx, html_success(&"Updated to {miles:.1f} miles successfully!"))
  except:
    html_resp(ctx, html_error("Invalid entry"))

proc do_delete_miles*(ctx: Context) {.async.} = gc_safe:
  let session = require_walker(ctx)
  if session.is_none: return
  try:
    let entry_id = parse_biggest_int(ctx.get_post_params("entry_id"))
    let entry = get_mile_entry_by_id(db_conn, entry_id)
    if entry.walker_id != session.get().walker_id:
      html_resp(ctx, html_error("You can only delete your own entries"), Http403); return
    delete_mile_entry(db_conn, entry_id)
    html_resp(ctx, html_success("Entry deleted successfully!"))
  except:
    html_resp(ctx, html_error("Invalid entry"))

proc leaderboard_page*(ctx: Context) {.async.} = gc_safe:
  let session = require_login(ctx)
  if session.is_none: return
  var msg = none(string)
  if "success=signup" in ctx.request.query: msg = some("Welcome to Autumn89!")
  elif "success=login" in ctx.request.query: msg = some("Welcome back to Autumn89!")
  const ps = 15
  let lb = get_leaderboard_paginated(db_conn, ps + 1, 0)
  let has_more = lb.len > ps
  let display = if has_more: lb[0 ..< ps] else: lb
  html_resp(ctx, render_leaderboard(session, msg, user_stats = to_display_entries(display),
            has_more = has_more, next_page = 2, offset = 0, current_page = 1))

proc api_leaderboard_table*(ctx: Context) {.async.} = gc_safe:
  let session = require_login(ctx)
  if session.is_none: return
  const ps = 15
  var page = 1
  try: page = parse_int(ctx.get_query_params("page", "1"))
  except: discard
  let offset = (page - 1) * ps
  let lb = get_leaderboard_paginated(db_conn, ps + 1, offset)
  let has_more = lb.len > ps
  let display = if has_more: lb[0 ..< ps] else: lb
  html_resp(ctx, render_leaderboard_table(to_display_entries(display),
            has_more = has_more, next_page = page + 1, offset = offset, current_page = page))

proc api_user_miles_chart*(ctx: Context) {.async.} = gc_safe:
  let session = require_walker(ctx)
  if session.is_none: return
  let data = get_user_miles_by_date(db_conn, session.get().walker_id)
  html_resp(ctx, render_miles_chart(data))

proc api_walker_chart*(ctx: Context) {.async.} = gc_safe:
  let session = require_login(ctx)
  if session.is_none: return
  try:
    let wid = parse_biggest_int(ctx.get_path_params("id"))
    let data = get_user_miles_by_date(db_conn, wid)
    html_resp(ctx, render_miles_chart(data))
  except:
    html_resp(ctx, "", Http404)

proc api_user_miles_entries*(ctx: Context) {.async.} = gc_safe:
  let session = require_walker(ctx)
  if session.is_none: return
  const ps = 10
  var page = 1
  try: page = parse_int(ctx.get_query_params("page", "1"))
  except: discard
  let offset = (page - 1) * ps
  let wid = session.get().walker_id
  let recent = get_user_recent_entries(db_conn, wid, ps + 1, offset)
  let has_more = recent.len > ps
  let display = if has_more: recent[0 ..< ps] else: recent
  html_resp(ctx, render_mile_entries_table(display, has_more = has_more, next_page = page + 1))
