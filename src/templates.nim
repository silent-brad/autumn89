import options
import nimja/parser
import os
import std/macros
import types, utils
import database/models

const base_dir = get_script_dir() & "/../templates/"

macro opt_proc(p: untyped): untyped =
  ## Rewrites `?Type` params into `Option[Type] = none(Type)`.
  let proc_def = if p.kind == nnk_stmt_list: p[0] else: p
  expect_kind(proc_def, {nnk_proc_def, nnk_func_def})
  result = proc_def.copy_nim_tree()
  for i in 1 ..< result[3].len:
    let def = result[3][i]
    if def.kind != nnk_ident_defs: continue
    let t = def[^2]
    if t.kind == nnk_prefix and t[0].eq_ident("?"):
      let base = t[1]
      def[^2] = nnk_bracket_expr.new_tree(ident"Option", base)
      if def[^1].kind == nnk_empty:
        def[^1] = new_call(ident"none", base)

macro define_renderer(name: untyped, tmpl: static string, body: untyped): untyped =
  ## Generates a renderer proc from a colon-block param list.
  ## Use `?Type` for optional params that default to `none(Type)`.
  var formal_params = new_nim_node(nnk_formal_params)
  formal_params.add ident"string"
  for param in body:
    let param_name = param[0]
    let inner = param[1][0]
    case inner.kind
    of nnk_prefix:
      let base = inner[1]
      let opt_type = nnk_bracket_expr.new_tree(ident"Option", base)
      formal_params.add new_ident_defs(param_name, opt_type, new_call(ident"none", base))
    of nnk_asgn:
      formal_params.add new_ident_defs(param_name, inner[0], inner[1])
    else:
      formal_params.add new_ident_defs(param_name, inner)
  let proc_name = postfix(name, "*")
  let base_dir = ident"base_dir"
  let proc_body = quote do:
    compile_template_file(`tmpl`, `baseDir`)
  result = new_proc(proc_name, body = proc_body)
  result[3] = formal_params
  result.add_pragma(ident"gcsafe")

opt_proc:
  proc render_template*(template_name: static string,
      session: ?SessionData, error_message: ?string, success_message: ?string,
      name: ?string, miles: ?string,
      current_total: ?float, progress_percent: ?float,
      walker_id: ?int64, email: ?string,
      entries_html: string = "",
      chart_html: string = ""): string {.gcsafe.} =
    compile_template_file(template_name, base_dir)

define_renderer render_leaderboard, "leaderboard.jinja":
  session: ?SessionData
  success_message: ?string
  user_stats: seq[Entry] = @[]
  has_more: bool = false
  next_page: int = 2
  offset: int = 0
  current_page: int = 1

define_renderer render_leaderboard_table, "leaderboard_table.jinja":
  user_stats: seq[Entry] = @[]
  has_more: bool = false
  next_page: int = 2
  offset: int = 0
  current_page: int = 1

define_renderer render_settings, "settings.jinja":
  walker: ?Walker
  session: ?SessionData
  error_message: ?string
  success_message: ?string

define_renderer render_posts_page, "posts.jinja":
  posts: seq[PostWithImages]
  session: ?SessionData
  has_more: bool = false
  next_page: int = 2

define_renderer render_post_feed, "post_feed.jinja":
  posts: seq[PostWithImages]
  has_more: bool = false
  next_page: int = 2
  session: ?SessionData

define_renderer render_mile_entries_table, "mile_entries_table.jinja":
  entries: seq[MileEntry]
  has_more: bool = false
  next_page: int = 2

define_renderer render_walker_selection, "select-walker.jinja":
  walkers: seq[Walker]
  session: ?SessionData
  success_message: ?string
  error_message: ?string
