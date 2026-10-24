{
  description = "Autumn89 Walking Challenge";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        buildNimPackage = pkgs.buildNimPackage.override { nim2 = pkgs.nim-2_0; };
      in
      {
        packages.default = buildNimPackage {
          pname = "autumn89";
          version = "0.4.0";
          src = ./.;

          # Run `nix run nixpkgs#nim_lk -- lock.json` to generate lock file
          lockFile = ./lock.json;

          nimFlags = [
            "--deepcopy:on"
            "-d:release"
            "--opt:speed"
            "-d:ssl"
            "--mm:orc"
            "--threads:on"
          ];

          buildInputs = with pkgs; [
            sqlite
            openssl
            imagemagick
          ];

          nativeBuildInputs = with pkgs; [
            makeWrapper
            minify
            typescript
            esbuild
          ];

          preConfigure = ''
            mkdir -p $out/share/css $out/share/js
          '';

          postFixup = ''
            strip $out/bin/main

            wrapProgram $out/bin/main \
              --set STATIC_ROOT $out/share \
              --prefix LD_LIBRARY_PATH : "${pkgs.lib.makeLibraryPath [ pkgs.sqlite ]}" \
              --prefix LD_LIBRARY_PATH : "${pkgs.lib.makeLibraryPath [ pkgs.imagemagick ]}" \
              --prefix PATH : "${pkgs.lib.makeBinPath [ pkgs.imagemagick ]}"
          '';

          postInstall = ''
            minify -b -a -r \
              -o $out/share/css/style.min.css \
              css

            tsc --noEmit -p frontend

            esbuild frontend/wysiwyg/index.ts --bundle --minify --target=es2020 \
              --outfile=$out/share/js/wysiwyg.min.js
            esbuild frontend/leaderboard/index.ts --bundle --minify --target=es2020 \
              --outfile=$out/share/js/leaderboard.min.js
            esbuild frontend/miles/index.ts --bundle --minify --target=es2020 \
              --outfile=$out/share/js/miles.min.js
            esbuild frontend/password-toggle.ts --bundle --minify --target=es2020 \
              --outfile=$out/share/js/password-toggle.min.js
            cp frontend/htmx.min.js $out/share/js/htmx.min.js

            cp -r assets $out/share/
          '';

          meta.mainProgram = "main";
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nim-2_0
            nimble

            sqlite
            openssl
            imagemagick

            typescript
            esbuild
            minify
            nodejs

            just
          ];
        };
      }
    );
}
