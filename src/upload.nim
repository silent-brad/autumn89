import strutils, os, strformat, random
from times import format, now, get_time, to_unix
import std/sha1

randomize(get_time().to_unix() + get_current_process_id())

proc generate_random_filename*(extension: string = "webp",
    directory: string = ""): string =
  let timestamp = $get_time().to_unix()
  let process_id = $get_current_process_id()
  var random_data = ""
  for i in 0..<32:
    random_data.add(char(rand(255)))
  let combined = timestamp & process_id & random_data
  let hash = $secure_hash(combined)
  let base_filename = hash[0..15] & "." & extension
  if directory.len > 0:
    var final_filename = base_filename
    var counter = 0
    while file_exists(directory / final_filename) and counter < 1000:
      let new_hash = $secure_hash(combined & $counter)
      final_filename = new_hash[0..15] & "." & extension
      inc(counter)
    return final_filename
  return base_filename

proc save_uploaded_file*(file_data: string, original_ext: string,
    directory: string = "pictures"): string =
  if file_data.len == 0:
    return ""
  let random_filename = generate_random_filename("webp", directory)
  if not dir_exists(directory):
    create_dir(directory)
  if original_ext == "webp":
    let filepath = directory / random_filename
    write_file(filepath, file_data)
    return random_filename
  else:
    let temp_filename = generate_random_filename(original_ext, directory)
    let temp_filepath = directory / temp_filename
    write_file(temp_filepath, file_data)
    let webp_filepath = directory / random_filename
    try:
      var magick_cmd: string
      if directory == "avatars":
        magick_cmd = &"magick \"{temp_filepath}\" -auto-orient -resize 400x400^ -gravity center -crop 400x400+0+0 +repage \"{webp_filepath}\""
      else:
        magick_cmd = &"magick \"{temp_filepath}\" -auto-orient -resize 600 \"{webp_filepath}\""
      let result = exec_shell_cmd(magick_cmd)
      if result == 0 and file_exists(webp_filepath):
        if file_exists(temp_filepath):
          remove_file(temp_filepath)
        return random_filename
      else:
        raise new_exception(IOError, "ImageMagick conversion failed")
    except Exception as e:
      echo &"Image conversion failed: {e.msg}, saving original file"
      if file_exists(temp_filepath):
        remove_file(temp_filepath)
      let fallback_filename = generate_random_filename(original_ext, directory)
      let fallback_filepath = directory / fallback_filename
      write_file(fallback_filepath, file_data)
      return fallback_filename
