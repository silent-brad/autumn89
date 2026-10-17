import prologue
import std/[options, strutils]
import common
import results
import checksums/sha1
import ../database/[models, walkers as db_walkers, families]
import ../types, ../templates, ../utils

proc settings_page*(ctx: Context) {.async.} = gc_safe:
  let session = require_walker(ctx)
  if session.is_none: return
  let w = get_walker_by_id(db_conn, session.get().walker_id)
  if w.is_some: html_resp(ctx, render_settings(w, session))
  else: redirect_resp(ctx, "/login")

proc do_settings*(ctx: Context) {.async.} = gc_safe:
  let session = require_walker(ctx)
  if session.is_none: return
  let name = ctx.get_form_params("name").strip()
  if name == "": html_resp(ctx, html_error("Name is required")); return
  if not validate_name(name): html_resp(ctx, html_error("Invalid name format")); return
  let walker_opt = get_walker_by_id(db_conn, session.get().walker_id)
  if walker_opt.is_none: html_resp(ctx, html_error("Walker not found")); return
  try: update_walker_name(db_conn, session.get().walker_id, name)
  except: html_resp(ctx, html_error("Error updating profile")); return
  let avatar = try_upload(ctx, "avatar", "avatars")
  if avatar.is_err():
    html_resp(ctx, html_error(avatar.error())); return
  if avatar.get() != "":
    update_walker_avatar(db_conn, avatar.get(), session.get().walker_id)
    ctx.session["avatar_filename"] = avatar.get()
  let cur_pw = ctx.get_form_params("current_password").strip()
  let new_pw = ctx.get_form_params("new_password").strip()
  let confirm_pw = ctx.get_form_params("confirm_new_password").strip()
  if cur_pw != "" and new_pw != "":
    if new_pw != confirm_pw: html_resp(ctx, html_error("New passwords do not match")); return
    if new_pw.len < 8: html_resp(ctx, html_error("Password must be at least 8 characters")); return
    let fam = get_family_by_id(db_conn, session.get().family_id)
    if fam.is_none: html_resp(ctx, html_error("Family account not found")); return
    if $secure_hash(cur_pw) != fam.get().password_hash:
      html_resp(ctx, html_error("Current password is incorrect")); return
    try: update_family_password(db_conn, session.get().family_id, $secure_hash(new_pw))
    except: html_resp(ctx, html_error("Error updating password")); return
  hx_redirect(ctx, "/dashboard?success=settings")
