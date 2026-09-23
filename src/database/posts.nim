import norm/sqlite
from db_connector/db_sqlite as rawdb import nil
import std/[strutils, os]
import models
import ../types

proc create_post*(db: DbConn, walker_id: int64, text_content: string, image_filenames: seq[string]): int64 =
  db.exec(sql"BEGIN TRANSACTION")
  try:
    var walker = new_walker()
    db.select(walker, "id = ?", walker_id)
    var post = new_post(walker, text_content, now_local())
    db.insert(post)
    for filename in image_filenames:
      var img = new_post_image(post.id, filename, now_local())
      db.insert(img)
    db.exec(sql"COMMIT")
    post.id
  except:
    db.exec(sql"ROLLBACK")
    raise

proc get_posts_paginated*(db: DbConn, limit, offset: int): seq[Post] =
  var posts = @[new_post()]
  db.select(posts, "1 = 1 ORDER BY \"post\".created_at DESC LIMIT ? OFFSET ?", limit, offset)
  posts

proc get_post_by_id*(db: DbConn, post_id: int64): Post =
  var post = new_post()
  db.select(post, "\"post\".id = ?", post_id)
  post

proc get_post_images*(db: DbConn, post_id: int64): seq[PostImage] =
  var images = @[new_post_image()]
  try:
    db.select(images, "post_id = ? ORDER BY id ASC", post_id)
  except:
    return @[]
  result = @[]
  for img in images:
    if img.id > 0:
      result.add(img)

proc get_post_with_images*(db: DbConn, post_id: int64): PostWithImages =
  let post = get_post_by_id(db, post_id)
  let images = get_post_images(db, post_id)
  PostWithImages(post: post, images: images)

proc hydrate_posts*(db: DbConn, posts: seq[Post]): seq[PostWithImages] =
  for post in posts:
    let images = get_post_images(db, post.id)
    result.add(PostWithImages(post: post, images: images))

proc update_post_text*(db: DbConn, post_id: int64, text_content: string) =
  var post = new_post()
  db.select(post, "\"post\".id = ?", post_id)
  post.text_content = text_content
  db.update(post)

proc add_post_images*(db: DbConn, post_id: int64, image_filenames: seq[string]) =
  for filename in image_filenames:
    var img = new_post_image(post_id, filename, now_local())
    db.insert(img)

proc delete_post_image_by_id*(db: DbConn, image_id: int64): string =
  var img = new_post_image()
  db.select(img, "id = ?", image_id)
  result = img.filename
  img.id = image_id
  db.delete(img)

proc delete_post*(db: DbConn, post_id: int64) =
  let images = get_post_images(db, post_id)
  for img in images:
    let path = "pictures" / img.filename
    if file_exists(path):
      try: remove_file(path)
      except: discard
  rawdb.exec(db, rawdb.sql"DELETE FROM post_image WHERE post_id = ?", $post_id)
  var post = new_post()
  post.id = post_id
  db.delete(post)
