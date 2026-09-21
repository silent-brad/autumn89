import prologue
import std/[options, strutils, json, os]
import norm/sqlite
import ../database/models
import ../types, ../utils, ../upload

var db_conn*: DbConn
var PASSKEY*: string

template gc_safe*(body: untyped) =
  {.cast(gcsafe).}:
    body

# -- Session helpers --

proc get_session*(ctx: Context): Option[SessionData] =
  let fid = ctx.session.get_or_default("family_id", "")
  if fid == "": return none(SessionData)
  some(SessionData(
    family_id: parse_biggest_int(fid),
    walker_id: parse_biggest_int(ctx.session.get_or_default("walker_id", "0")),
    email: ctx.session.get_or_default("email", ""),
    name: ctx.session.get_or_default("name", ""),
    avatar_filename: ctx.session.get_or_default("avatar_filename", ""),
    is_family_session: ctx.session.get_or_default("is_family_session", "true") == "true"
  ))

proc set_family_session*(ctx: Context, family: Family) =
  ctx.session["family_id"] = $family.id
  ctx.session["walker_id"] = "0"
  ctx.session["email"] = family.email
  ctx.session["name"] = ""
  ctx.session["avatar_filename"] = ""
  ctx.session["is_family_session"] = "true"

proc set_walker_session*(ctx: Context, family_id: int64, email: string, walker: Walker) =
  ctx.session["family_id"] = $family_id
  ctx.session["walker_id"] = $walker.id
  ctx.session["email"] = email
  ctx.session["name"] = walker.name
  ctx.session["avatar_filename"] = walker.avatar_filename
  ctx.session["is_family_session"] = "false"

# -- Response helpers --

proc html_resp*(ctx: Context, body: string, code: HttpCode = Http200) =
  resp html_response(body, code, headers = ctx.response.headers)

proc redirect_resp*(ctx: Context, url: string) =
  if ctx.request.has_header("HX-Request"):
    ctx.response.set_header("HX-Redirect", url)
    resp html_response("", headers = ctx.response.headers)
  else:
    resp redirect(url, Http302, headers = ctx.response.headers)

proc hx_redirect*(ctx: Context, url: string) =
  ctx.response.set_header("HX-Redirect", url)
  html_resp(ctx, "")

proc json_resp*(ctx: Context, data: JsonNode) =
  ctx.response.set_header("Content-Type", "application/json")
  html_resp(ctx, $data)

proc require_walker*(ctx: Context): Option[SessionData] =
  let s = get_session(ctx)
  if s.is_none: redirect_resp(ctx, "/login"); return none(SessionData)
  if s.get().is_family_session: redirect_resp(ctx, "/select-walker"); return none(SessionData)
  s

proc require_login*(ctx: Context): Option[SessionData] =
  let s = get_session(ctx)
  if s.is_none: redirect_resp(ctx, "/login"); return none(SessionData)
  s

proc to_display_entries*(leaderboard: seq[tuple[walker: Walker, total_miles: float]]): seq[Entry] =
  for e in leaderboard:
    result.add Entry(walker: e.walker, total_miles: e.total_miles,
                     progress_percent: min(e.total_miles / 89.0 * 100.0, 100.0))

proc try_upload*(ctx: Context, field, dir: string): string =
  try:
    let f = ctx.get_upload_file(field)
    if f.filename.len == 0: return ""
    let safe = sanitize_filename(f.filename)
    if not is_safe_file_extension(safe): return ""
    if f.body.len > 10_485_760: return ""
    let ext = if safe.contains("."): safe.split(".")[^1].to_lower_ascii() else: "jpg"
    save_uploaded_file(f.body, ext, dir)
  except: ""
