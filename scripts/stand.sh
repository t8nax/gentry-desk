#!/usr/bin/env bash
# Демо-стенд Gentry для разработки панели: условный интернет-магазин в отдельной папке данных.
#
# Использование: bash scripts/stand.sh [<папка стенда>]
#   По умолчанию — ~/gentry-stand. Папка не должна существовать: скрипт её не очищает.
#   Программа gentry берётся из PATH; другую можно указать переменной GENTRY.
#
# После скрипта:
#   export GENTRY_HOME=<папка стенда>/home
#   gentry task list --all
set -euo pipefail

STAND="${1:-$HOME/gentry-stand}"
G="${GENTRY:-gentry}"

if [ -e "$STAND" ]; then
  echo "Папка $STAND уже есть. Укажите другую или удалите её сами." >&2
  exit 1
fi

export GENTRY_HOME="$STAND/home"

# Команды оператора. Внутри сессии Claude Code Gentry считает вызов вызовом агента,
# поэтому признаки сессии снимаются.
op() { env -u CLAUDECODE -u GENTRY_SESSION "$G" "$@"; }

# Инструмент агента: вызов через сервер `gentry mcp` в рабочей копии <папка>.
# Шаги, выход и пропуск этапа, артефакты и закрытие задачи есть только у агента.
agent() {
  local dir="$1" tool="$2" args="${3:-{\}}" out
  out=$(cd "$dir" && printf '%s\n' \
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"stand","version":"0"}}}' \
    '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
    "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"$tool\",\"arguments\":$args}}" \
    | "$G" mcp | tail -n 1)
  case "$out" in
    *'"isError":false'*) echo "  агент: $tool" ;;
    *) echo "Инструмент $tool не выполнен: $out" >&2; exit 1 ;;
  esac
}

# Код магазина: основная копия и две копии через git worktree.
mkdir -p "$STAND/shop/main"
cd "$STAND/shop/main"
git init -q -b main
git config core.autocrlf false
echo "# Магазин" > README.md
git add README.md
git -c user.name=stand -c user.email=stand@example.com commit -qm "init"
git worktree add -q --detach "$STAND/shop/wt-1"
git worktree add -q --detach "$STAND/shop/wt-2"

# Проект: знание создаётся заново, копии вносятся в пул.
op project add shop --knowledge "$STAND/shop/knowledge" --prefix SHOP >/dev/null
op worktree add "$STAND/shop/wt-1" >/dev/null
op worktree add "$STAND/shop/wt-2" >/dev/null

# Флоу: сценарий «Фича» — План → Реализация → Ревью, возврат с ревью до 3 раз.
F="$GENTRY_HOME/process/shop/flow"
mkdir -p "$F/scenarios" "$F/stages" "$F/agents"
cat > "$F/scenarios/feature.yaml" <<'EOF'
title: Фича
start: plan
nodes:
  plan:           { stage: plan, next: implementation }
  implementation: { stage: implementation, next: review }
  review:
    stage: review
    next:
      - to: implementation
        if: ревью выявило замечания
        max_rounds: 3
      - to: finish
EOF
cat > "$F/stages/plan.yaml" <<'EOF'
title: План
exit: план сохранён артефактом plan
executor: orchestrator
EOF
printf '## Что сделать\n\nНаписать план изменений и сохранить его артефактом `plan`.\n' > "$F/stages/plan.md"
cat > "$F/stages/implementation.yaml" <<'EOF'
title: Реализация
exit: изменения закоммичены в ветке задачи
executor: orchestrator
EOF
printf '## Что сделать\n\nРеализовать план и закоммитить изменения.\n' > "$F/stages/implementation.md"
cat > "$F/stages/review.yaml" <<'EOF'
title: Ревью
exit: замечаний нет или они записаны
executor: reviewer
EOF
printf '## Что сделать\n\nПроверить изменения задачи относительно плана.\n' > "$F/stages/review.md"
cat > "$F/agents/reviewer.yaml" <<'EOF'
purpose: ревью изменений задачи магазина
capabilities: [read, search]
EOF
printf '## Задача\n\nПроверить изменения задачи и перечислить замечания.\n' > "$F/agents/reviewer.md"
(cd "$STAND/shop/main" && op flow apply >/dev/null)

