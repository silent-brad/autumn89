import std/unittest
import ../src/utils

suite "utility helpers":
  test "escapes HTML":
    check html_escape("<a href='x'>&") == "&lt;a href=&#x27;x&#x27;&gt;&amp;"

  test "rejects unsafe file extensions":
    check is_safe_file_extension("photo.png")
    check not is_safe_file_extension("script.svg")

  test "formats whole miles without a decimal":
    check fmt_miles(12.0) == "12"
    check fmt_miles(12.5) == "12.5"
