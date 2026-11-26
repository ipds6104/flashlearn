import type { AgentSkillDiscoveryIndex } from './AgentSkillCatalogService';

function shQuote(val: string): string {
  return `'${val.replace(/'/g, `'\\''`)}'`;
}

function psQuote(val: string): string {
  return `'${val.replace(/'/g, "''")}'`;
}

export function buildPosixInstallScript(index: AgentSkillDiscoveryIndex): string {
  const origin = index.platform.origin;
  const repoUrl = index.repository.url;
  const skillDownloads = index.skills
    .flatMap((skill) => {
      const lines = [
        `download_and_verify ${shQuote(skill.url)} "$SKILLS_DIR/${skill.name}/SKILL.md" ${shQuote(skill.digest)}`,
      ];
      for (const res of skill.resources) {
        lines.push(
          `download_and_verify ${shQuote(res.url)} "$SKILLS_DIR/${skill.name}/${res.path}" ${shQuote(res.digest)}`
        );
        if (res.path.endsWith('.py') || res.path.endsWith('.sh')) {
          lines.push(`chmod +x "$SKILLS_DIR/${skill.name}/${res.path}"`);
        }
      }
      return lines;
    })
    .join('\n');

  const cliBlock = index.cli.available && index.cli.digest
    ? `echo "[2/4] Installing portable FlashLearn CLI bundle..."
mkdir -p "$HOME/.flashlearn/bin" "$HOME/.local/bin"
download_and_verify ${shQuote(index.cli.bundleUrl)} "$HOME/.flashlearn/bin/flashlearn.js" ${shQuote(index.cli.digest)}
cat > "$HOME/.local/bin/flashlearn" <<'SHIM'
#!/usr/bin/env sh
set -eu
if command -v bun >/dev/null 2>&1; then
  exec bun "$HOME/.flashlearn/bin/flashlearn.js" "$@"
elif [ -x "$HOME/.bun/bin/bun" ]; then
  exec "$HOME/.bun/bin/bun" "$HOME/.flashlearn/bin/flashlearn.js" "$@"
else
  echo "Error: Bun runtime is required for FlashLearn CLI. Install via: curl -fsSL https://bun.sh/install | bash" >&2
  exit 1
fi
SHIM
chmod +x "$HOME/.local/bin/flashlearn"
export PATH="$HOME/.local/bin:$HOME/.bun/bin:$PATH"`
    : `echo "[2/4] Pre-built CLI bundle not mounted on server. Clone repo to run CLI:"
echo "      git clone --depth 1 ${repoUrl} && cd flashlearn && bun install"`;

  return `#!/usr/bin/env bash
# FlashLearn Agent Skills & CLI Bootstrap Installer
# Origin: ${origin}
# Discovery: ${origin}/.well-known/agent-skills/index.json
# Repository: ${repoUrl}
# Security: Pass FLASHLEARN_API_KEY via environment variable (NEVER in URLs).
set -euo pipefail

ORIGIN=${shQuote(origin)}
SKILLS_DIR="$HOME/.agents/skills"

for arg in "$@"; do
  case "$arg" in
    --project) SKILLS_DIR="./.agents/skills" ;;
    --global)  SKILLS_DIR="$HOME/.agents/skills" ;;
  esac
done

verify_sha256() {
  local file="$1"
  local expected="\${2#sha256:}"
  if [ -z "$expected" ]; then return 0; fi
  local actual=""
  if command -v sha256sum >/dev/null 2>&1; then
    actual="$(sha256sum "$file" | awk '{print $1}')"
  elif command -v shasum >/dev/null 2>&1; then
    actual="$(shasum -a 256 "$file" | awk '{print $1}')"
  else
    return 0
  fi
  if [ "$actual" != "$expected" ]; then
    echo "ERROR: SHA-256 mismatch for $file (expected $expected, got $actual)" >&2
    rm -f "$file"
    exit 1
  fi
}

download_and_verify() {
  local url="$1"
  local dest="$2"
  local digest="$3"
  mkdir -p "$(dirname "$dest")"
  curl -fsSL "$url" -o "$dest"
  verify_sha256 "$dest" "$digest"
}

echo "[1/4] Installing FlashLearn Agent Skills into $SKILLS_DIR..."
${skillDownloads || 'echo "No skills available in catalog."'}

# Symlink into Claude Code / Cursor global skill dirs if those tools already exist
if [ "$SKILLS_DIR" = "$HOME/.agents/skills" ]; then
  for agent_root in "$HOME/.claude/skills" "$HOME/.cursor/skills"; do
    if [ -d "$(dirname "$agent_root")" ]; then
      mkdir -p "$agent_root"
      for sdir in "$SKILLS_DIR"/flashlearn-*; do
        [ -d "$sdir" ] || continue
        ln -sfn "$sdir" "$agent_root/$(basename "$sdir")"
      done
    fi
  done
fi

${cliBlock}

echo "[3/4] Checking Bun runtime & configuring FlashLearn CLI..."
if ! command -v bun >/dev/null 2>&1 && [ ! -x "$HOME/.bun/bin/bun" ]; then
  echo "Notice: Bun is not installed yet. Install Bun first: curl -fsSL https://bun.sh/install | bash"
fi

if [ -x "$HOME/.local/bin/flashlearn" ] && (command -v bun >/dev/null 2>&1 || [ -x "$HOME/.bun/bin/bun" ]); then
  if [ -n "\${FLASHLEARN_API_KEY:-}" ]; then
    "$HOME/.local/bin/flashlearn" config set --base-url "$ORIGIN" --api-key "$FLASHLEARN_API_KEY" >/dev/null
    echo "Configured ~/.flashlearn/config.json (chmod 600) with base URL and API key."
    echo "[4/4] Verifying connection via 'flashlearn auth whoami'..."
    "$HOME/.local/bin/flashlearn" auth whoami || true
  else
    "$HOME/.local/bin/flashlearn" config set --base-url "$ORIGIN" >/dev/null
    echo "[4/4] Base URL saved. Set your API key when ready:"
    echo "      flashlearn config set --base-url $ORIGIN --api-key \\"fl_live_...\\""
  fi
fi

echo ""
echo "FlashLearn Agent Skills installed successfully:"
ls -1 "$SKILLS_DIR" | grep '^flashlearn-' || true
echo "Ensure ~/.local/bin is in your PATH, then run: flashlearn workspace list"
`;
}

