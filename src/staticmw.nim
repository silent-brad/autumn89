import prologue
import std/[asyncdispatch, os, uri, strutils]

proc root_static_middleware*(static_dir: string): HandlerAsync =
  result = proc(ctx: Context) {.async.} =
    let path = ctx.request.path.decode_url.strip(chars = {'/'}, trailing = false)
    let real_path = static_dir / path
    if real_path.file_exists():
      let parts = split_file(real_path)
      await static_file_response(ctx, parts.name & parts.ext, parts.dir,
                                  buf_size = ctx.g_scope.settings.buf_size)
    else:
      await switch(ctx)
