import database/models
export Walker, Family, MileEntry, Post, PostImage

type
  SessionData* = object
    family_id*: int64
    walker_id*: int64
    email*: string
    name*: string
    avatar_filename*: string
    is_family_session*: bool

  Entry* = object
    walker*: Walker
    total_miles*: float
    progress_percent*: float

  PostWithImages* = object
    post*: Post
    images*: seq[PostImage]

const
  static_dir* = "static"
  port* = 9006
