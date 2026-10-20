- [ ] Add justfile

- [ ] Fix posts (they currently don't work for some reason)

  - [x] Fix for create post
  - [ ] Fix for edit post

- [ ] Make it so that on editing a post, a new image is previewed

- [ ] Setup automated deployments?

  - When a commit is pushed to master, "server" will auto pull, build, and restart
  - Integrate into Nix with Busybox?

- [ ] Add test suite

  - [ ] Add tests for `src`
  - [ ] Add tests for JS (puppeteer)?

- [ ] Refactor JS (use modules)
- [ ] Move JS to TS
- [ ] Move some of JS to Nim
- [ ] Test JS with Nim
- [ ] Minify JS modules

- [ ] Break up `components.css` into smaller files

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
