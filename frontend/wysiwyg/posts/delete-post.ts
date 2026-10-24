export function deletePost(postId: number): void {
  if (!confirm("Delete this post?")) return;

  fetch("/delete-post", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `post_id=${postId}`,
  }).then((r) => {
    const redirect = r.headers.get("HX-Redirect");

    if (redirect) {
      window.location.href = redirect;
    } else if (r.ok) {
      window.location.reload();
    }
  });
}
