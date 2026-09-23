import norm/[model, pragmas]
import std/[macros, times]

proc now_local*(): string =
  now().format("yyyy-MM-dd HH:mm:ss")

type
  Family* {.table_name: "family".} = ref object of Model
    email*: string
    password_hash*: string
    created_at*: string

  Walker* {.table_name: "walker".} = ref object of Model
    family_id* {.fk: Family.}: int64
    name*: string
    has_custom_avatar*: bool
    avatar_filename*: string
    created_at*: string

  MileEntry* {.table_name: "mile_entry".} = ref object of Model
    walker_id* {.fk: Walker.}: int64
    miles*: float
    logged_at*: string

  Post* {.table_name: "post".} = ref object of Model
    walker*: Walker
    text_content*: string
    created_at*: string

  PostImage* {.table_name: "post_image".} = ref object of Model
    post_id* {.fk: Post.}: int64
    filename*: string
    created_at*: string

macro gen_new(T: typedesc): untyped =
  let sym = T.get_type_inst[1]
  let proc_name = postfix(ident("new" & sym.str_val), "*")
  let obj_ty = sym.get_type_impl[0].get_type_impl
  var params = new_nim_node(nnk_formal_params)
  params.add sym
  var constr = new_nim_node(nnk_obj_constr)
  constr.add sym
  for field in obj_ty[2]:
    let name = ident(field[0].str_val)
    let typ = field[1]
    let def_val = case typ.str_val
      of "string": new_lit("")
      of "int64": new_lit(0'i64)
      of "float": new_lit(0.0)
      of "bool": new_lit(false)
      else:
        if typ.get_type_impl.kind == nnk_ref_ty:
          new_call(ident("new" & typ.str_val))
        else:
          new_empty_node()
    params.add new_ident_defs(name, typ, def_val)
    constr.add new_colon_expr(name, name)
  result = new_proc(proc_name, body = constr)
  result[0] = proc_name
  result[3] = params
  result.add_pragma(ident("noSideEffect"))

gen_new(Family)
gen_new(Walker)
gen_new(MileEntry)
gen_new(Post)
gen_new(PostImage)
