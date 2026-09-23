import prologue
import std/[options, strutils, os]
import common
import ../database/[posts as db_posts]
import ../types, ../templates, ../utils

proc collect_uploaded_images*(ctx: Context): seq[string] =
  result = @[]
  for i in 0..<10:
    let field = "image_" & $i
    let filename = try_upload(ctx, field, "pictures")
    if filename == "": break
    result.add(filename)

proc posts_page*(ctx: Context) {.async.} = gc_safe:
  let session = require_login(ctx)
  if session.is_none: return
  const ps = 10
  let all_posts = get_posts_paginated(db_conn, ps + 1, 0)
  let has_more = all_posts.len > ps
  let posts_with_images = hydrate_posts(db_conn, if has_more: all_posts[0 ..< ps] else: all_posts)
  html_resp(ctx, render_posts_page(posts_with_images,
            session, has_more = has_more, next_page = 2))

proc do_create_post*(ctx: Context) {.async.} = gc_safe:
  let session = require_walker(ctx)
  if session.is_none: return
  let text_content = sanitize_html(ctx.get_form_params("text_content").strip())
  let image_filenames = collect_uploaded_images(ctx)
  if text_content.strip() == "" and image_filenames.len == 0:
    html_resp(ctx, html_error("Please provide text content or an image.")); return
  try:
    discard create_post(db_conn, session.get().walker_id, text_content, image_filenames)
    hx_redirect(ctx, "/posts")
  except Exception as e:
    echo "Error creating post: ", e.msg
    html_resp(ctx, html_error("Failed to save your post."), Http500)

proc do_edit_post*(ctx: Context) {.async.} = gc_safe:
  let session = require_walker(ctx)
  if session.is_none: return
  try:
    let post_id = parse_biggest_int(ctx.get_form_params("post_id"))
    let post = get_post_by_id(db_conn, post_id)
    if post.walker.id != session.get().walker_id:
      html_resp(ctx, html_error("You can only edit your own posts"), Http403); return
    let text_content = sanitize_html(ctx.get_form_params("text_content").strip())

    # Remove selected existing images
    let remove_ids_str = ctx.get_form_params("remove_image_ids", "")
    for id_str in remove_ids_str.split(","):
      let trimmed = id_str.strip()
      if trimmed == "": continue
      let img_id = parse_biggest_int(trimmed)
      let filename = delete_post_image_by_id(db_conn, img_id)
      if filename != "" and file_exists("pictures" / filename):
        remove_file("pictures" / filename)

    # Add new uploads
    let uploaded = collect_uploaded_images(ctx)
    add_post_images(db_conn, post_id, uploaded)

    # Update text
    update_post_text(db_conn, post_id, text_content)

    # Validation: must have text or at least one image
    let remaining_images = get_post_images(db_conn, post_id)
    if text_content.strip() == "" and remaining_images.len == 0:
      html_resp(ctx, html_error("Please provide text content or an image.")); return

    hx_redirect(ctx, "/posts")
  except:
    html_resp(ctx, html_error("Invalid post"))

proc do_delete_post*(ctx: Context) {.async.} = gc_safe:
  let session = require_walker(ctx)
  if session.is_none: return
  try:
    let post_id = parse_biggest_int(ctx.get_form_params("post_id"))
    let post = get_post_by_id(db_conn, post_id)
    if post.walker.id != session.get().walker_id:
      html_resp(ctx, html_error("You can only delete your own posts"), Http403); return
    delete_post(db_conn, post_id)
    hx_redirect(ctx, "/posts")
  except:
    html_resp(ctx, html_error("Invalid post"))

proc api_post_feed*(ctx: Context) {.async.} = gc_safe:
  let session = require_login(ctx)
  if session.is_none: return
  const ps = 10
  var page = 1
  try: page = parse_int(ctx.get_query_params("page", "1"))
  except: discard
  let offset = (page - 1) * ps
  let all_posts = get_posts_paginated(db_conn, ps + 1, offset)
  let has_more = all_posts.len > ps
  let display = if has_more: all_posts[0 ..< ps] else: all_posts
  let posts_with_images = hydrate_posts(db_conn, display)
  html_resp(ctx, render_post_feed(posts_with_images, has_more = has_more, next_page = page + 1, session = session))
