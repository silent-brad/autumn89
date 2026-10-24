- [x] Add justfile

- [x] Fix posts (they currently don't work for some reason)

  - [x] Fix for create post
  - [x] Fix for edit post

- [x] Make it so that on editing a post, it displays the same for images as it does for create post

- [x] Setup automated deployments?

  - When a commit is pushed to master, "server" will auto pull, build, and restart
  - Integrate into Nix with Busybox?

- [x] Break up `components.css` into smaller files

- [x] Add test suite

  - [x] Add tests for `src`
  - [x] Add tests for `ts`
  - [ ] Add more tests for Nim

- [ ] Frontend

  - [x] Minify JS modules
  - [x] Move JS to TS
  - [?] Move some of JS to Nim
  - [?] Test JS with Nim

- [ ] Write ARCH.md

- [x] When editing a post, make the images draggable

  - [x] When editing a post, make it so that uploading an image(s) add them next to the other images

- [x] Move CSS/JS out of `static`
- [x] Minify CSS
- [x] Make sure fonts are small

<!-- - [ ] Consider adding tiny C compiler backend for debugging -->
<!---->
<!-- ``` -->
<!-- #For debugging as it compiles faster -->
<!-- "--cc:tcc" -->
<!-- "--gc:markAndSweep" -->
<!-- "--passL:-lm" -->
<!-- "--tlsEmulation:on" -->
<!-- ``` -->
