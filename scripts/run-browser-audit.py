"""Run the checked-in Playwright CLI callbacks against an ISOLATED test server.

This intentionally does not create/reset a server or clear any learning data.
Start the server with a temporary --data-dir and supply its --url first.
"""
import argparse
import json
import shutil
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', required=True, help='URL of the isolated test server')
parser.add_argument('--session', default='kevin-v2-audit')
parser.add_argument('--cli', default=shutil.which('playwright-cli') or str(Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'))
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
output = root / 'output/playwright/v2-audit'
output.mkdir(parents=True, exist_ok=True)

def run(name, *commands):
    result = subprocess.run([args.cli, '--session', args.session, *commands], cwd=root, capture_output=True, text=True, timeout=120)
    log = result.stdout + result.stderr
    (output / (name + '.log')).write_text(log)
    if result.returncode or '### Error' in log:
        print(log[:1800])
        raise SystemExit(result.returncode or 1)
    if '### Result\n' in log:
        summary = json.loads(log.split('### Result\n', 1)[1].splitlines()[0])
        (output / (name + '.json')).write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps(summary, ensure_ascii=False))

run('open', 'open', args.url)
for script in ['verify-hands-on-browser', 'verify-classroom-flow']:
    run(script, 'run-code', (root / 'scripts' / (script + '.js')).read_text())
