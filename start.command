#!/bin/zsh
set -e
cd "$(dirname "$0")" || exit 1
if [[ ! -d node_modules ]]; then
  echo "首次启动需要安装本地运行组件……"
  npm install || exit 1
fi
npm run build || exit 1
/bin/zsh "$PWD/stop.command"
log_file="$PWD/data/kevin-math-lab.log"
# Start in a separate process group; nohup alone keeps the caller's group.
node "$PWD/scripts/start-background.mjs"
server_pid="$(tr -dc '0-9' < "$PWD/data/kevin-math-lab.pid")"
for _ in {1..40}; do
  if [[ -z "$server_pid" ]] || ! kill -0 "$server_pid" 2>/dev/null; then
    echo "后台进程已经退出，请查看 $log_file"
    exit 1
  fi
  if /usr/bin/curl --fail --silent --max-time 1 --output /dev/null http://127.0.0.1:4177/api/data; then
    /usr/bin/open http://127.0.0.1:4177
    echo "Kevin Math Lab 已更新并在独立后台进程运行：http://127.0.0.1:4177"
    exit 0
  fi
  sleep 0.2
done
echo "本地服务启动失败，请查看 $log_file"
exit 1
