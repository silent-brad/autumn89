import prologue
import std/[options, strutils]
import common
import checksums/sha1
import ../database/[models, families]
import ../types, ../templates, ../utils

proc index_page*(ctx: Context) {.async.} = gc_safe:
  html_resp(ctx, render_template("index.jinja", get_session(ctx)))

proc about_page*(ctx: Context) {.async.} = gc_safe:
  let session = get_session(ctx)
  let wid = if session.is_some and not session.get().is_family_session: some(session.get().walker_id) else: none(int64)
  html_resp(ctx, render_template("about.jinja", session, walker_id = wid))

proc login_page*(ctx: Context) {.async.} = gc_safe:
  html_resp(ctx, render_template("login.jinja", get_session(ctx)))

proc signup_page*(ctx: Context) {.async.} = gc_safe:
  html_resp(ctx, render_template("signup.jinja", get_session(ctx)))

proc not_found*(ctx: Context) {.async.} = gc_safe:
  html_resp(ctx, render_template("404.jinja", get_session(ctx)), Http404)

proc do_login*(ctx: Context) {.async.} = gc_safe:
  let email = ctx.get_post_params("email").strip()
  let password = ctx.get_post_params("password").strip()
  if email == "": html_resp(ctx, error_div("Email is required")); return
  if password == "": html_resp(ctx, error_div("Password is required")); return
  if not validate_email(email): html_resp(ctx, error_div("Invalid email format")); return
  let family_opt = get_family_by_email(db_conn, email)
  if family_opt.is_some and $secure_hash(password) == family_opt.get().password_hash:
    set_family_session(ctx, family_opt.get())
    hx_redirect(ctx, "/leaderboard?success=login")
  else:
    html_resp(ctx, error_div("Invalid email or password"))

proc do_signup*(ctx: Context) {.async.} = gc_safe:
  let passkey = ctx.get_post_params("passkey").strip().to_upper_ascii()
  let email = ctx.get_post_params("email").strip()
  let password = ctx.get_post_params("password").strip()
  if passkey == "": html_resp(ctx, error_div("Passkey is required")); return
  if email == "": html_resp(ctx, error_div("Email is required")); return
  if not validate_email(email): html_resp(ctx, error_div("Invalid email format")); return
  if password == "": html_resp(ctx, error_div("Password is required")); return
  if passkey != PASSKEY: html_resp(ctx, error_div("Invalid passkey")); return
  if get_family_by_email(db_conn, email).is_some: html_resp(ctx, error_div("Email already registered")); return
  try:
    let family_id = create_family_account(db_conn, email, $secure_hash(password))
    set_family_session(ctx, Family(id: family_id, email: email))
    hx_redirect(ctx, "/add-walker?success=signup")
  except Exception as e:
    echo "Error creating account: ", e.msg
    html_resp(ctx, error_div("Error creating account"))

proc do_logout*(ctx: Context) {.async.} = gc_safe:
  ctx.session.clear()
  redirect_resp(ctx, "/")
