# kmweb

Web UI for [kmrs](https://github.com/kmworks/kmrs), the Komga-compatible media
server rewritten in Rust.

A from-scratch web UI will be built here. Until then, this repo hosts prebuilt
[komga-webui](https://github.com/gotson/komga) artifacts as release assets, so
kmrs release builds can download them instead of rebuilding the frontend from
source every time.

## Prebuilt komga-webui artifacts

Releases tagged `komga-webui/v<upstream-version>` carry a
`komga-webui-v<upstream-version>.tar.gz` asset: the upstream `komga-webui`
`npm run build` output, with files at the tarball root (`index.html`, `css/`,
`js/`, …). Extract it into a directory and point kmrs at it via `webui.dir` /
`KOMGA_WEBUI_DIR`.
