#!/bin/zsh
set -e
cd "$(dirname "$0")" || exit 1
# Both launcher versions record the exact server process here.
pid_file="$PWD/data/kevin-math-lab.pid"
if [[ -f "$pid_file" ]]; then
  server_pid="$(tr -dc '0-9' < "$pid_file")"
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    server_command="$(ps -p "$server_pid" -o command= 2>/dev/null || true)"
    if [[ "$server_command" == *"server/index.mjs"* ]]; then
      kill "$server_pid"
      for _ in {1..40}; do
        kill -0 "$server_pid" 2>/dev/null || break
        sleep 0.1
      done
      if kill -0 "$server_pid" 2>/dev/null; then
        echo "旧后台仍在退出，请稍后再启动。"
        exit 1
      fi
    fi
  fi
  rm -f "$pid_file"
fi
echo "Kevin Math Lab 后台服务已停止。"
