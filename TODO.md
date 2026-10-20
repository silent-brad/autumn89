- [ ] Fix posts (they currently don't work for some reason)

  - Clues:
    - When submitting a post, the url changes to "?text_content=.." and that's it.

- [ ] Setup automated deployments?

  - When a commit is pushed to master, "server" will auto pull, build, and restart
  - Integrate into Nix with Busybox?

- [ ] Add test suite

  - [ ] Add tests for `src`
  - [ ] Add tests for JS (puppeteer)?

- [ ] Refactor JS

- [ ] Move CSS/JS out of `static` (in build, move them to `dist`
- [ ] Move JS to Nim

- [x] Minify CSS

- [ ] Make sure fonts are small

- [ ] Break up `components.css` into smaller files

- [ ] Consider adding tiny C compiler backend for debugging

```
#For debugging as it compiles faster
"--cc:tcc"
"--gc:markAndSweep"
"--passL:-lm"
"--tlsEmulation:on"
```
