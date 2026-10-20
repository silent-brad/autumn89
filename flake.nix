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
          ];

          preConfigure = ''
            mkdir -p $out/share/ $out/share/css

            minify -b -a -r -o $out/share/css/style.css css
            cp -r js $out/share/
            cp -r assets $out/share/
          '';

          postFixup = ''
            strip $out/bin/main

            wrapProgram $out/bin/main \
              --set STATIC_ROOT $out/share \
              --set TEXT "Hello, World!" \
              --prefix LD_LIBRARY_PATH : "${pkgs.lib.makeLibraryPath [ pkgs.sqlite ]}" \
              --prefix LD_LIBRARY_PATH : "${pkgs.lib.makeLibraryPath [ pkgs.imagemagick ]}" \
              --prefix PATH : "${pkgs.lib.makeBinPath [ pkgs.imagemagick ]}"
          '';

          # postBuild = ''
          #   echo "Contents after build:"
          #   find $out/share -type f | sort
          # '';

          meta.mainProgram = "main";
        };
      }
    );
}
