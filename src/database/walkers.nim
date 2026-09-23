import norm/sqlite
from db_connector/db_sqlite as rawdb import nil
import std/[options, os, httpclient, strutils]
import ../upload
import models

proc get_walker_by_id*(db: DbConn, walker_id: int64): Option[Walker] =
  var walker = new_walker()
  try:
    db.select(walker, "id = ?", walker_id)
    some(walker)
  except NotFoundError:
    none(Walker)

proc get_walkers_by_family*(db: DbConn, family_id: int64): seq[Walker] =
  var walkers = @[new_walker()]
  db.select(walkers, "family_id = ? ORDER BY created_at ASC", family_id)
  walkers

proc create_generic_avatar(name: string): string =
  let client = new_http_client()
  defer: client.close()
  let avatar_data = client.get_content("https://ui-avatars.com/api/?background=random&name=" & name.replace(" ", "%20") & "&format=webp")
  avatar_data.save_uploaded_file("webp", "avatars")

proc create_walker_account*(db: DbConn, family_id: int64, name: string): (int64, string) =
  let avatar_filename = create_generic_avatar(name)
  var walker = new_walker(family_id, name, false, avatar_filename, now_local())
  db.insert(walker)
  (walker.id, avatar_filename)

proc update_walker_name*(db: DbConn, walker_id: int64, name: string) =
  let walker_opt = db.get_walker_by_id(walker_id)
  if walker_opt.is_some:
    var walker = walker_opt.get()
    walker.name = name
    db.update(walker)
    if not walker.has_custom_avatar:
      let old_avatar = walker.avatar_filename
      walker.avatar_filename = create_generic_avatar(name)
      db.update(walker)
      if old_avatar.len > 0 and file_exists("avatars/" & old_avatar):
        remove_file("avatars/" & old_avatar)

proc update_walker_avatar*(db: DbConn, avatar_filename: string, walker_id: int64) =
  var walker = new_walker()
  db.select(walker, "id = ?", walker_id)
  walker.has_custom_avatar = true
  walker.avatar_filename = avatar_filename
  db.update(walker)

proc delete_walker_account*(db: DbConn, walker_id: int64) =
  let walker_opt = get_walker_by_id(db, walker_id)
  if walker_opt.is_some:
    let walker = walker_opt.get()
    if walker.avatar_filename.len > 0:
      let path = "avatars" / walker.avatar_filename
      if file_exists(path):
        try: remove_file(path)
        except: discard
    for row in rawdb.get_all_rows(db, rawdb.sql"SELECT filename FROM post_image WHERE post_id IN (SELECT id FROM post WHERE walker = ?)", $walker_id):
      if row[0].len > 0:
        let path = "pictures" / row[0]
        if file_exists(path):
          try: remove_file(path)
          except: discard
    rawdb.exec(db, rawdb.sql"DELETE FROM post_image WHERE post_id IN (SELECT id FROM post WHERE walker = ?)", $walker_id)
    rawdb.exec(db, rawdb.sql"DELETE FROM mile_entry WHERE walker_id = ?", $walker_id)
    rawdb.exec(db, rawdb.sql"DELETE FROM post WHERE walker = ?", $walker_id)
    rawdb.exec(db, rawdb.sql"DELETE FROM walker WHERE id = ?", $walker_id)
