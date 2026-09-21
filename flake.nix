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
          version = "0.3.0";
          src = ./.;
          # Run `nix shell nixpkgs#nim_lk -c nim_lk > lock.json` to generate lock file
          lockFile = ./lock.json;
          nimFlags = [
            "--deepcopy:on"
            "-d:release"
            "-d:ssl"
            "--mm:orc"
          ];
          buildInputs = with pkgs; [
            sqlite
            openssl
            imagemagick
          ];
          nativeBuildInputs = [ pkgs.makeWrapper ];
          postFixup = ''
            wrapProgram $out/bin/main \
              --prefix LD_LIBRARY_PATH : "${pkgs.lib.makeLibraryPath [ pkgs.sqlite ]}" \
              --prefix LD_LIBRARY_PATH : "${pkgs.lib.makeLibraryPath [ pkgs.imagemagick ]}" \
              --prefix PATH : "${pkgs.lib.makeBinPath [ pkgs.imagemagick ]}"
          '';
          meta.mainProgram = "main";
        };
      }
    );
}
