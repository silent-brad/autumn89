default:
    just --list

typecheck:
    tsc --noEmit -p frontend

js:
    tsc --noEmit -p frontend
    mkdir -p assets/js
    esbuild frontend/wysiwyg/index.ts --bundle --minify --target=es2020 --outfile=assets/js/wysiwyg.min.js
    esbuild frontend/leaderboard/index.ts --bundle --minify --target=es2020 --outfile=assets/js/leaderboard.min.js
    esbuild frontend/miles/index.ts --bundle --minify --target=es2020 --outfile=assets/js/miles.min.js
    esbuild frontend/password-toggle.ts --bundle --minify --target=es2020 --outfile=assets/js/password-toggle.min.js
    cp frontend/htmx.min.js assets/js/htmx.min.js

css:
    minify -b -a -r \
        -o assets/css/style.min.css \
        css

nim:
    nimble build -d:release

build: css js nim

run:
    ./bin/main

test: typecheck test-ts
    nimble test

test-ts:
    esbuild frontend/tests/image-store.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/autumn89-image-store.test.cjs
    node -e "require('/tmp/autumn89-image-store.test.cjs').testImageStore()"