printf '# План\n\n1. Строка скидки под товарами корзины.\n2. Сумма заказа с учётом скидки.\n' > "$STAND/plan.md"
PLAN=$(cygpath -m "$STAND/plan.md" 2>/dev/null || echo "$STAND/plan.md")

pass_plan() {
  agent "$1" step_add '{"steps":["Прочитать код корзины","Написать план"]}'
  agent "$1" step_done '{"step":1,"check":"прочитан модуль cart"}'
  agent "$1" step_done '{"step":2}'
  agent "$1" artifact_save "{\"name\":\"plan\",\"file\":\"$PLAN\"}"
  agent "$1" stage_exit '{"kind":"artifact","artifact":"plan","text":"План написан"}'
}
pass_implementation() {
  agent "$1" step_add '{"steps":["Изменить корзину","Прогнать тесты"]}'
  agent "$1" step_done '{"step":1}'
  agent "$1" step_done '{"step":2,"check":"тесты корзины прошли"}'
  agent "$1" stage_exit '{"kind":"result","text":"Изменения закоммичены"}'
}

# SHOP-1 — в работе: ревью вернуло задачу на реализацию, идёт второй круг.
echo "SHOP-1"
cd "$STAND/shop/main"
echo '{"scenario":"feature","title":"Скидка в корзине","statement":"Показывать в корзине сумму скидки по промокоду."}' \
  | op task take --input - >/dev/null
pass_plan "$STAND/shop/main"
echo '{"question":"Показывать скидку строкой или только в итоге?","options":[{"label":"Строкой","description":"Отдельная строка под товарами","recommended":true},{"label":"В итоге","description":"Только в сумме заказа"}],"answer":"Строкой"}' \
  | op operator record --input - >/dev/null
op note add "Промокоды хранятся в сервисе скидок, не в корзине" >/dev/null
pass_implementation "$STAND/shop/main"
agent "$STAND/shop/main" step_add '{"steps":["Проверить изменения по плану"]}'
agent "$STAND/shop/main" step_done '{"step":1}'
agent "$STAND/shop/main" stage_exit '{"kind":"result","text":"Скидка не округляется до копеек","to":"implementation","reason":"ревью выявило замечание"}'
agent "$STAND/shop/main" step_add '{"steps":["Округлить скидку до копеек"]}'

# SHOP-2 — закрыта: сценарий пройден целиком.
echo "SHOP-2"
cd "$STAND/shop/wt-1"
op task take --scenario feature --title "Оплата картой" --statement "Добавить оплату банковской картой." >/dev/null
pass_plan "$STAND/shop/wt-1"
pass_implementation "$STAND/shop/wt-1"
agent "$STAND/shop/wt-1" step_add '{"steps":["Проверить изменения по плану"]}'
agent "$STAND/shop/wt-1" step_done '{"step":1}'
agent "$STAND/shop/wt-1" stage_exit '{"kind":"result","text":"Замечаний нет","to":"finish","reason":"замечаний нет"}'
agent "$STAND/shop/wt-1" task_close

# SHOP-3 — отменена оператором; копия wt-2 свободна.
echo "SHOP-3"
cd "$STAND/shop/wt-2"
op task take --scenario feature --title "Импорт каталога из CSV" --statement "Загружать товары из файла CSV." >/dev/null
op task cancel --reason "Каталог будет приходить из 1С" >/dev/null

# Черновик флоу с ошибкой: этап «Выкладка» без файла этапа.
cat >> "$F/scenarios/feature.yaml" <<'EOF'
  deploy: { stage: deploy, next: finish }
EOF

echo
echo "Стенд готов: $STAND"
echo "  export GENTRY_HOME=\"$GENTRY_HOME\""
echo "  gentry task list --all"
