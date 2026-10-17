import strutils, os
from times import DateTime, format, monthday, parse

proc html_escape*(s: string): string =
  result = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#x27;")

proc sanitize_html*(html: string): string =
  result = html
  
  # Remove script tags and content
  while true:
    let s = result.find("<script")
    if s == -1: break
    let e = result.find("</script>", s)
    if e != -1:
      result.delete(s..e+8)
    else:
      result.set_len(s)
      break
  
  # Neutralize dangerous attributes
  for attr in ["onclick", "onload", "onerror", "onmouseover", "onfocus", 
               "onblur", "onkeypress", "onsubmit", "onchange"]:
    result = result.replace(attr & "=", "data-removed-" & attr & "=")
  result = result.replace("javascript:", "data-removed-javascript:")
  result = result.replace("data:", "data-removed:")
  
  # Whitelist allowed tags
  const allowed = ["b", "i", "u", "strong", "em", "a", "h1", "h2", "h3", 
                   "h4", "h5", "h6", "blockquote", "cite", "ul", "ol", 
                   "li", "p", "br", "img"]
  
  var i = 0
  while i < result.len:
    let open = result.find('<', i)
    if open == -1: break
    let close = result.find('>', open)
    if close == -1: break
    
    let content = result[open+1..close-1].strip()
    if content.len == 0:
      i = close + 1
      continue
    
    let is_close = content[0] == '/'
    var name = (if is_close: content[1..^1] else: content).split(' ')[0].split('\t')[0].to_lower_ascii()
    
    if name notin allowed:
      result.delete(open..close)
      continue
    
    if name == "a":
      let h = content.find("href=")
      let tag = if h != -1: "a href=" & content[h+5..^1].split(' ')[0] & ">"
                else: "a>"
      result = result[0..open] & tag & result[close+1..^1]
      i = open + tag.len
      
    elif name == "img":
      var attrs: seq[string]
      let s = content.find("src=")
      if s != -1: attrs.add("src=" & content[s+4..^1].split(' ')[0])
      let a = content.find("alt=")
      if a != -1: attrs.add("alt=" & content[a+4..^1].split(' ')[0])
      
      if attrs.len > 0:
        let tag = "img " & attrs.join(" ") & ">"
        result = result[0..open] & tag & result[close+1..^1]
        i = open + tag.len
      else:
        result.delete(open..close)
    else:
      i = close + 1

proc sanitize_filename*(filename: string): string =
  result = filename.replace("/", "").replace("\\", "").replace("..", "").replace(":", "").replace("*", "").replace("?", "").replace("\"", "").replace("<", "").replace(">", "").replace("|", "")
  if result.strip() == "": result = "unnamed_file"

proc validate_email*(email: string): bool =
  if email.len == 0 or email.len > 254: return false
  let at_pos = email.find('@')
  if at_pos == -1 or at_pos == 0 or at_pos == email.len - 1: return false
  let domain_part = email[at_pos + 1 .. ^1]
  let dot_pos = domain_part.rfind('.')
  if dot_pos == -1 or dot_pos == 0 or dot_pos == domain_part.len - 1: return false
  for c in email:
    if not (c.is_alpha_numeric() or c in "@.-_+"): return false
  return true

proc validate_name*(name: string): bool =
  if name.len == 0 or name.len > 100: return false
  for c in name:
    if not (c.is_alpha_numeric() or c in " -'"): return false
  return true

proc is_safe_file_extension*(filename: string): bool =
  let ext = filename.split_file().ext.to_lower_ascii()
  ext in @[".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic"]

proc fmt_miles*(miles: float): string =
  let s = format_float(miles, ff_decimal, 1)
  if s.ends_with(".0"): s[0 .. ^3] else: s

proc error_div*(msg: string): string =
  """<div class="error solid">""" & msg & "</div>"

proc success_div*(msg: string): string =
  """<div class="success solid">""" & msg & "</div>"

proc html_error*(msg: string): string =
  """<p class="text-muted">""" & msg & "</p>"

proc html_success*(msg: string): string =
  """<p class="text-muted">""" & msg & "</p>"

proc format_month_name*(date: string): string =
  ## Convert "YYYY-MM-DD" to "Apr 15th" style for tooltips
  try:
    let dt = parse(date, "yyyy-MM-dd")
    let day = dt.monthday()
    let suffix = if day mod 10 == 1 and day != 11: "st"
                 elif day mod 10 == 2 and day != 12: "nd"
                 elif day mod 10 == 3 and day != 13: "rd"
                 else: "th"
    result = dt.format("MMM ") & $day & suffix
  except:
    result = date

proc format_date_with_ordinal*(dt_str: string): string =
  # Parse "yyyy-MM-dd HH:mm:ss" string and format like "9:02pm, Dec 12th, 2025"
  try:
    let
      dt = parse(dt_str, "yyyy-MM-dd HH:mm:ss")
      date_part = dt_str[0..9]
      month_day = format_month_name(date_part)
      time_part = dt.format("h:mmtt, ")
    return time_part & month_day & dt.format(", yyyy")
  except:
    return dt_str
