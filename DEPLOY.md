# Deploy to Timeweb (blue-green)

The site is a static Vite build (`dist/`). [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
builds it on every push to `master` and publishes it to Timeweb over SSH using a
blue-green scheme: the new release is unpacked into the *inactive* colour slot,
then a single `current` symlink is flipped atomically. Rollback = repoint the
symlink at the other slot.

## GitHub secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Example | Notes |
| --- | --- | --- |
| `TIMEWEB_SSH_HOST` | `12.34.56.78` | server IP / host |
| `TIMEWEB_SSH_USER` | `c12345` | SSH/hosting login |
| `TIMEWEB_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY----- …` | private key whose public half is in the server's `~/.ssh/authorized_keys` |
| `TIMEWEB_SSH_PORT` | `22` | optional (defaults to 22) |
| `TIMEWEB_DEPLOY_PATH` | `/home/c12345/gltf-editor` | base dir for releases (NOT the web root) |

## One-time server setup

```sh
# pick a base dir, the same as TIMEWEB_DEPLOY_PATH
mkdir -p ~/gltf-editor/releases ~/gltf-editor/incoming

# point the site's document root at the live symlink.
# On Timeweb shared hosting the docroot is usually ~/<domain>/public_html —
# replace it with a symlink to the blue-green "current":
rm -rf ~/example.com/public_html
ln -s ~/gltf-editor/current ~/example.com/public_html
```

After the first successful workflow run, `~/gltf-editor/current` →
`releases/blue` (then alternates `green`/`blue` each deploy).

`vite.config.ts` uses `base: './'`, so the bundle works from any path/symlink,
and the app is a single `index.html` SPA (no server rewrite rules needed).

## Rollback

```sh
cd ~/gltf-editor
ln -sfn releases/blue current   # or releases/green — whichever was the previous one
```
