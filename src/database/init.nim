import norm/sqlite
from db_connector/db_sqlite as rawdb import nil
import models
export sqlite.DbConn

proc init_database*(): DbConn =
  let db = open("autumn89.db", "", "", "")
  db.exec(sql"PRAGMA foreign_keys = ON")

  # Migrate: rename post.walker_id → post.walker for NORM FK
  for row in rawdb.get_all_rows(db, rawdb.sql"PRAGMA table_info(post)"):
    if row[1] == "walker_id":
      rawdb.exec(db, rawdb.sql"ALTER TABLE post RENAME COLUMN walker_id TO walker")
      break

  db.create_tables(new_family())
  db.create_tables(new_walker())
  db.create_tables(new_mile_entry())
  db.create_tables(new_post())
  db
