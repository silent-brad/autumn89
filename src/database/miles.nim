import norm/sqlite
from db_connector/db_sqlite as rawdb import nil
import std/strutils
import models

proc log_miles*(db: DbConn, walker_id: int64, miles: float) =
  var entry = new_mile_entry(walker_id, miles, now_local())
  db.insert(entry)

proc get_user_total_miles*(db: DbConn, walker_id: int64): float =
  db.sum(MileEntry, "miles", dist = false, cond = "walker_id = ?", db_value(walker_id))

proc get_user_miles_by_date*(db: DbConn, walker_id: int64): seq[tuple[date: string, miles: float]] =
  result = @[]
  for row in rawdb.get_all_rows(db, rawdb.sql"SELECT DATE(logged_at) as date, SUM(miles) FROM mile_entry WHERE walker_id = ? GROUP BY DATE(logged_at) ORDER BY date ASC", $walker_id):
    result.add((row[0], parse_float(row[1])))

proc get_user_recent_entries*(db: DbConn, walker_id: int64, limit: int = 10, offset: int = 0): seq[MileEntry] =
  var entries = @[new_mile_entry()]
  db.select(entries, "walker_id = ? ORDER BY logged_at DESC LIMIT ? OFFSET ?", walker_id, limit, offset)
  entries

proc get_user_entry_count*(db: DbConn, walker_id: int64): int =
  int(db.count(MileEntry, col = "*", dist = false, cond = "walker_id = ?", db_value(walker_id)))

proc get_mile_entry_by_id*(db: DbConn, entry_id: int64): MileEntry =
  var entry = new_mile_entry()
  db.select(entry, "id = ?", entry_id)
  entry

proc update_mile_entry*(db: DbConn, entry_id: int64, miles: float) =
  var entry = new_mile_entry()
  db.select(entry, "id = ?", entry_id)
  entry.miles = miles
  db.update(entry)

proc delete_mile_entry*(db: DbConn, entry_id: int64) =
  var entry = new_mile_entry()
  entry.id = entry_id
  db.delete(entry)

proc get_leaderboard_paginated*(db: DbConn, limit: int, offset: int): seq[tuple[walker: Walker, total_miles: float]] =
  for row in rawdb.get_all_rows(db, rawdb.sql"""SELECT r.id, r.family_id, r.name, r.has_custom_avatar, r.avatar_filename, r.created_at, COALESCE(SUM(m.miles), 0) as total_miles FROM walker r LEFT JOIN mile_entry m ON r.id = m.walker_id GROUP BY r.id ORDER BY total_miles DESC LIMIT ? OFFSET ?""", $limit, $offset):
    result.add((Walker(id: parse_biggest_int(row[0]), family_id: parse_biggest_int(row[1]), name: row[2], has_custom_avatar: row[3] == "1", avatar_filename: row[4], created_at: row[5]), parse_float(row[6])))