export function buildPowerShellInstallScript(index: AgentSkillDiscoveryIndex): string {
  const origin = index.platform.origin;
  const repoUrl = index.repository.url;
  const skillDownloads = index.skills
    .flatMap((skill) => {
      const lines = [
        `Download-Verified -Url ${psQuote(skill.url)} -Dest (Join-Path $SkillsDir '${skill.name}\\SKILL.md') -ExpectedDigest ${psQuote(skill.digest)}`,
      ];
      for (const res of skill.resources) {
        const winPath = res.path.replace(/\//g, '\\');
        lines.push(
          `Download-Verified -Url ${psQuote(res.url)} -Dest (Join-Path $SkillsDir '${skill.name}\\${winPath}') -ExpectedDigest ${psQuote(res.digest)}`
        );
      }
      return lines;
    })
    .join('\n');

  const cliBlock = index.cli.available && index.cli.digest
    ? `Write-Host "[2/4] Installing portable FlashLearn CLI bundle..."
$BinDir = Join-Path $HOME ".flashlearn\\bin"
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
$BundlePath = Join-Path $BinDir "flashlearn.js"
Download-Verified -Url ${psQuote(index.cli.bundleUrl)} -Dest $BundlePath -ExpectedDigest ${psQuote(index.cli.digest)}
$ShimPath = Join-Path $BinDir "flashlearn.cmd"
Set-Content -Path $ShimPath -Value "@echo off\`r\`nbun \`"%USERPROFILE%\\.flashlearn\\bin\\flashlearn.js\`" %*" -Encoding Ascii`
    : `Write-Host "[2/4] Pre-built CLI bundle unavailable. Clone ${repoUrl} and run bun install."`;

  return `# FlashLearn Agent Skills & CLI Bootstrap Installer (PowerShell)
# Origin: ${origin}
# Discovery: ${origin}/.well-known/agent-skills/index.json
# Repository: ${repoUrl}
# Security: Pass $env:FLASHLEARN_API_KEY via environment variable (NEVER in URLs).
param([switch]$Project)
$ErrorActionPreference = "Stop"

$Origin = ${psQuote(origin)}
$SkillsDir = if ($Project) { Join-Path (Get-Location) ".agents\\skills" } else { Join-Path $HOME ".agents\\skills" }

function Download-Verified {
  param([string]$Url, [string]$Dest, [string]$ExpectedDigest)
  $Dir = Split-Path -Parent $Dest
  New-Item -ItemType Directory -Force -Path $Dir | Out-Null
  Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $Dest
  if ($ExpectedDigest) {
    $Expected = $ExpectedDigest -replace '^sha256:', ''
    $Actual = (Get-FileHash -Path $Dest -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($Actual -ne $Expected.ToLowerInvariant()) {
      Remove-Item -Force $Dest
      throw "SHA-256 mismatch for $Dest"
    }
  }
}

Write-Host "[1/4] Installing FlashLearn Agent Skills into $SkillsDir..."
${skillDownloads || 'Write-Host "No skills available in catalog."'}

${cliBlock}

Write-Host "[3/4] Configuring FlashLearn CLI..."
if (Get-Command bun -ErrorAction SilentlyContinue) {
  $BundlePath = Join-Path $HOME ".flashlearn\\bin\\flashlearn.js"
  if (Test-Path $BundlePath) {
    if ($env:FLASHLEARN_API_KEY) {
      & bun $BundlePath config set --base-url $Origin --api-key $env:FLASHLEARN_API_KEY | Out-Null
      Write-Host "[4/4] Verifying connection via 'flashlearn auth whoami'..."
      & bun $BundlePath auth whoami
    } else {
      & bun $BundlePath config set --base-url $Origin | Out-Null
      Write-Host "[4/4] Base URL saved. Run: bun '$BundlePath' config set --base-url $Origin --api-key fl_live_..."
    }
  }
} else {
  Write-Host 'Notice: Install Bun runtime first (powershell -c "irm bun.sh/install.ps1 | iex")'
}
Write-Host "FlashLearn Agent Skills installed into $SkillsDir."
`;
}
