window.__ModuleLoader__.load({
	id: "dsh-thinking-levels",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/locales.ts
		/** `thinking-levels` client dictionaries (zh / en / ja / ko / fr / de / it / ru / es). */
		/** Dictionary namespace owned by this plugin. */
		const NS = "thinking-levels";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"card.title": "思考档位",
			"family.title": "起子插件设置",
			"card.description": "在模型选择器中可选 Auto（mask）：按工具调用历史自动在 low / high / max 间调度后提交 API。此处配置默认档位、调度边界与模型能力（档位 → 网关线上值映射）。",
			"card.level": "默认档位",
			"card.level.off": "off — 关闭思考（仅手动，永不自动选择）",
			"card.level.on": "on — 开启思考（仅 toggle 型模型；只发 enable_thinking，不发 effort）",
			"card.level.minimal": "minimal — 最低（极轻任务）",
			"card.level.low": "low — 低（简单任务，廉价轮保持廉价）",
			"card.level.medium": "medium — 中",
			"card.level.high": "high — 高（官方默认）",
			"card.level.xhigh": "xhigh — 特高",
			"card.level.max": "max — 最大（重任务）",
			"card.level.auto": "auto — 按工具历史自动调度（默认）",
			"card.enabled": "启用",
			"card.allowDowngrade": "允许降档（auto 可降至 low）",
			"card.allowUpgrade": "允许升档（auto 可升至 max）",
			"card.unavailable": "设置命名空间不可用：请确认 dsh-thinking-levels 已装配进 profile。",
			"card.readonly": "只读",
			"card.capabilities": "模型能力（llm-pi-ai 自定义提供方）",
			"card.capabilities.hint": "直接读写 llm-pi-ai 配置：勾选档位并填写发送给网关的线上值（例如 high → ultra）；off 留空表示不发送。视觉决定图片输入；思考开关决定 enable_thinking 置位；thinkingFormat 决定 wire 序列化格式。",
			"card.capabilities.empty": "llm-pi-ai 中没有已配置模型的自定义提供方。请先在「设置 → 模型」添加提供方与模型。",
			"card.capabilities.unavailable": "llm-pi-ai 设置命名空间不可用。",
			"card.capabilities.none": "（无模型）",
			"card.capabilities.search": "搜索模型（名称或 ID）…",
			"card.capabilities.noMatches": "没有匹配的模型",
			"card.capabilities.quickSettings": "一键设置",
			"card.capabilities.presetOfficial": "应用到全部：Off / High / Max（官方 DeepSeek 风格）",
			"card.capabilities.presetGeneric": "应用到全部：Off / Low / Medium / High（通用）",
			"card.capabilities.vendor": "提供方",
			"card.capabilities.developerRole": "网关不支持 developer 角色",
			"card.capabilities.developerRoleHint": "官方兼容开关（dsh ≥ v0.1.0-rc.8）：写入路由级 compat.supportsDeveloperRole: false，系统提示词按 system 角色发送，修复 vLLM / SGLang 等网关的 Unexpected message role 400。取消勾选 = 删除该字段、恢复继承。",
			"card.capabilities.takeover": "第三方接管",
			"card.capabilities.takeoverHint": "勾选后该路由的模型请求改由 dsh-llm-openai-completions 传输层短路发送（多模态真发 + 模态门禁 + 提示词注入），pi-ai 不再参与。写入传输层自身的 providers 名单；取消勾选 = 从名单移除。需已安装该传输层。",
			"card.capabilities.takeoverHintAbsent": "传输层 dsh-llm-openai-completions 未安装——先安装并启用后才能按路由接管。",
			"card.capabilities.expandProvider": "展开提供方",
			"card.capabilities.collapseProvider": "收起提供方",
			"card.capabilities.openModelSettings": "打开模型设置",
			"card.capabilities.closeModelSettings": "收起模型设置",
			"card.capabilities.vision": "视觉模型",
			"card.capabilities.thinking": "思考模型",
			"card.capabilities.supportsEffort": "支持 think effort",
			"card.capabilities.efforts": "思考档位（勾选后填写线上值）",
			"card.capabilities.wirePlaceholder": "线上值，如 ultra",
			"card.capabilities.offPlaceholder": "留空 = 不发送",
			"card.capabilities.atLeastThinking": "至少需要一个思考档位（off 除外）",
			"card.capabilities.applyLevel": "应用此档位",
			"card.capabilities.restoreDefault": "恢复默认档位",
			"card.capabilities.unsaved": "未保存",
			"card.capabilities.saveChanges": "保存更改",
			"card.capabilities.saved": "已保存",
			"card.capabilities.thinkingFormat": "思考格式",
			"card.capabilities.thinkingFormat.inherit": "继承",
			"card.capabilities.contextWindow": "上下文窗口上限",
			"card.capabilities.contextCustomPlaceholder": "自定义整数，如 256000",
			"card.capabilities.contextClear": "清除",
			"card.capabilities.contextInteger": "上下文长度必须是整数（2000-1000000）",
			"card.capabilities.contextRange": "上下文长度必须在 2000 到 1000000 之间",
			"card.capabilities.contextHint": "选择预设或输入整数（2000–1000000），写入 llm-pi-ai 供上下文压力/压缩使用，无需重启即对下一请求生效。",
			"input.context.title": "上下文窗口",
			"input.context.globalHint": "全局生效：作用于所有使用该模型的会话（清除可恢复默认）",
			"input.context.unset": "未设",
			"input.context.custom": "自定义",
			"input.context.noModel": "暂无会话模型",
			"input.context.customPlaceholder": "自定义整数，如 256000",
			"input.context.apply": "应用",
			"input.context.clear": "清除",
			"input.context.integer": "上下文长度必须是整数（2000-1000000）",
			"input.context.range": "上下文长度必须在 2000 到 1000000 之间",
			"model.panel.choose": "选择模型",
			"model.panel.loading": "模型目录加载中…",
			"model.panel.empty": "没有可用模型",
			"model.panel.window": "窗口",
			"model.panel.noTarget": "该模型没有可写的配置项",
			"model.panel.unavailable": "当前会话的模型目录不可用",
			"input.effort.title": "思考强度",
			"input.effort.default": "提供方默认",
			"input.effort.reset": "恢复提供方默认",
			"card.capabilities.failed": "保存失败：配置被拒绝或冲突，请检查值。"
		};
		/** English dictionary (keys mirror zh). */
		const en = {
			"card.title": "Thinking Levels",
			"family.title": "Qizi Plugin Settings",
			"card.description": "Pick Auto in the model selector: the plugin schedules low / high / max per tool round before submitting the API effort. Here you configure the default level, scheduler bounds, and per-model capabilities (level → gateway wire value mapping).",
			"card.level": "Default level",
			"card.level.off": "off — disable thinking (manual only, never auto-picked)",
			"card.level.on": "on — enable thinking (toggle-only models only; sends enable_thinking, never an effort)",
			"card.level.minimal": "minimal — least (very light tasks)",
			"card.level.low": "low — cheap rounds stay cheap",
			"card.level.medium": "medium — medium",
			"card.level.high": "high — the official default",
			"card.level.xhigh": "xhigh — extra high",
			"card.level.max": "max — heavy work",
			"card.level.auto": "auto — schedule from tool history (default)",
			"card.enabled": "Enabled",
			"card.allowDowngrade": "Allow downgrade (auto may drop to low)",
			"card.allowUpgrade": "Allow upgrade (auto may lift to max)",
			"card.unavailable": "Settings namespace unavailable: make sure dsh-thinking-levels is assembled into this profile.",
			"card.readonly": "Read-only",
			"card.capabilities": "Model capabilities (llm-pi-ai custom providers)",
			"card.capabilities.hint": "Reads and writes the llm-pi-ai config directly: tick a level and enter the exact value sent to the gateway (e.g. high → ultra); leaving off empty means “do not send”. Vision gates image input; the thinking toggle drives enable_thinking; thinkingFormat picks the wire serialization.",
			"card.capabilities.empty": "No custom provider has models configured in llm-pi-ai. Add a provider and models under Settings → Models first.",
			"card.capabilities.unavailable": "The llm-pi-ai settings namespace is unavailable.",
			"card.capabilities.none": "(no models)",
			"card.capabilities.search": "Search models by name or ID…",
			"card.capabilities.noMatches": "No matching models",
			"card.capabilities.quickSettings": "Quick settings",
			"card.capabilities.presetOfficial": "Apply to all: Off / High / Max (official DeepSeek style)",
			"card.capabilities.presetGeneric": "Apply to all: Off / Low / Medium / High (generic)",
			"card.capabilities.vendor": "Provider",
			"card.capabilities.developerRole": "Gateway rejects the developer role",
			"card.capabilities.developerRoleHint": "Official compat switch (dsh ≥ v0.1.0-rc.8): writes route-level compat.supportsDeveloperRole: false so the system prompt is sent as role system — fixes the Unexpected message role 400 on vLLM / SGLang gateways. Unchecking deletes the field and restores inheritance.",
			"card.capabilities.takeover": "Third-party takeover",
			"card.capabilities.takeoverHint": "When checked, the model requests of this route are short-circuited through the dsh-llm-openai-completions transport (multimodal true-send, modality gate, prompt injection) and pi-ai steps out. Writes the providers list of the transport itself; unchecking removes the route. Requires the transport to be installed.",
			"card.capabilities.takeoverHintAbsent": "The dsh-llm-openai-completions transport is not installed — install and enable it to take routes over per route.",
			"card.capabilities.expandProvider": "Expand provider",
			"card.capabilities.collapseProvider": "Collapse provider",
			"card.capabilities.openModelSettings": "Open model settings",
			"card.capabilities.closeModelSettings": "Collapse model settings",
			"card.capabilities.vision": "Vision model",
			"card.capabilities.thinking": "Thinking model",
			"card.capabilities.supportsEffort": "Supports think effort",
			"card.capabilities.efforts": "Thinking effort levels (tick, then enter the wire value)",
			"card.capabilities.wirePlaceholder": "Wire value, e.g. ultra",
			"card.capabilities.offPlaceholder": "Empty = do not send",
			"card.capabilities.atLeastThinking": "Select at least one thinking level (other than off)",
			"card.capabilities.applyLevel": "Apply levels",
			"card.capabilities.restoreDefault": "Restore defaults",
			"card.capabilities.unsaved": "Unsaved",
			"card.capabilities.saveChanges": "Save changes",
			"card.capabilities.saved": "Saved",
			"card.capabilities.thinkingFormat": "Thinking format",
			"card.capabilities.thinkingFormat.inherit": "Inherit",
			"card.capabilities.contextWindow": "Context window limit",
			"card.capabilities.contextCustomPlaceholder": "Custom integer, e.g. 256000",
			"card.capabilities.contextClear": "Clear",
			"card.capabilities.contextInteger": "Context length must be an integer (2000-1000000)",
			"card.capabilities.contextRange": "Context length must be between 2000 and 1000000",
			"card.capabilities.contextHint": "Pick a preset or enter an integer (2000–1000000); written to llm-pi-ai for context pressure/compaction and applied to the next request without a restart.",
			"input.context.title": "Context window",
			"input.context.globalHint": "Applies globally to every session using this model (Clear restores the default)",
			"input.context.unset": "Unset",
			"input.context.custom": "Custom",
			"input.context.noModel": "No session model yet",
			"input.context.customPlaceholder": "Custom integer, e.g. 256000",
			"input.context.apply": "Apply",
			"input.context.clear": "Clear",
			"input.context.integer": "Context length must be an integer (2000-1000000)",
			"input.context.range": "Context length must be between 2000 and 1000000",
			"model.panel.choose": "Choose model",
			"model.panel.loading": "Loading the model directory…",
			"model.panel.empty": "No models available",
			"model.panel.window": "Window",
			"model.panel.noTarget": "No writable config entry for this model",
			"model.panel.unavailable": "The model directory is unavailable for this session",
			"input.effort.title": "Reasoning effort",
			"input.effort.default": "Provider default",
			"input.effort.reset": "Restore provider default",
			"card.capabilities.failed": "Save failed: the value was rejected or conflicted. Check it."
		};
		/** Japanese dictionary (keys mirror zh). */
		const ja = {
			"card.title": "思考レベル",
			"family.title": "起子プラグイン設定",
			"card.description": "モデルセレクターで Auto（マスク）を選択すると、ツール呼び出し履歴から low / high / max を自動スケジュールして API に送信します。ここでは既定レベル、スケジューラーの境界、モデル能力（レベル → ゲートウェイ送信値のマッピング）を設定します。",
			"card.level": "既定レベル",
			"card.level.off": "off — 思考を無効化（手動のみ、自動選択はされません）",
			"card.level.on": "on — 思考を有効化（トグルのみのモデル向け。enable_thinking のみ送信、effort は送信しません）",
			"card.level.minimal": "minimal — 最小（非常に軽いタスク）",
			"card.level.low": "low — 低（軽いラウンドは軽いまま）",
			"card.level.medium": "medium — 中",
			"card.level.high": "high — 高（公式既定値）",
			"card.level.xhigh": "xhigh — 特高",
			"card.level.max": "max — 最大（重いタスク）",
			"card.level.auto": "auto — ツール履歴から自動スケジュール（既定）",
			"card.enabled": "有効",
			"card.allowDowngrade": "降格を許可（auto は low まで下げられる）",
			"card.allowUpgrade": "昇格を許可（auto は max まで上げられる）",
			"card.unavailable": "設定名前空間が利用できません：dsh-thinking-levels が profile に組み込まれているか確認してください。",
			"card.readonly": "読み取り専用",
			"card.capabilities": "モデル能力（llm-pi-ai カスタムプロバイダー）",
			"card.capabilities.hint": "llm-pi-ai 設定を直接読み書きします：レベルにチェックを入れ、ゲートウェイに送信する値を入力（例：high → ultra）。off を空欄にすると送信しません。視覚は画像入力を決定、思考トグルは enable_thinking を制御、thinkingFormat は wire シリアライズ形式を選択します。",
			"card.capabilities.empty": "llm-pi-ai にモデルが設定されたカスタムプロバイダーがありません。先に「設定 → モデル」でプロバイダーとモデルを追加してください。",
			"card.capabilities.unavailable": "llm-pi-ai の設定名前空間が利用できません。",
			"card.capabilities.none": "（モデルなし）",
			"card.capabilities.search": "モデル名または ID で検索…",
			"card.capabilities.noMatches": "一致するモデルがありません",
			"card.capabilities.quickSettings": "クイック設定",
			"card.capabilities.presetOfficial": "すべてに適用：Off / High / Max（公式 DeepSeek 形式）",
			"card.capabilities.presetGeneric": "すべてに適用：Off / Low / Medium / High（汎用）",
			"card.capabilities.vendor": "プロバイダー",
			"card.capabilities.developerRole": "ゲートウェイは developer ロール非対応",
			"card.capabilities.developerRoleHint": "公式互換スイッチ（dsh ≥ v0.1.0-rc.8）：ルートレベルの compat.supportsDeveloperRole: false を書き込み、システムプロンプトを system ロールで送信します。vLLM / SGLang などの Unexpected message role 400 を修正。チェックを外すとフィールドを削除し継承に戻します。",
			"card.capabilities.takeover": "サードパーティテイクオーバー",
			"card.capabilities.takeoverHint": "チェックすると、このルートのモデルリクエストは dsh-llm-openai-completions トランスポート経由で短路送信され（マルチモーダル真送信・モーダルゲート・プロンプト注入）、pi-ai は関与しません。トランスポート自身の providers リストに書き込みます。チェック解除でルートを削除。トランスポートのインストールが必要です。",
			"card.capabilities.takeoverHintAbsent": "トランスポート dsh-llm-openai-completions が未インストールです — ルート単位のテイクオーバーには先にインストールして有効化してください。",
			"card.capabilities.expandProvider": "プロバイダーを展開",
			"card.capabilities.collapseProvider": "プロバイダーを折りたたむ",
			"card.capabilities.openModelSettings": "モデル設定を開く",
			"card.capabilities.closeModelSettings": "モデル設定を折りたたむ",
			"card.capabilities.vision": "視覚モデル",
			"card.capabilities.thinking": "思考モデル",
			"card.capabilities.supportsEffort": "think effort をサポート",
			"card.capabilities.efforts": "思考レベル（チェック後、送信値を入力）",
			"card.capabilities.wirePlaceholder": "送信値（例：ultra）",
			"card.capabilities.offPlaceholder": "空欄 = 送信しない",
			"card.capabilities.atLeastThinking": "思考レベルを 1 つ以上選択してください（off 以外）",
			"card.capabilities.applyLevel": "レベルを適用",
			"card.capabilities.restoreDefault": "既定値に戻す",
			"card.capabilities.unsaved": "未保存",
			"card.capabilities.saveChanges": "変更を保存",
			"card.capabilities.saved": "保存済み",
			"card.capabilities.thinkingFormat": "思考形式",
			"card.capabilities.thinkingFormat.inherit": "継承",
			"card.capabilities.contextWindow": "コンテキストウィンドウ上限",
			"card.capabilities.contextCustomPlaceholder": "カスタム整数（例：256000）",
			"card.capabilities.contextClear": "クリア",
			"card.capabilities.contextInteger": "コンテキスト長は整数で入力してください（2000-1000000）",
			"card.capabilities.contextRange": "コンテキスト長は 2000 から 1000000 の範囲で指定してください",
			"card.capabilities.contextHint": "プリセットを選ぶか整数を入力（2000–1000000）。llm-pi-ai に書き込まれ、コンテキスト圧力/圧縮に使用され、再起動なしで次のリクエストに反映されます。",
			"input.context.title": "コンテキストウィンドウ",
			"input.context.globalHint": "グローバルに有効：このモデルを使用するすべてのセッションに適用されます（クリアで既定値に戻ります）",
			"input.context.unset": "未設定",
			"input.context.custom": "カスタム",
			"input.context.noModel": "セッションモデルがまだありません",
			"input.context.customPlaceholder": "カスタム整数（例：256000）",
			"input.context.apply": "適用",
			"input.context.clear": "クリア",
			"input.context.integer": "コンテキスト長は整数で入力してください（2000-1000000）",
			"input.context.range": "コンテキスト長は 2000 から 1000000 の範囲で指定してください",
			"model.panel.choose": "モデルを選択",
			"model.panel.loading": "モデルディレクトリを読み込み中…",
			"model.panel.empty": "利用可能なモデルがありません",
			"model.panel.window": "ウィンドウ",
			"model.panel.noTarget": "このモデルには書き込み可能な設定項目がありません",
			"model.panel.unavailable": "このセッションのモデルディレクトリは利用できません",
			"input.effort.title": "思考レベル",
			"input.effort.default": "プロバイダーの既定",
			"input.effort.reset": "プロバイダーの既定に戻す",
			"card.capabilities.failed": "保存に失敗しました：値が拒否されたか競合しています。確認してください。"
		};
		/** Korean dictionary (keys mirror zh). */
		const ko = {
			"card.title": "사고 수준",
			"family.title": "起子 플러그인 설정",
			"card.description": "모델 선택기에서 Auto(마스크)를 선택하면 도구 호출 기록을 기반으로 low / high / max 를 자동 스케줄링하여 API에 제출합니다. 여기서 기본 수준, 스케줄러 경계, 모델 기능(수준 → 게이트웨이 전송 값 매핑)을 구성합니다.",
			"card.level": "기본 수준",
			"card.level.off": "off — 사고 비활성화(수동 전용, 자동 선택 안 됨)",
			"card.level.on": "on — 사고 활성화(토글 전용 모델용. enable_thinking만 전송, effort는 전송하지 않음)",
			"card.level.minimal": "minimal — 최소(매우 가벼운 작업)",
			"card.level.low": "low — 낮음(가벼운 라운드는 가볍게 유지)",
			"card.level.medium": "medium — 중간",
			"card.level.high": "high — 높음(공식 기본값)",
			"card.level.xhigh": "xhigh — 특별히 높음",
			"card.level.max": "max — 최대(무거운 작업)",
			"card.level.auto": "auto — 도구 기록에서 자동 스케줄링(기본값)",
			"card.enabled": "활성화",
			"card.allowDowngrade": "다운그레이드 허용(auto가 low까지 내릴 수 있음)",
			"card.allowUpgrade": "업그레이드 허용(auto가 max까지 올릴 수 있음)",
			"card.unavailable": "설정 네임스페이스를 사용할 수 없습니다: dsh-thinking-levels가 이 profile에 조립되었는지 확인하세요.",
			"card.readonly": "읽기 전용",
			"card.capabilities": "모델 기능(llm-pi-ai 사용자 지정 제공자)",
			"card.capabilities.hint": "llm-pi-ai 설정을 직접 읽고 씁니다: 수준을 체크하고 게이트웨이에 보낼 값을 입력(예: high → ultra). off를 비워 두면 전송하지 않습니다. 시각은 이미지 입력을 결정하고, 사고 토글은 enable_thinking을 제어하며, thinkingFormat은 wire 직렬화 형식을 선택합니다.",
			"card.capabilities.empty": "llm-pi-ai에 모델이 구성된 사용자 지정 제공자가 없습니다. 먼저 「설정 → 모델」에서 제공자와 모델을 추가하세요.",
			"card.capabilities.unavailable": "llm-pi-ai 설정 네임스페이스를 사용할 수 없습니다.",
			"card.capabilities.none": "(모델 없음)",
			"card.capabilities.search": "모델 이름 또는 ID로 검색…",
			"card.capabilities.noMatches": "일치하는 모델이 없습니다",
			"card.capabilities.quickSettings": "빠른 설정",
			"card.capabilities.presetOfficial": "전체에 적용: Off / High / Max(공식 DeepSeek 방식)",
			"card.capabilities.presetGeneric": "전체에 적용: Off / Low / Medium / High(일반 방식)",
			"card.capabilities.vendor": "제공자",
			"card.capabilities.developerRole": "게이트웨이가 developer 역할 미지원",
			"card.capabilities.developerRoleHint": "공식 호환 스위치(dsh ≥ v0.1.0-rc.8): 라우트 수준 compat.supportsDeveloperRole: false 를 기록하여 시스템 프롬프트를 system 역할로 전송합니다. vLLM / SGLang 등의 Unexpected message role 400 을 수정. 체크 해제 시 필드를 삭제하고 상속을 복원합니다.",
			"card.capabilities.takeover": "서드파티 인수",
			"card.capabilities.takeoverHint": "체크하면 이 루트의 모델 요청이 dsh-llm-openai-completions 전송 계층을 통해 단락 전송되고(멀티모달 실전송·모달리티 게이트·프롬프트 주입) pi-ai 는 개입하지 않습니다. 전송 계층 자체의 providers 목록에 기록합니다. 체크 해제 시 루트를 제거합니다. 전송 계층 설치가 필요합니다.",
			"card.capabilities.takeoverHintAbsent": "dsh-llm-openai-completions 전송 계층이 설치되어 있지 않습니다 — 루트별 인수를 위해 먼저 설치하고 활성화하세요.",
			"card.capabilities.expandProvider": "제공자 펼치기",
			"card.capabilities.collapseProvider": "제공자 접기",
			"card.capabilities.openModelSettings": "모델 설정 열기",
			"card.capabilities.closeModelSettings": "모델 설정 접기",
			"card.capabilities.vision": "시각 모델",
			"card.capabilities.thinking": "사고 모델",
			"card.capabilities.supportsEffort": "think effort 지원",
			"card.capabilities.efforts": "사고 수준(체크 후 전송 값 입력)",
			"card.capabilities.wirePlaceholder": "전송 값(예: ultra)",
			"card.capabilities.offPlaceholder": "비워 둠 = 전송하지 않음",
			"card.capabilities.atLeastThinking": "사고 수준을 하나 이상 선택하세요(off 제외)",
			"card.capabilities.applyLevel": "수준 적용",
			"card.capabilities.restoreDefault": "기본값 복원",
			"card.capabilities.unsaved": "저장되지 않음",
			"card.capabilities.saveChanges": "변경 사항 저장",
			"card.capabilities.saved": "저장됨",
			"card.capabilities.thinkingFormat": "사고 형식",
			"card.capabilities.thinkingFormat.inherit": "상속",
			"card.capabilities.contextWindow": "컨텍스트 창 상한",
			"card.capabilities.contextCustomPlaceholder": "사용자 지정 정수(예: 256000)",
			"card.capabilities.contextClear": "지우기",
			"card.capabilities.contextInteger": "컨텍스트 길이는 정수여야 합니다 (2000-1000000)",
			"card.capabilities.contextRange": "컨텍스트 길이는 2000에서 1000000 사이여야 합니다",
			"card.capabilities.contextHint": "프리셋을 선택하거나 정수를 입력하세요(2000–1000000). llm-pi-ai에 기록되어 컨텍스트 압력/압축에 사용되며, 재시작 없이 다음 요청에 반영됩니다.",
			"input.context.title": "컨텍스트 창",
			"input.context.globalHint": "전역 적용: 이 모델을 사용하는 모든 세션에 적용됩니다(지우면 기본값 복원)",
			"input.context.unset": "미설정",
			"input.context.custom": "사용자 지정",
			"input.context.noModel": "세션 모델이 아직 없습니다",
			"input.context.customPlaceholder": "사용자 지정 정수(예: 256000)",
			"input.context.apply": "적용",
			"input.context.clear": "지우기",
			"input.context.integer": "컨텍스트 길이는 정수여야 합니다 (2000-1000000)",
			"input.context.range": "컨텍스트 길이는 2000에서 1000000 사이여야 합니다",
			"model.panel.choose": "모델 선택",
			"model.panel.loading": "모델 디렉터리를 불러오는 중…",
			"model.panel.empty": "사용 가능한 모델이 없습니다",
			"model.panel.window": "창",
			"model.panel.noTarget": "이 모델에는 쓰기 가능한 설정 항목이 없습니다",
			"model.panel.unavailable": "이 세션의 모델 디렉터리를 사용할 수 없습니다",
			"input.effort.title": "추론 강도",
			"input.effort.default": "공급자 기본값",
			"input.effort.reset": "공급자 기본값으로 복원",
			"card.capabilities.failed": "저장 실패: 값이 거부되었거나 충돌합니다. 확인하세요."
		};
		/** French dictionary (keys mirror zh). */
		const fr = {
			"card.title": "Niveaux de réflexion",
			"family.title": "Paramètres des plugins Qizi",
			"card.description": "Choisissez Auto dans le sélecteur de modèle : le plugin planifie low / high / max selon l'historique des appels d'outils avant de soumettre l'effort à l'API. Configurez ici le niveau par défaut, les limites du planificateur et les capacités par modèle (niveau → valeur envoyée à la passerelle).",
			"card.level": "Niveau par défaut",
			"card.level.off": "off — désactiver la réflexion (manuel uniquement, jamais auto-sélectionné)",
			"card.level.on": "on — activer la réflexion (modèles à bascule uniquement ; envoie enable_thinking, jamais d'effort)",
			"card.level.minimal": "minimal — minimum (tâches très légères)",
			"card.level.low": "low — bas (tours économiques restent économiques)",
			"card.level.medium": "medium — moyen",
			"card.level.high": "high — élevé (valeur officielle par défaut)",
			"card.level.xhigh": "xhigh — très élevé",
			"card.level.max": "max — maximum (tâches lourdes)",
			"card.level.auto": "auto — planification depuis l'historique des outils (par défaut)",
			"card.enabled": "Activé",
			"card.allowDowngrade": "Autoriser la rétrogradation (auto peut descendre à low)",
			"card.allowUpgrade": "Autoriser la montée (auto peut monter à max)",
			"card.unavailable": "Espace de noms des paramètres indisponible : assurez-vous que dsh-thinking-levels est assemblé dans ce profil.",
			"card.readonly": "Lecture seule",
			"card.capabilities": "Capacités du modèle (fournisseurs personnalisés llm-pi-ai)",
			"card.capabilities.hint": "Lit et écrit directement la configuration llm-pi-ai : cochez un niveau et saisissez la valeur exacte envoyée à la passerelle (ex. high → ultra) ; laisser off vide signifie « ne pas envoyer ». Vision contrôle l'entrée d'image ; le bouton de réflexion pilote enable_thinking ; thinkingFormat choisit la sérialisation wire.",
			"card.capabilities.empty": "Aucun fournisseur personnalisé n'a de modèles configurés dans llm-pi-ai. Ajoutez d'abord un fournisseur et des modèles dans Paramètres → Modèles.",
			"card.capabilities.unavailable": "L'espace de noms des paramètres llm-pi-ai est indisponible.",
			"card.capabilities.none": "(aucun modèle)",
			"card.capabilities.search": "Rechercher des modèles par nom ou ID…",
			"card.capabilities.noMatches": "Aucun modèle correspondant",
			"card.capabilities.quickSettings": "Paramètres rapides",
			"card.capabilities.presetOfficial": "Appliquer à tous : Off / High / Max (style officiel DeepSeek)",
			"card.capabilities.presetGeneric": "Appliquer à tous : Off / Low / Medium / High (générique)",
			"card.capabilities.vendor": "Fournisseur",
			"card.capabilities.developerRole": "La passerelle rejette le rôle developer",
			"card.capabilities.developerRoleHint": "Commutateur de compatibilité officiel (dsh ≥ v0.1.0-rc.8) : écrit compat.supportsDeveloperRole: false au niveau de la route pour que le prompt système soit envoyé avec le rôle system — corrige l'erreur Unexpected message role 400 sur les passerelles vLLM / SGLang. Décocher supprime le champ et restaure l'héritage.",
			"card.capabilities.takeover": "Prise en charge tierce",
			"card.capabilities.takeoverHint": "Une fois coché, les requêtes de modèle de cette route passent par le transport dsh-llm-openai-completions (envoi multimodal réel, garde de modalité, injection de prompt) et pi-ai sort. Écrit la liste providers du transport lui-même ; décocher retire la route. Le transport doit être installé.",
			"card.capabilities.takeoverHintAbsent": "Le transport dsh-llm-openai-completions n est pas installé — installez-le et activez-le pour la prise en charge par route.",
			"card.capabilities.expandProvider": "Déplier le fournisseur",
			"card.capabilities.collapseProvider": "Replier le fournisseur",
			"card.capabilities.openModelSettings": "Ouvrir les paramètres du modèle",
			"card.capabilities.closeModelSettings": "Replier les paramètres du modèle",
			"card.capabilities.vision": "Modèle vision",
			"card.capabilities.thinking": "Modèle de réflexion",
			"card.capabilities.supportsEffort": "Prend en charge think effort",
			"card.capabilities.efforts": "Niveaux de réflexion (cochez, puis saisissez la valeur wire)",
			"card.capabilities.wirePlaceholder": "Valeur wire, ex. ultra",
			"card.capabilities.offPlaceholder": "Vide = ne pas envoyer",
			"card.capabilities.atLeastThinking": "Sélectionnez au moins un niveau de réflexion (autre que off)",
			"card.capabilities.applyLevel": "Appliquer les niveaux",
			"card.capabilities.restoreDefault": "Restaurer les valeurs par défaut",
			"card.capabilities.unsaved": "Non enregistré",
			"card.capabilities.saveChanges": "Enregistrer les modifications",
			"card.capabilities.saved": "Enregistré",
			"card.capabilities.thinkingFormat": "Format de réflexion",
			"card.capabilities.thinkingFormat.inherit": "Hériter",
			"card.capabilities.contextWindow": "Limite de fenêtre de contexte",
			"card.capabilities.contextCustomPlaceholder": "Entier personnalisé, ex. 256000",
			"card.capabilities.contextClear": "Effacer",
			"card.capabilities.contextInteger": "La longueur du contexte doit être un entier (2000-1000000)",
			"card.capabilities.contextRange": "La longueur du contexte doit être comprise entre 2000 et 1000000",
			"card.capabilities.contextHint": "Choisissez un préréglage ou saisissez un entier (2000–1000000) ; écrit dans llm-pi-ai pour la pression/compression du contexte et appliqué à la requête suivante sans redémarrage.",
			"input.context.title": "Fenêtre de contexte",
			"input.context.globalHint": "S'applique globalement à toutes les sessions utilisant ce modèle (Effacer restaure la valeur par défaut)",
			"input.context.unset": "Non défini",
			"input.context.custom": "Personnalisé",
			"input.context.noModel": "Aucun modèle de session",
			"input.context.customPlaceholder": "Entier personnalisé, ex. 256000",
			"input.context.apply": "Appliquer",
			"input.context.clear": "Effacer",
			"input.context.integer": "La longueur du contexte doit être un entier (2000-1000000)",
			"input.context.range": "La longueur du contexte doit être comprise entre 2000 et 1000000",
			"model.panel.choose": "Choisir un modèle",
			"model.panel.loading": "Chargement du répertoire de modèles…",
			"model.panel.empty": "Aucun modèle disponible",
			"model.panel.window": "Fenêtre",
			"model.panel.noTarget": "Aucune entrée de configuration inscriptible pour ce modèle",
			"model.panel.unavailable": "Le répertoire de modèles est indisponible pour cette session",
			"input.effort.title": "Effort de raisonnement",
			"input.effort.default": "Valeur par défaut du fournisseur",
			"input.effort.reset": "Restaurer la valeur par défaut du fournisseur",
			"card.capabilities.failed": "Échec de l'enregistrement : la valeur a été rejetée ou est en conflit. Vérifiez-la."
		};
		/** German dictionary (keys mirror zh). */
		const de = {
			"card.title": "Denkstufen",
			"family.title": "Qizi-Plugin-Einstellungen",
			"card.description": "Wählen Sie Auto im Modellselektor: Das Plugin plant low / high / max anhand des Tool-Aufrufverlaufs, bevor der API-Aufwand übermittelt wird. Hier konfigurieren Sie die Standardstufe, Planer-Grenzen und Modellfähigkeiten (Stufe → Gateway-Drahtwert-Zuordnung).",
			"card.level": "Standardstufe",
			"card.level.off": "off — Denken deaktivieren (nur manuell, nie automatisch gewählt)",
			"card.level.on": "on — Denken aktivieren (nur Umschaltmodelle; sendet enable_thinking, nie einen Aufwand)",
			"card.level.minimal": "minimal — geringst (sehr leichte Aufgaben)",
			"card.level.low": "low — niedrig (günstige Runden bleiben günstig)",
			"card.level.medium": "medium — mittel",
			"card.level.high": "high — hoch (offizieller Standard)",
			"card.level.xhigh": "xhigh — extra hoch",
			"card.level.max": "max — maximal (schwere Aufgaben)",
			"card.level.auto": "auto — Planung aus Tool-Verlauf (Standard)",
			"card.enabled": "Aktiviert",
			"card.allowDowngrade": "Herabstufung erlauben (auto kann auf low fallen)",
			"card.allowUpgrade": "Hochstufung erlauben (auto kann auf max steigen)",
			"card.unavailable": "Einstellungs-Namensraum nicht verfügbar: Stellen Sie sicher, dass dsh-thinking-levels in diesem Profil eingebunden ist.",
			"card.readonly": "Schreibgeschützt",
			"card.capabilities": "Modellfähigkeiten (llm-pi-ai benutzerdefinierte Anbieter)",
			"card.capabilities.hint": "Liest und schreibt die llm-pi-ai-Konfiguration direkt: Aktivieren Sie eine Stufe und geben Sie den genauen Wert ein, der an das Gateway gesendet wird (z. B. high → ultra); off leer lassen bedeutet „nicht senden\". Vision steuert die Bild-Eingabe; der Denk-Schalter treibt enable_thinking; thinkingFormat wählt die Wire-Serialisierung.",
			"card.capabilities.empty": "Kein benutzerdefinierter Anbieter hat Modelle in llm-pi-ai konfiguriert. Fügen Sie zuerst einen Anbieter und Modelle unter Einstellungen → Modelle hinzu.",
			"card.capabilities.unavailable": "Der llm-pi-ai Einstellungs-Namensraum ist nicht verfügbar.",
			"card.capabilities.none": "(keine Modelle)",
			"card.capabilities.search": "Modelle nach Name oder ID suchen…",
			"card.capabilities.noMatches": "Keine passenden Modelle",
			"card.capabilities.quickSettings": "Schnelleinstellungen",
			"card.capabilities.presetOfficial": "Auf alle anwenden: Off / High / Max (offizieller DeepSeek-Stil)",
			"card.capabilities.presetGeneric": "Auf alle anwenden: Off / Low / Medium / High (generisch)",
			"card.capabilities.vendor": "Anbieter",
			"card.capabilities.developerRole": "Gateway lehnt die Entwickler-Rolle ab",
			"card.capabilities.developerRoleHint": "Offizieller Kompatibilitätsschalter (dsh ≥ v0.1.0-rc.8): Schreibt compat.supportsDeveloperRole: false auf Routenebene, damit der System-Prompt als Rolle system gesendet wird — behebt den Unexpected message role 400 auf vLLM / SGLang Gateways. Deaktivieren löscht das Feld und stellt die Vererbung wieder her.",
			"card.capabilities.takeover": "Third-Party-Übernahme",
			"card.capabilities.takeoverHint": "Ist dies aktiviert, werden die Modellanfragen dieser Route durch die dsh-llm-openai-completions-Transportschicht geleitet (echtes Multimodal-Senden, Modalitäts-Gate, Prompt-Injection) und pi-ai tritt zurück. Schreibt die providers-Liste der Transportschicht selbst; Deaktivieren entfernt die Route. Die Transportschicht muss installiert sein.",
			"card.capabilities.takeoverHintAbsent": "Die Transportschicht dsh-llm-openai-completions ist nicht installiert — bitte zuerst installieren und aktivieren, um Routen gezielt zu übernehmen.",
			"card.capabilities.expandProvider": "Anbieter aufklappen",
			"card.capabilities.collapseProvider": "Anbieter einklappen",
			"card.capabilities.openModelSettings": "Modelleinstellungen öffnen",
			"card.capabilities.closeModelSettings": "Modelleinstellungen einklappen",
			"card.capabilities.vision": "Vision-Modell",
			"card.capabilities.thinking": "Denkmodell",
			"card.capabilities.supportsEffort": "Unterstützt think effort",
			"card.capabilities.efforts": "Denkstufen (aktivieren, dann Drahtwert eingeben)",
			"card.capabilities.wirePlaceholder": "Drahtwert, z. B. ultra",
			"card.capabilities.offPlaceholder": "Leer = nicht senden",
			"card.capabilities.atLeastThinking": "Wählen Sie mindestens eine Denkstufe (außer off)",
			"card.capabilities.applyLevel": "Stufen anwenden",
			"card.capabilities.restoreDefault": "Standardwerte wiederherstellen",
			"card.capabilities.unsaved": "Ungespeichert",
			"card.capabilities.saveChanges": "Änderungen speichern",
			"card.capabilities.saved": "Gespeichert",
			"card.capabilities.thinkingFormat": "Denkformat",
			"card.capabilities.thinkingFormat.inherit": "Erben",
			"card.capabilities.contextWindow": "Kontextfenster-Limit",
			"card.capabilities.contextCustomPlaceholder": "Benutzerdefinierte Ganzzahl, z. B. 256000",
			"card.capabilities.contextClear": "Löschen",
			"card.capabilities.contextInteger": "Kontextlänge muss eine Ganzzahl sein (2000-1000000)",
			"card.capabilities.contextRange": "Kontextlänge muss zwischen 2000 und 1000000 liegen",
			"card.capabilities.contextHint": "Wählen Sie eine Voreinstellung oder geben Sie eine Ganzzahl ein (2000–1000000); wird in llm-pi-ai geschrieben für Kontextdruck/Komprimierung und gilt ab der nächsten Anfrage ohne Neustart.",
			"input.context.title": "Kontextfenster",
			"input.context.globalHint": "Gilt global für alle Sitzungen mit diesem Modell (Löschen stellt den Standard wieder her)",
			"input.context.unset": "Nicht festgelegt",
			"input.context.custom": "Benutzerdefiniert",
			"input.context.noModel": "Noch kein Sitzungsmodell",
			"input.context.customPlaceholder": "Benutzerdefinierte Ganzzahl, z. B. 256000",
			"input.context.apply": "Anwenden",
			"input.context.clear": "Löschen",
			"input.context.integer": "Kontextlänge muss eine Ganzzahl sein (2000-1000000)",
			"input.context.range": "Kontextlänge muss zwischen 2000 und 1000000 liegen",
			"model.panel.choose": "Modell wählen",
			"model.panel.loading": "Modellverzeichnis wird geladen…",
			"model.panel.empty": "Keine Modelle verfügbar",
			"model.panel.window": "Fenster",
			"model.panel.noTarget": "Kein beschreibbarer Konfigurationseintrag für dieses Modell",
			"model.panel.unavailable": "Das Modellverzeichnis ist für diese Sitzung nicht verfügbar",
			"input.effort.title": "Schlussfolgerungsaufwand",
			"input.effort.default": "Anbieterstandard",
			"input.effort.reset": "Auf Anbieterstandard zurücksetzen",
			"card.capabilities.failed": "Speichern fehlgeschlagen: Der Wert wurde abgelehnt oder steht in Konflikt. Bitte überprüfen."
		};
		/** Italian dictionary (keys mirror zh). */
		const it = {
			"card.title": "Livelli di ragionamento",
			"family.title": "Impostazioni plugin Qizi",
			"card.description": "Scegli Auto nel selettore del modello: il plugin pianifica low / high / max in base alla cronologia delle chiamate degli strumenti prima di inviare l'effort all'API. Qui configuri il livello predefinito, i limiti dello scheduler e le capacità per modello (livello → valore wire inviato al gateway).",
			"card.level": "Livello predefinito",
			"card.level.off": "off — disabilita il ragionamento (solo manuale, mai scelto automaticamente)",
			"card.level.on": "on — abilita il ragionamento (solo modelli a commutazione; invia enable_thinking, mai un effort)",
			"card.level.minimal": "minimal — minimo (compiti molto leggeri)",
			"card.level.low": "low — basso (i round economici restano economici)",
			"card.level.medium": "medium — medio",
			"card.level.high": "high — alto (predefinito ufficiale)",
			"card.level.xhigh": "xhigh — molto alto",
			"card.level.max": "max — massimo (compiti pesanti)",
			"card.level.auto": "auto — pianificazione dalla cronologia strumenti (predefinito)",
			"card.enabled": "Abilitato",
			"card.allowDowngrade": "Consenti declassamento (auto può scendere a low)",
			"card.allowUpgrade": "Consenti avanzamento (auto può salire a max)",
			"card.unavailable": "Namespace delle impostazioni non disponibile: assicurati che dsh-thinking-levels sia integrato in questo profilo.",
			"card.readonly": "Sola lettura",
			"card.capabilities": "Capacità del modello (provider personalizzati llm-pi-ai)",
			"card.capabilities.hint": "Legge e scrive direttamente la configurazione llm-pi-ai: spunta un livello e inserisci il valore esatto inviato al gateway (es. high → ultra); lasciare off vuoto significa «non inviare». Vision controlla l'input immagine; l'interruttore di ragionamento guida enable_thinking; thinkingFormat sceglie la serializzazione wire.",
			"card.capabilities.empty": "Nessun provider personalizzato ha modelli configurati in llm-pi-ai. Aggiungi prima un provider e dei modelli in Impostazioni → Modelli.",
			"card.capabilities.unavailable": "Il namespace delle impostazioni llm-pi-ai non è disponibile.",
			"card.capabilities.none": "(nessun modello)",
			"card.capabilities.search": "Cerca modelli per nome o ID…",
			"card.capabilities.noMatches": "Nessun modello corrispondente",
			"card.capabilities.quickSettings": "Impostazioni rapide",
			"card.capabilities.presetOfficial": "Applica a tutti: Off / High / Max (stile ufficiale DeepSeek)",
			"card.capabilities.presetGeneric": "Applica a tutti: Off / Low / Medium / High (generico)",
			"card.capabilities.vendor": "Provider",
			"card.capabilities.developerRole": "Il gateway rifiuta il ruolo developer",
			"card.capabilities.developerRoleHint": "Interruttore di compatibilità ufficiale (dsh ≥ v0.1.0-rc.8): scrive compat.supportsDeveloperRole: false a livello di rotta così il prompt di sistema viene inviato come ruolo system — corregge l'errore Unexpected message role 400 su gateway vLLM / SGLang. Deselezionare elimina il campo e ripristina l'ereditarietà.",
			"card.capabilities.takeover": "Takeover di terze parti",
			"card.capabilities.takeoverHint": "Se selezionato, le richieste di modello di questa rotta passano per il trasporto dsh-llm-openai-completions (invio multimodale reale, gate di modalita, iniezione del prompt) e pi-ai esce. Scrive la lista providers del trasporto stesso; deselezionare rimuove la rotta. Richiede il trasporto installato.",
			"card.capabilities.takeoverHintAbsent": "Il trasporto dsh-llm-openai-completions non è installato — installarlo e attivarlo per il takeover per rotta.",
			"card.capabilities.expandProvider": "Espandi provider",
			"card.capabilities.collapseProvider": "Comprimi provider",
			"card.capabilities.openModelSettings": "Apri impostazioni modello",
			"card.capabilities.closeModelSettings": "Comprimi impostazioni modello",
			"card.capabilities.vision": "Modello vision",
			"card.capabilities.thinking": "Modello di ragionamento",
			"card.capabilities.supportsEffort": "Supporta think effort",
			"card.capabilities.efforts": "Livelli di ragionamento (spunta, poi inserisci il valore wire)",
			"card.capabilities.wirePlaceholder": "Valore wire, es. ultra",
			"card.capabilities.offPlaceholder": "Vuoto = non inviare",
			"card.capabilities.atLeastThinking": "Seleziona almeno un livello di ragionamento (diverso da off)",
			"card.capabilities.applyLevel": "Applica livelli",
			"card.capabilities.restoreDefault": "Ripristina predefiniti",
			"card.capabilities.unsaved": "Non salvato",
			"card.capabilities.saveChanges": "Salva modifiche",
			"card.capabilities.saved": "Salvato",
			"card.capabilities.thinkingFormat": "Formato di ragionamento",
			"card.capabilities.thinkingFormat.inherit": "Eredita",
			"card.capabilities.contextWindow": "Limite finestra di contesto",
			"card.capabilities.contextCustomPlaceholder": "Intero personalizzato, es. 256000",
			"card.capabilities.contextClear": "Cancella",
			"card.capabilities.contextInteger": "La lunghezza del contesto deve essere un intero (2000-1000000)",
			"card.capabilities.contextRange": "La lunghezza del contesto deve essere compresa tra 2000 e 1000000",
			"card.capabilities.contextHint": "Scegli un predefinito o inserisci un intero (2000–1000000); scritto in llm-pi-ai per la pressione/compressione del contesto e applicato alla richiesta successiva senza riavvio.",
			"input.context.title": "Finestra di contesto",
			"input.context.globalHint": "Si applica globalmente a tutte le sessioni che usano questo modello (Cancella ripristina il predefinito)",
			"input.context.unset": "Non impostato",
			"input.context.custom": "Personalizzato",
			"input.context.noModel": "Nessun modello di sessione",
			"input.context.customPlaceholder": "Intero personalizzato, es. 256000",
			"input.context.apply": "Applica",
			"input.context.clear": "Cancella",
			"input.context.integer": "La lunghezza del contesto deve essere un intero (2000-1000000)",
			"input.context.range": "La lunghezza del contesto deve essere compresa tra 2000 e 1000000",
			"model.panel.choose": "Scegli modello",
			"model.panel.loading": "Caricamento directory modelli…",
			"model.panel.empty": "Nessun modello disponibile",
			"model.panel.window": "Finestra",
			"model.panel.noTarget": "Nessuna voce di configurazione scrivibile per questo modello",
			"model.panel.unavailable": "La directory dei modelli non è disponibile per questa sessione",
			"input.effort.title": "Sforzo di ragionamento",
			"input.effort.default": "Predefinito del provider",
			"input.effort.reset": "Ripristina il predefinito del provider",
			"card.capabilities.failed": "Salvataggio non riuscito: il valore è stato rifiutato o è in conflitto. Verifica."
		};
		/** Russian dictionary (keys mirror zh). */
		const ru = {
			"card.title": "Уровни мышления",
			"family.title": "Настройки плагинов Qizi",
			"card.description": "Выберите Auto в селекторе модели: плагин планирует low / high / max по истории вызовов инструментов перед отправкой effort в API. Здесь настраивается уровень по умолчанию, границы планировщика и возможности модели (уровень → значение, отправляемое шлюзу).",
			"card.level": "Уровень по умолчанию",
			"card.level.off": "off — отключить мышление (только вручную, никогда не выбирается автоматически)",
			"card.level.on": "on — включить мышление (только модели с переключателем; отправляет enable_thinking, без effort)",
			"card.level.minimal": "minimal — минимальный (очень лёгкие задачи)",
			"card.level.low": "low — низкий (дешёвые раунды остаются дешёвыми)",
			"card.level.medium": "medium — средний",
			"card.level.high": "high — высокий (официальное значение по умолчанию)",
			"card.level.xhigh": "xhigh — особо высокий",
			"card.level.max": "max — максимальный (тяжёлые задачи)",
			"card.level.auto": "auto — планирование по истории инструментов (по умолчанию)",
			"card.enabled": "Включено",
			"card.allowDowngrade": "Разрешить понижение (auto может снизить до low)",
			"card.allowUpgrade": "Разрешить повышение (auto может поднять до max)",
			"card.unavailable": "Пространство имён настроек недоступно: убедитесь, что dsh-thinking-levels подключён к этому профилю.",
			"card.readonly": "Только чтение",
			"card.capabilities": "Возможности модели (пользовательские провайдеры llm-pi-ai)",
			"card.capabilities.hint": "Напрямую читает и пишет конфигурацию llm-pi-ai: отметьте уровень и введите точное значение, отправляемое шлюзу (напр. high → ultra); пустое поле off означает «не отправлять». Vision управляет вводом изображений; переключатель мышления управляет enable_thinking; thinkingFormat задаёт формат сериализации wire.",
			"card.capabilities.empty": "Ни один пользовательский провайдер не имеет настроенных моделей в llm-pi-ai. Сначала добавьте провайдер и модели в Настройки → Модели.",
			"card.capabilities.unavailable": "Пространство имён настроек llm-pi-ai недоступно.",
			"card.capabilities.none": "(нет моделей)",
			"card.capabilities.search": "Поиск моделей по имени или ID…",
			"card.capabilities.noMatches": "Нет подходящих моделей",
			"card.capabilities.quickSettings": "Быстрые настройки",
			"card.capabilities.presetOfficial": "Применить ко всем: Off / High / Max (официальный стиль DeepSeek)",
			"card.capabilities.presetGeneric": "Применить ко всем: Off / Low / Medium / High (общий)",
			"card.capabilities.vendor": "Провайдер",
			"card.capabilities.developerRole": "Шлюз отклоняет роль developer",
			"card.capabilities.developerRoleHint": "Официальный переключатель совместимости (dsh ≥ v0.1.0-rc.8): записывает compat.supportsDeveloperRole: false на уровне маршрута, чтобы системный промпт отправлялся с ролью system — исправляет Unexpected message role 400 на шлюзах vLLM / SGLang. Снятие флажка удаляет поле и восстанавливает наследование.",
			"card.capabilities.takeover": "Сторонний перехват",
			"card.capabilities.takeoverHint": "Если включено, запросы модели этого маршрута направляются через транспорт dsh-llm-openai-completions (истинная мультимодальная отправка, шлюз модальностей, инъекция промпта), а pi-ai устраняется. Записывает список providers самого транспорта; снятие флажка убирает маршрут. Требуется установленный транспорт.",
			"card.capabilities.takeoverHintAbsent": "Транспорт dsh-llm-openai-completions не установлен — установите и включите его для перехвата по маршрутам.",
			"card.capabilities.expandProvider": "Развернуть провайдер",
			"card.capabilities.collapseProvider": "Свернуть провайдер",
			"card.capabilities.openModelSettings": "Открыть настройки модели",
			"card.capabilities.closeModelSettings": "Свернуть настройки модели",
			"card.capabilities.vision": "Модель с vision",
			"card.capabilities.thinking": "Модель с мышлением",
			"card.capabilities.supportsEffort": "Поддерживает think effort",
			"card.capabilities.efforts": "Уровни мышления (отметьте, затем введите значение wire)",
			"card.capabilities.wirePlaceholder": "Значение wire, напр. ultra",
			"card.capabilities.offPlaceholder": "Пусто = не отправлять",
			"card.capabilities.atLeastThinking": "Выберите хотя бы один уровень мышления (кроме off)",
			"card.capabilities.applyLevel": "Применить уровни",
			"card.capabilities.restoreDefault": "Восстановить значения по умолчанию",
			"card.capabilities.unsaved": "Не сохранено",
			"card.capabilities.saveChanges": "Сохранить изменения",
			"card.capabilities.saved": "Сохранено",
			"card.capabilities.thinkingFormat": "Формат мышления",
			"card.capabilities.thinkingFormat.inherit": "Наследовать",
			"card.capabilities.contextWindow": "Лимит контекстного окна",
			"card.capabilities.contextCustomPlaceholder": "Пользовательское целое число, напр. 256000",
			"card.capabilities.contextClear": "Очистить",
			"card.capabilities.contextInteger": "Длина контекста должна быть целым числом (2000-1000000)",
			"card.capabilities.contextRange": "Длина контекста должна быть от 2000 до 1000000",
			"card.capabilities.contextHint": "Выберите пресет или введите целое число (2000–1000000); записывается в llm-pi-ai для давления/сжатия контекста и применяется к следующему запросу без перезапуска.",
			"input.context.title": "Контекстное окно",
			"input.context.globalHint": "Применяется глобально ко всем сессиям с этой моделью (Очистить восстанавливает значение по умолчанию)",
			"input.context.unset": "Не задано",
			"input.context.custom": "Пользовательское",
			"input.context.noModel": "Модель сессии ещё не выбрана",
			"input.context.customPlaceholder": "Пользовательское целое число, напр. 256000",
			"input.context.apply": "Применить",
			"input.context.clear": "Очистить",
			"input.context.integer": "Длина контекста должна быть целым числом (2000-1000000)",
			"input.context.range": "Длина контекста должна быть от 2000 до 1000000",
			"model.panel.choose": "Выбрать модель",
			"model.panel.loading": "Загрузка каталога моделей…",
			"model.panel.empty": "Нет доступных моделей",
			"model.panel.window": "Окно",
			"model.panel.noTarget": "Нет записываемой записи конфигурации для этой модели",
			"model.panel.unavailable": "Каталог моделей недоступен для этой сессии",
			"input.effort.title": "Усилие рассуждения",
			"input.effort.default": "Значение провайдера по умолчанию",
			"input.effort.reset": "Вернуть значение провайдера по умолчанию",
			"card.capabilities.failed": "Ошибка сохранения: значение отклонено или конфликтует. Проверьте его."
		};
		/** Spanish dictionary (keys mirror zh). */
		const es = {
			"card.title": "Niveles de razonamiento",
			"family.title": "Configuración de plugins Qizi",
			"card.description": "Elige Auto en el selector de modelo: el plugin planifica low / high / max según el historial de llamadas de herramientas antes de enviar el effort a la API. Aquí configuras el nivel predeterminado, los límites del planificador y las capacidades por modelo (nivel → valor wire enviado al gateway).",
			"card.level": "Nivel predeterminado",
			"card.level.off": "off — desactivar razonamiento (solo manual, nunca seleccionado automáticamente)",
			"card.level.on": "on — activar razonamiento (solo modelos de conmutación; envía enable_thinking, nunca un effort)",
			"card.level.minimal": "minimal — mínimo (tareas muy ligeras)",
			"card.level.low": "low — bajo (las rondas económicas siguen siendo económicas)",
			"card.level.medium": "medium — medio",
			"card.level.high": "high — alto (predeterminado oficial)",
			"card.level.xhigh": "xhigh — extra alto",
			"card.level.max": "max — máximo (tareas pesadas)",
			"card.level.auto": "auto — planificación desde el historial de herramientas (predeterminado)",
			"card.enabled": "Activado",
			"card.allowDowngrade": "Permitir degradación (auto puede bajar a low)",
			"card.allowUpgrade": "Permitir mejora (auto puede subir a max)",
			"card.unavailable": "Espacio de nombres de configuración no disponible: asegúrate de que dsh-thinking-levels esté ensamblado en este perfil.",
			"card.readonly": "Solo lectura",
			"card.capabilities": "Capacidades del modelo (proveedores personalizados llm-pi-ai)",
			"card.capabilities.hint": "Lee y escribe directamente la configuración de llm-pi-ai: marca un nivel e introduce el valor exacto enviado al gateway (ej. high → ultra); dejar off vacío significa «no enviar». Vision controla la entrada de imágenes; el interruptor de razonamiento gestiona enable_thinking; thinkingFormat elige la serialización wire.",
			"card.capabilities.empty": "Ningún proveedor personalizado tiene modelos configurados en llm-pi-ai. Añade primero un proveedor y modelos en Configuración → Modelos.",
			"card.capabilities.unavailable": "El espacio de nombres de configuración de llm-pi-ai no está disponible.",
			"card.capabilities.none": "(sin modelos)",
			"card.capabilities.search": "Buscar modelos por nombre o ID…",
			"card.capabilities.noMatches": "No hay modelos coincidentes",
			"card.capabilities.quickSettings": "Configuración rápida",
			"card.capabilities.presetOfficial": "Aplicar a todos: Off / High / Max (estilo oficial DeepSeek)",
			"card.capabilities.presetGeneric": "Aplicar a todos: Off / Low / Medium / High (genérico)",
			"card.capabilities.vendor": "Proveedor",
			"card.capabilities.developerRole": "El gateway rechaza el rol developer",
			"card.capabilities.developerRoleHint": "Interruptor de compatibilidad oficial (dsh ≥ v0.1.0-rc.8): escribe compat.supportsDeveloperRole: false a nivel de ruta para que el prompt del sistema se envíe con rol system — corrige el error Unexpected message role 400 en gateways vLLM / SGLang. Desmarcar elimina el campo y restaura la herencia.",
			"card.capabilities.takeover": "Toma de control de terceros",
			"card.capabilities.takeoverHint": "Al marcarlo, las peticiones de modelo de esta ruta se envian a traves del transporte dsh-llm-openai-completions (envio multimodal real, puerta de modalidad, inyeccion de prompt) y pi-ai sale. Escribe la lista providers del propio transporte; desmarcar elimina la ruta. Requiere el transporte instalado.",
			"card.capabilities.takeoverHintAbsent": "El transporte dsh-llm-openai-completions no esta instalado — instalalo y activalo para la toma de control por ruta.",
			"card.capabilities.expandProvider": "Expandir proveedor",
			"card.capabilities.collapseProvider": "Contraer proveedor",
			"card.capabilities.openModelSettings": "Abrir configuración del modelo",
			"card.capabilities.closeModelSettings": "Contraer configuración del modelo",
			"card.capabilities.vision": "Modelo de visión",
			"card.capabilities.thinking": "Modelo de razonamiento",
			"card.capabilities.supportsEffort": "Soporta think effort",
			"card.capabilities.efforts": "Niveles de razonamiento (marca, luego introduce el valor wire)",
			"card.capabilities.wirePlaceholder": "Valor wire, ej. ultra",
			"card.capabilities.offPlaceholder": "Vacío = no enviar",
			"card.capabilities.atLeastThinking": "Selecciona al menos un nivel de razonamiento (distinto de off)",
			"card.capabilities.applyLevel": "Aplicar niveles",
			"card.capabilities.restoreDefault": "Restaurar valores predeterminados",
			"card.capabilities.unsaved": "Sin guardar",
			"card.capabilities.saveChanges": "Guardar cambios",
			"card.capabilities.saved": "Guardado",
			"card.capabilities.thinkingFormat": "Formato de razonamiento",
			"card.capabilities.thinkingFormat.inherit": "Heredar",
			"card.capabilities.contextWindow": "Límite de ventana de contexto",
			"card.capabilities.contextCustomPlaceholder": "Entero personalizado, ej. 256000",
			"card.capabilities.contextClear": "Borrar",
			"card.capabilities.contextInteger": "La longitud del contexto debe ser un entero (2000-1000000)",
			"card.capabilities.contextRange": "La longitud del contexto debe estar entre 2000 y 1000000",
			"card.capabilities.contextHint": "Elige un ajuste predefinido o introduce un entero (2000–1000000); se escribe en llm-pi-ai para la presión/compresión del contexto y se aplica a la siguiente solicitud sin reiniciar.",
			"input.context.title": "Ventana de contexto",
			"input.context.globalHint": "Se aplica globalmente a todas las sesiones que usan este modelo (Borrar restaura el valor predeterminado)",
			"input.context.unset": "Sin definir",
			"input.context.custom": "Personalizado",
			"input.context.noModel": "Aún no hay modelo de sesión",
			"input.context.customPlaceholder": "Entero personalizado, ej. 256000",
			"input.context.apply": "Aplicar",
			"input.context.clear": "Borrar",
			"input.context.integer": "La longitud del contexto debe ser un entero (2000-1000000)",
			"input.context.range": "La longitud del contexto debe estar entre 2000 y 1000000",
			"model.panel.choose": "Elegir modelo",
			"model.panel.loading": "Cargando el directorio de modelos…",
			"model.panel.empty": "No hay modelos disponibles",
			"model.panel.window": "Ventana",
			"model.panel.noTarget": "No hay entrada de configuración escribible para este modelo",
			"model.panel.unavailable": "El directorio de modelos no está disponible para esta sesión",
			"input.effort.title": "Esfuerzo de razonamiento",
			"input.effort.default": "Predeterminado del proveedor",
			"input.effort.reset": "Restaurar el valor predeterminado del proveedor",
			"card.capabilities.failed": "Error al guardar: el valor fue rechazado o está en conflicto. Verifícalo."
		};
		//#endregion
		//#region src/client/context-ring.tsx
		/**
		* Context-capacity check ring for the composer tool row
		* (`conversation.input.right`, the seat just left of the send button —
		* the same seat the retired context-window pill used, and the same side of
		* the composer where the shipped ContextMeter lived).
		*
		* Why this exists: the model-seat panel replaced the shipped `ModelSelect`
		* trigger and popup, and with them went the shipped context meter — the
		* "how full is this window" read. The editor part moved into the model
		* panel's per-model lines; the CHECK part (used vs. window, pressure, a
		* breakdown, a warning before you run out) is what this ring restores.
		* Layout language follows better-er/dsh-cache-billing (rows with a color
		* swatch, token counts right-aligned, a muted footer note), which itself
		* pins into the shipped meter's popup.
		*
		* Data: the session projection seats. `useProjection('contextPressure')`
		* is the same feed the shipped meter consumes (`{ usedTokens, contextWindow,
		* percent }`), `useProjection('contextBreakdown')` the three-way split
		* (`{ systemTokens, toolsTokens, messageTokens }`). Both are optional on the
		* props and defensively read: a harness without the projection seat, or a
		* session before its first request, renders nothing here instead of a dead
		* control (the retired pill's discipline). Values refresh live while the
		* projection pushes — no polling.
		*
		* Zero host coupling beyond react + the injected seats: plain SVG + HTML
		* with token-based inline styling; copy is inline zh/en by document language
		* (the plugin's locale dictionaries stay untouched).
		*/
		const COPY = {
			zh: {
				title: "上下文检查",
				used: "已用",
				remaining: "剩余",
				window: "窗口容量",
				percent: "占用",
				system: "系统提示词",
				tools: "工具定义",
				messages: "对话消息",
				warning: "上下文即将用尽——建议压缩上下文或开启新会话。",
				aria: (percent) => `上下文已用 ${percent}`,
				unset: "本轮尚未产生用量",
				billing: "缓存账单",
				billStep: "当前步",
				billTurn: "当前轮",
				billSession: "会话累计",
				billCacheRead: "缓存命中",
				billPriced: "按 DeepSeek-V4.1-Flash 计价",
				billEstimate: "按 Flash 价估算"
			},
			en: {
				title: "Context check",
				used: "Used",
				remaining: "Remaining",
				window: "Context window",
				percent: "Pressure",
				system: "System prompt",
				tools: "Tool definitions",
				messages: "Messages",
				warning: "Context is nearly full — compact the context or start a new session.",
				aria: (percent) => `${percent} of context used`,
				unset: "No usage yet in this turn",
				billing: "Cache billing",
				billStep: "This step",
				billTurn: "This turn",
				billSession: "Session total",
				billCacheRead: "Cache read",
				billPriced: "priced as DeepSeek-V4.1-Flash",
				billEstimate: "estimated at Flash prices"
			}
		};
		const copy = () => typeof document !== "undefined" && document.documentElement.lang?.toLowerCase().startsWith("zh") ? COPY.zh : COPY.en;
		const RING_SIZE = 18;
		const RING_STROKE = 2.5;
		const triggerStyle$1 = {
			display: "inline-flex",
			alignItems: "center",
			gap: "5px",
			height: "24px",
			padding: "0 6px",
			background: "transparent",
			border: "none",
			borderRadius: "6px",
			cursor: "pointer",
			color: "var(--dsw-alias-label-secondary, inherit)",
			fontFamily: "var(--ds-font-family-code, monospace)",
			fontSize: "11px",
			lineHeight: "16px",
			whiteSpace: "nowrap"
		};
		const popStyle$1 = {
			position: "absolute",
			bottom: "calc(100% + 8px)",
			right: 0,
			zIndex: 1200,
			minWidth: "264px",
			padding: "10px 12px",
			background: "var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.05))",
			color: "var(--dsw-alias-label-primary, inherit)",
			border: "1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.25))",
			borderRadius: "10px",
			boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
			fontSize: "12px",
			lineHeight: "18px"
		};
		const headStyle = {
			display: "flex",
			alignItems: "baseline",
			gap: "8px",
			fontWeight: 600,
			marginBottom: "4px"
		};
		const figureStyle = {
			fontVariantNumeric: "tabular-nums",
			fontFamily: "var(--ds-font-family-code, monospace)"
		};
		const rowStyle$1 = {
			display: "flex",
			alignItems: "center",
			gap: "12px",
			padding: "2px 0"
		};
		const rowLabelStyle = {
			display: "flex",
			alignItems: "center",
			color: "var(--dsw-alias-label-secondary, inherit)"
		};
		const rowValueStyle = {
			marginLeft: "auto",
			fontVariantNumeric: "tabular-nums",
			fontWeight: 500,
			textAlign: "right"
		};
		const swatchStyle = (color) => ({
			display: "inline-block",
			width: "8px",
			height: "8px",
			borderRadius: "2px",
			marginRight: "6px",
			flex: "none",
			background: color
		});
		const warnStyle = {
			marginTop: "6px",
			color: "#f43f5e",
			fontSize: "11px",
			lineHeight: "16px"
		};
		const footStyle = {
			marginTop: "6px",
			color: "var(--dsw-alias-label-caption, inherit)",
			fontSize: "11px",
			lineHeight: "16px"
		};
		const BREAKDOWN_COLORS = {
			system: "#8b5cf6",
			tools: "#0ea5e9",
			messages: "#10b981"
		};
		/** Pressure color: calm → amber → red (cache-billing's foot/warn palette). */
		function pressureColor(percent) {
			if (percent >= 85) return "#f43f5e";
			if (percent >= 70) return "#f59e0b";
			return "var(--dsw-alias-label-secondary, currentColor)";
		}
		/** Format a token count compactly (12.3k / 1.24M). */
		function formatTokens(n) {
			if (n >= 1e6) return `${Math.round(n / 1e6 * 100) / 100}M`;
			if (n >= 1e3) return `${Math.round(n / 1e3 * 10) / 10}k`;
			return String(Math.round(n));
		}
		/** Format an amount: four decimals for a step, fewer for the totals. */
		function formatMoney(amount, digits) {
			return `¥${amount.toFixed(digits)}`;
		}
		/** The SVG ring: one background track + one pressure arc. */
		function Ring({ percent, color }) {
			const r = 15.5 / 2;
			const c = 2 * Math.PI * r;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: RING_SIZE,
				height: RING_SIZE,
				viewBox: `0 0 ${RING_SIZE} ${RING_SIZE}`,
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: RING_SIZE / 2,
					cy: RING_SIZE / 2,
					r,
					fill: "none",
					stroke: "var(--dsw-alias-border-l2, rgba(127,127,127,0.3))",
					strokeWidth: RING_STROKE
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: RING_SIZE / 2,
					cy: RING_SIZE / 2,
					r,
					fill: "none",
					stroke: color,
					strokeWidth: RING_STROKE,
					strokeLinecap: "round",
					strokeDasharray: `${c * Math.max(0, Math.min(100, percent)) / 100} ${c}`,
					transform: `rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`
				})]
			});
		}
		/** One breakdown row (cache-billing's swatch-row layout). */
		function BreakdownRow({ label, value, color }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: rowStyle$1,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dt", {
					style: rowLabelStyle,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: swatchStyle(color) }), label]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
					style: {
						...rowValueStyle,
						margin: 0
					},
					children: formatTokens(value)
				})]
			});
		}
		/**
		* The ring entry: pressure arc trigger + the check popover. Renders nothing
		* without a projection seat or before the session has any reading.
		*/
		function ContextRing(props) {
			const { useProjection } = props;
			const pressure = useProjection?.("contextPressure");
			const breakdown = useProjection?.("contextBreakdown");
			const billing = useProjection?.("cacheBilling");
			const [open, setOpen] = (0, react.useState)(false);
			const rootRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onPointerDown = (event) => {
					if (rootRef.current !== null && event.target instanceof Node && !rootRef.current.contains(event.target)) setOpen(false);
				};
				const onKeyDown = (event) => {
					if (event.key === "Escape") setOpen(false);
				};
				document.addEventListener("pointerdown", onPointerDown, true);
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("pointerdown", onPointerDown, true);
					document.removeEventListener("keydown", onKeyDown);
				};
			}, [open]);
			if (!(typeof useProjection === "function")) return null;
			const used = typeof pressure?.projectedTokens === "number" ? pressure.projectedTokens : typeof pressure?.pressureTokens === "number" ? pressure.pressureTokens : void 0;
			const window_ = typeof pressure?.contextWindow === "number" ? pressure.contextWindow : void 0;
			const hasReading = used !== void 0 && window_ !== void 0 && window_ > 0;
			const c = copy();
			const percent = hasReading ? Math.min(100, Math.round(used / window_ * 100)) : 0;
			const color = pressureColor(percent);
			const remaining = hasReading ? Math.max(0, window_ - used) : 0;
			const rows = !hasReading || breakdown === void 0 ? [] : [
				{
					label: c.system,
					value: breakdown.systemTokens,
					color: BREAKDOWN_COLORS.system
				},
				{
					label: c.tools,
					value: breakdown.toolsTokens,
					color: BREAKDOWN_COLORS.tools
				},
				{
					label: c.messages,
					value: breakdown.messageTokens,
					color: BREAKDOWN_COLORS.messages
				}
			];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: rootRef,
				style: {
					position: "relative",
					display: "inline-flex"
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					style: hasReading ? triggerStyle$1 : {
						...triggerStyle$1,
						opacity: .55
					},
					"aria-label": hasReading ? c.aria(`${percent}%`) : c.unset,
					"aria-haspopup": hasReading ? "dialog" : void 0,
					"aria-expanded": open,
					onClick: () => {
						if (hasReading) setOpen((state) => !state);
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Ring, {
						percent,
						color
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							...figureStyle,
							color: hasReading ? color : "var(--dsw-alias-label-caption, inherit)"
						},
						children: hasReading ? `${percent}%` : "–"
					})]
				}), open && hasReading && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: popStyle$1,
					role: "dialog",
					"aria-label": c.title,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: headStyle,
							children: [c.title, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: {
									...rowValueStyle,
									...figureStyle
								},
								children: [
									"~",
									formatTokens(used),
									" / ",
									formatTokens(window_)
								]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: rowStyle$1,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", {
								style: rowLabelStyle,
								children: c.percent
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", {
								style: {
									...rowValueStyle,
									margin: 0,
									color
								},
								children: [percent, "%"]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: rowStyle$1,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", {
								style: rowLabelStyle,
								children: c.remaining
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
								style: {
									...rowValueStyle,
									margin: 0
								},
								children: formatTokens(remaining)
							})]
						}),
						rows.every((row) => typeof row.value === "number") && rows.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dl", {
							style: {
								margin: "4px 0 0",
								padding: "6px 0 0",
								borderTop: "1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.18))"
							},
							children: rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BreakdownRow, {
								label: row.label,
								value: row.value,
								color: row.color
							}, row.label))
						}),
						billing?.available === true && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
							style: {
								margin: "4px 0 0",
								padding: "6px 0 0",
								borderTop: "1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.18))"
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", {
									style: {
										...rowLabelStyle,
										fontWeight: 600
									},
									children: c.billing
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: rowStyle$1,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", {
										style: rowLabelStyle,
										children: c.billStep
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
										style: {
											...rowValueStyle,
											margin: 0
										},
										children: formatMoney(billing.cost ?? 0, 4)
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: rowStyle$1,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", {
										style: rowLabelStyle,
										children: c.billTurn
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
										style: {
											...rowValueStyle,
											margin: 0
										},
										children: formatMoney(billing.turnCost ?? 0, 3)
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: rowStyle$1,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", {
										style: rowLabelStyle,
										children: c.billSession
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
										style: {
											...rowValueStyle,
											margin: 0
										},
										children: formatMoney((billing.sessionCacheHitCost ?? 0) + (billing.sessionMissCost ?? 0) + (billing.sessionOutputCost ?? 0), 2)
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: rowStyle$1,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", {
										style: rowLabelStyle,
										children: c.billCacheRead
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", {
										style: {
											...rowValueStyle,
											margin: 0
										},
										children: [formatTokens(billing.cacheReadTokens ?? 0), " tok"]
									})]
								})
							]
						}),
						percent >= 85 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: warnStyle,
							children: c.warning
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: footStyle,
							children: [
								c.window,
								": ",
								hasReading ? window_.toLocaleString() : c.unset,
								billing?.available === true ? ` · ${billing.modelMatched === false ? c.billEstimate : c.billPriced}` : ""
							]
						})
					]
				})]
			});
		}
		//#endregion
		//#region src/thinking-level.ts
		/**
		* Display rank of the effort slider stops: `auto` is the scheduler sentinel and
		* sits LEFTMOST regardless of whether the model allows disabling thinking;
		* `off` / `on` follow, then the strength gradient. Ids outside the standard set
		* (custom gateway wire values such as `ultra`) rank last, in arrival order.
		*/
		const EFFORT_SLIDER_RANK = {
			auto: 0,
			off: 1,
			on: 2,
			minimal: 3,
			low: 4,
			medium: 5,
			high: 6,
			xhigh: 7,
			max: 8
		};
		/** Fallback rank for ids outside the standard table. */
		const EFFORT_SLIDER_RANK_TAIL = 100;
		/**
		* Order a model's advertised efforts for the slider track (left → right).
		* Stable sort: unknown ids keep their relative arrival order after the known
		* ranks, so a gateway's custom wire values are never dropped or reordered
		* against each other.
		*/
		function orderEffortsForSlider(efforts) {
			return [...efforts].sort((a, b) => {
				return (EFFORT_SLIDER_RANK[a.id] ?? EFFORT_SLIDER_RANK_TAIL) - (EFFORT_SLIDER_RANK[b.id] ?? EFFORT_SLIDER_RANK_TAIL);
			});
		}
		/**
		* Map the line's effective effort to a stop index of the ordered track: exact
		* id match wins; an unmatched id (e.g. a defaultEffort the track does not
		* advertise) parks on the nearest stop by display rank, ties resolving to the
		* stronger level (higher index); an absent value parks on stop 0 (the neutral
		* left end — `auto` when advertised) and an empty track always yields 0, so the
		* caller never faces an out-of-range thumb.
		*/
		function nearestEffortStopIndex(stops, value) {
			if (stops.length === 0) return 0;
			if (value === void 0) return 0;
			const exact = stops.findIndex((stop) => stop.id === value);
			if (exact >= 0) return exact;
			const rank = EFFORT_SLIDER_RANK[value] ?? EFFORT_SLIDER_RANK_TAIL;
			let best = 0;
			let bestDistance = Number.POSITIVE_INFINITY;
			stops.forEach((stop, index) => {
				const stopRank = EFFORT_SLIDER_RANK[stop.id] ?? EFFORT_SLIDER_RANK_TAIL;
				const distance = Math.abs(stopRank - rank);
				if (distance <= bestDistance) {
					bestDistance = distance;
					best = index;
				}
			});
			return best;
		}
		//#endregion
		//#region src/client/whale-mascot.ts
		/**
		* Whale-girl runner strip (鲸鱼娘侧面奔跑立绘, original left-facing
		* orientation — she rides the thumb looking back along the track),
		* inlined as a palette PNG data URL — the client bundle purity gate
		* forbids non-inline assets. Source: HanaAyane/dsh-reasoning-effort
		* assets/chibi-runner-strip.png (community whale-girl derivative);
		* regenerate via `python tools/whale-mascot.py`.
		*/
		const WHALE_RUN_STRIP_SRC = "data:image/png;base64,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";
		/** Frame geometry of the strip, in asset pixels (2x the CSS display size). */
		const WHALE_RUN_STRIP = {
			frames: 8,
			frameW: 67,
			frameH: 92
		};
		//#endregion
		//#region src/client/effort-slider.tsx
		/**
		* Segment slider for one model line's reasoning effort (the 改造 of the retired
		* per-line `<select>`).
		*
		* Interaction follows the approved dsh-reasoning-effort visual spec: the thumb
		* follows the pointer CONTINUOUSLY and snaps to a stop on release (one
		* `directory.select` per gesture), the plain thumb is pure white in every
		* theme, the full thumb stays visible at both track endpoints, and
		* reduced-motion freezes motion. Deviations requested for this plugin: the
		* stop count adapts to the model's advertised efforts (not a fixed triple),
		* `auto` is pinned leftmost (see `orderEffortsForSlider`), and the whale-girl
		* runner thumb is per-line — DeepSeek lines run the 8-frame strip, every other
		* model gets the plain knob.
		*
		* The track carries the reference plugin's signature FX, ported from its
		* published bundle: a procedural canvas "radiation" (three sine waves with a
		* sharp crest, exponential trail decay from the thumb, a 4px pixel grid with
		* grain, 14 particle streaks flying left, and a radial glow at the thumb — all
		* clipped LEFT of the thumb, screen-blended over the track, pixelated), a CSS
		* flare at the thumb, theme-split tracks via `body[data-ds-dark-theme]`, a
		* light-theme progress fill, and a `[data-top]` breathe pulse. Dragging speeds
		* and brightens everything. The canvas runs a rAF loop unless
		* `prefers-reduced-motion` is set (then single frames on change).
		*
		* Inline styling only (no CSS modules in the client bundle) — everything a
		* stylesheet needs (pseudo-elements, keyframes, theme selectors, blend modes)
		* is injected once into `document.head` under a plugin-prefixed id. All math
		* is defensive: a render throw here would abdicate the whole model-seat entry
		* back to the shipped selector.
		*/
		/** Editor-row zone height: label row + track + headroom for the standing girl. */
		const ZONE_H = 74;
		/** Track thickness; sits `TRACK_B` px above the zone bottom (above the 14px label row).
		* Proportioned like the reference (track ≈ knob height), not a thin wire. */
		const TRACK_H = 24;
		const TRACK_B = 16;
		/** Horizontal inset keeping the thumb fully visible at both endpoint stops. */
		const PAD_MASCOT = 18;
		const PAD_KNOB = 14;
		/** Thumb metrics. */
		const GIRL_W = WHALE_RUN_STRIP.frameW / 2;
		const GIRL_H = WHALE_RUN_STRIP.frameH / 2;
		const GIRL_B = 24;
		const KNOB = 28;
		/** Flare pill sized to OUR track (the reference's 78×46 assumed a 30px track). */
		const FLARE_W = 60;
		const FLARE_H = 36;
		/** Label row height under the track. */
		const LABEL_H = 14;
		/** Strip footprint in CSS px (asset is 2x). */
		const STRIP_CSS_W = WHALE_RUN_STRIP.frameW * WHALE_RUN_STRIP.frames / 2;
		const STRIP_CSS_H = WHALE_RUN_STRIP.frameH / 2;
		const KEYFRAMES_ID = "dsh-thinking-levels-effort-slider";
		const ZONE_CLASS = "dsh-tl-zone";
		const RUN_CLASS = "dsh-tl-run";
		const GIRL_CLASS = "dsh-tl-girl";
		const KNOB_CLASS = "dsh-tl-knob";
		const TRACK_CLASS = "dsh-tl-track";
		const FILL_CLASS = "dsh-tl-fill";
		const CANVAS_CLASS = "dsh-tl-canvas";
		const FLARE_CLASS = "dsh-tl-flare";
		const RUN_KEYFRAMES = "dsh-tl-whale-run-keyframes";
		/**
		* The effect stylesheet: radiation track themes (dark violet gradient vs pale
		* blue + progress fill), the screen-blended pixelated canvas, the flare with
		* its cross streaks, dragging boosts, the `[data-top]` breathe pulses, the
		* girl's run cycle with drop-shadow glow, and the reduced-motion freezes.
		*/
		const EFFECT_CSS = `
.${ZONE_CLASS}:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px; }
.${TRACK_CLASS} {
  border-radius: 999px;
  overflow: hidden;
  isolation: isolate;
  background: linear-gradient(100deg, #03040a 0%, #071126 22%, #101d4c 45%, #302262 70%, #5d35a0 100%);
  box-shadow:
    inset 0 1px 0 rgba(189, 199, 255, .15),
    inset 0 -1px 0 rgba(0, 0, 0, .55),
    0 3px 10px rgba(12, 17, 55, .34);
}
body[data-ds-dark-theme] .${TRACK_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 45%, rgba(82, 130, 255, .12), transparent 24%),
    linear-gradient(90deg, rgba(0, 0, 0, .28), transparent 42%, rgba(168, 113, 255, .12));
}
body:not([data-ds-dark-theme]) .${TRACK_CLASS} {
  /* Gradient base even at 0% progress: LIGHT blue at the left deepening
     toward DARK blue at the right (matches the progress direction). */
  background: linear-gradient(90deg, #d9eafc 0%, #b3d3f5 40%, #6ba6e8 78%, #4080d8 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .9),
    inset 0 0 0 1px rgba(80, 133, 194, .14),
    0 3px 10px rgba(48, 101, 165, .13);
}
.${FILL_CLASS} {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--dsh-tl-progress, 0%);
  border-radius: inherit;
  background: linear-gradient(90deg, #ffffff 0%, #d7eaff 18%, #75afea 54%, #0751ad 100%);
  transition: width 190ms cubic-bezier(.22, 1, .36, 1);
  display: none;
}
body:not([data-ds-dark-theme]) .${FILL_CLASS} { display: block; }
.${CANVAS_CLASS} {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  mix-blend-mode: screen;
  pointer-events: none;
  transition: filter 140ms ease;
}
/* Screen only LIGHTENS — over the pale light-theme track it would wash the
   radiation out; paint it directly there. */
body:not([data-ds-dark-theme]) .${CANVAS_CLASS} { mix-blend-mode: normal; }
.${FLARE_CLASS} {
  position: absolute;
  width: ${FLARE_W}px;
  height: ${FLARE_H}px;
  border-radius: 50%;
  background: radial-gradient(ellipse at 100% 50%, rgba(255,255,255,.96) 0 4%, rgba(188,189,255,.8) 11%, rgba(106,87,255,.5) 28%, rgba(105,31,255,.2) 49%, transparent 74%);
  filter: blur(1.5px) saturate(1.25);
  mix-blend-mode: screen;
  transform: translate(-100%, -50%);
  transition: left 70ms linear, filter 140ms ease;
  pointer-events: none;
}
.${FLARE_CLASS}::before,
.${FLARE_CLASS}::after {
  content: "";
  position: absolute;
  inset: 50% auto auto 100%;
  border-radius: 999px;
  transform: translate(-50%, -50%);
}
.${FLARE_CLASS}::before {
  width: 52px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(100,160,255,.42), #f1ecff, rgba(193,82,255,.65), transparent);
  box-shadow: 0 0 7px #9b7cff, 0 0 13px rgba(72,132,255,.64);
}
.${FLARE_CLASS}::after {
  width: 1px;
  height: 20px;
  background: linear-gradient(180deg, transparent, rgba(196,190,255,.84), transparent);
  box-shadow: 0 0 7px #9c7cff;
}
.${ZONE_CLASS}[data-drag="1"] .${CANVAS_CLASS} { filter: saturate(1.45) brightness(1.28) contrast(1.06); }
.${ZONE_CLASS}[data-drag="1"] .${FLARE_CLASS} { filter: blur(1.5px) saturate(1.6) brightness(1.42); transition: none; }
.${KNOB_CLASS} {
  border-radius: 50%;
  background: #fff;
  border: 1px solid rgba(255, 255, 255, .94);
  box-shadow:
    0 0 0 2px rgba(92, 105, 255, .12),
    0 0 14px rgba(121, 82, 255, .48),
    0 2px 7px rgba(0, 0, 0, .3);
  transition: left 190ms cubic-bezier(.22, 1, .36, 1), transform 160ms ease, box-shadow 180ms ease;
}
.${ZONE_CLASS}[data-drag="1"] .${KNOB_CLASS} {
  transform: translateX(-50%) scale(1.07);
  transition: none;
  box-shadow:
    0 0 0 3px rgba(113, 115, 255, .25),
    0 0 20px rgba(74, 145, 255, .86),
    0 0 31px rgba(171, 53, 255, .66),
    0 3px 8px rgba(0, 0, 0, .32);
}
.${ZONE_CLASS}[data-top="1"] .${TRACK_CLASS} { animation: dsh-tl-dark-breathe 1.9s ease-in-out infinite; }
@keyframes dsh-tl-dark-breathe {
  0%, 100% { box-shadow: inset 0 1px 0 rgba(196,204,255,.16), 0 3px 10px rgba(18,25,72,.4); }
  50% { box-shadow: inset 0 1px 0 rgba(220,214,255,.24), 0 0 21px rgba(111,66,255,.5); }
}
body:not([data-ds-dark-theme]) .${ZONE_CLASS}[data-top="1"] .${TRACK_CLASS} { animation-name: dsh-tl-light-breathe; }
@keyframes dsh-tl-light-breathe {
  0%, 100% { box-shadow: inset 0 1px 0 rgba(255,255,255,.9), inset 0 0 0 1px rgba(67,124,193,.16), 0 3px 10px rgba(48,101,165,.13); }
  50% { box-shadow: inset 0 1px 0 rgba(255,255,255,.95), inset 0 0 0 1px rgba(67,124,193,.22), 0 3px 10px rgba(31,102,190,.22), 0 0 19px rgba(31,105,201,.24); }
}
.${RUN_CLASS} { animation: ${RUN_KEYFRAMES} 0.72s steps(8, end) infinite alternate; }
@keyframes ${RUN_KEYFRAMES} {
  from { background-position-x: 0; }
  to { background-position-x: -${STRIP_CSS_W}px; }
}
.${GIRL_CLASS} {
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, .28)) drop-shadow(0 0 5px rgba(92, 105, 255, .34));
  transform-origin: 50% 68%;
  transition: left 190ms cubic-bezier(.22, 1, .36, 1);
}
.${ZONE_CLASS}[data-drag="1"] .${GIRL_CLASS} {
  animation-duration: 0.42s;
  transition: none;
  filter: drop-shadow(0 2px 1px rgba(0, 0, 0, .28)) drop-shadow(0 0 8px rgba(87, 137, 255, .68));
}
@media (prefers-reduced-motion: reduce) {
  .${ZONE_CLASS}[data-top="1"] .${TRACK_CLASS} { animation: none; }
  .${RUN_CLASS} { animation: none; }
  .${FLARE_CLASS}, .${FILL_CLASS}, .${KNOB_CLASS} { transition: none; }
}
`;
		let styleInjected = false;
		/** Inject the effect stylesheet once per document. */
		function ensureEffectStyle() {
			if (styleInjected || document.getElementById(KEYFRAMES_ID) !== null) {
				styleInjected = true;
				return;
			}
			const style = document.createElement("style");
			style.id = KEYFRAMES_ID;
			style.textContent = EFFECT_CSS;
			document.head.appendChild(style);
			styleInjected = true;
		}
		const clamp01 = (value) => Math.min(1, Math.max(0, value));
		/**
		* Draw one frame of the track FX: sine-wave columns with a sharp crest and an
		* exponential trail decaying from the thumb, a 4px pixel grid with grain and a
		* radial halo around the thumb, particle streaks streaming LEFT, and a radial
		* glow at the origin — everything clipped LEFT of the thumb, theme-split by
		* the harness `data-ds-dark-theme` body attribute.
		*/
		function drawRadiation(context, width, height, time, state) {
			const origin = state.origin;
			const isDark = document.body.hasAttribute("data-ds-dark-theme");
			const cell = 4;
			const speed = state.dragging ? 2.8 : 1;
			context.clearRect(0, 0, width, height);
			if (origin <= 0) return;
			context.save();
			context.beginPath();
			context.rect(0, 0, origin, height);
			context.clip();
			for (let x = 0; x < origin; x += cell) {
				const delta = x + cell * .5 - origin;
				const distance = Math.abs(delta);
				const phaseA = distance / 10 - time * .0074 * speed;
				const phaseB = distance / 23 - time * .0041 * speed + 1.7;
				const phaseC = distance / 40 - time * .0022 * speed + 3.4;
				const sinA = Math.max(0, Math.sin(phaseA));
				const sinB = Math.max(0, Math.sin(phaseB));
				const sinC = Math.max(0, Math.sin(phaseC));
				const waveA = Math.pow(sinA, 2.6);
				const waveB = Math.pow(sinB, 3.2);
				const waveC = Math.pow(sinC, 4);
				const crest = Math.pow(sinA, 15) + Math.pow(sinB, 18) * .78;
				const wave = Math.min(1, waveA * .76 + waveB * .58 + waveC * .32);
				const trail = .38 + .62 * Math.exp(-distance / Math.max(55, width * .72));
				const pillar = Math.pow(Math.max(0, Math.sin(x / 20 + time * .0016)), 3) * .27;
				const columnEnergy = trail * (wave * 1.04 + pillar + crest * .32);
				if (columnEnergy > .012) {
					const nearness = Math.max(0, 1 - distance / Math.max(1, width * .78));
					context.fillStyle = `rgba(${isDark ? Math.round(42 + 124 * nearness + 75 * wave) : Math.round(28 + 58 * nearness + 15 * wave)}, ${isDark ? Math.round(56 + 58 * nearness + 44 * crest) : Math.round(88 + 72 * nearness + 30 * crest)}, ${isDark ? Math.round(175 + 72 * nearness + 8 * wave) : Math.round(182 + 62 * nearness)}, ${isDark ? Math.min(.88, columnEnergy * .72) : Math.min(.9, columnEnergy * .85)})`;
					context.fillRect(x, 0, 3, height);
				}
				for (let y = 0; y < height; y += cell) {
					const deltaY = y + cell * .5 - height * .5;
					const radial = Math.hypot(delta / 38, deltaY / 11);
					const halo = Math.exp(-radial * .96) * 1.08;
					const verticalShape = .58 + .42 * Math.cos(deltaY / height * Math.PI);
					const grain = .72 + .28 * Math.sin(x * .73 + y * 1.31 + time * .006);
					const alpha = Math.min(.96, (columnEnergy * .88 + halo + crest * .19) * verticalShape * grain);
					if (alpha < .035) continue;
					const hot = Math.max(0, 1 - radial / 2.4);
					context.fillStyle = `rgba(${isDark ? Math.round(54 + 148 * hot + 42 * wave + 35 * crest) : Math.round(20 + 92 * hot + 18 * wave)}, ${isDark ? Math.round(68 + 78 * hot + 46 * crest) : Math.round(78 + 80 * hot + 30 * crest)}, ${isDark ? Math.round(186 + 64 * hot) : Math.round(188 + 62 * hot)}, ${isDark ? alpha : alpha * .95})`;
					context.fillRect(x, y, 3, 3);
				}
			}
			for (let i = 0; i < 14; i += 1) {
				const particleX = origin - (time * (state.dragging ? .16 : .065) * (.78 + i % 5 * .09) + i * 23) % Math.max(30, origin + 64);
				if (particleX < -24 || particleX > width + 16) continue;
				const particleY = 3 + (i * 13 + Math.sin(time * .003 + i) * 5) % Math.max(7, height - 6);
				const length = 4 + i % 4 * 4 + (state.dragging ? 6 : 0);
				const alpha = .28 + i % 5 * .1;
				const streak = context.createLinearGradient(particleX, 0, particleX + length, 0);
				streak.addColorStop(0, isDark ? "rgba(72,118,255,0)" : "rgba(24,94,184,0)");
				streak.addColorStop(.68, isDark ? `rgba(112,135,255,${alpha})` : `rgba(36,108,202,${alpha * .72})`);
				streak.addColorStop(1, isDark ? `rgba(236,222,255,${Math.min(1, alpha + .26)})` : `rgba(103,175,248,${Math.min(.82, alpha + .18)})`);
				context.fillStyle = streak;
				context.fillRect(particleX, particleY, length, i % 3 === 0 ? 2 : 1);
			}
			const glow = context.createRadialGradient(origin, height / 2, 0, origin, height / 2, 24);
			glow.addColorStop(0, isDark ? "rgba(255,255,255,.82)" : "rgba(255,255,255,.86)");
			glow.addColorStop(.14, isDark ? "rgba(183,190,255,.54)" : "rgba(162,210,255,.48)");
			glow.addColorStop(.44, isDark ? "rgba(103,74,255,.28)" : "rgba(37,112,207,.22)");
			glow.addColorStop(1, isDark ? "rgba(86,31,210,0)" : "rgba(25,91,181,0)");
			context.fillStyle = glow;
			context.fillRect(origin - 26, 0, 52, height);
			context.restore();
		}
		const zoneStyle = {
			position: "relative",
			flex: "1 1 auto",
			minWidth: "100px",
			height: `${ZONE_H}px`,
			isolation: "isolate",
			zIndex: 1,
			touchAction: "none",
			userSelect: "none",
			WebkitUserSelect: "none"
		};
		const zoneDisabledStyle = {
			...zoneStyle,
			opacity: .55,
			cursor: "default"
		};
		const zoneActiveStyle = {
			...zoneStyle,
			cursor: "pointer"
		};
		const girlStyle = {
			position: "absolute",
			width: `${GIRL_W}px`,
			height: `${GIRL_H}px`,
			backgroundImage: `url(${WHALE_RUN_STRIP_SRC})`,
			backgroundSize: `${STRIP_CSS_W}px ${STRIP_CSS_H}px`,
			backgroundRepeat: "no-repeat",
			transform: "translateX(-50%)",
			pointerEvents: "none"
		};
		const knobStyle = {
			position: "absolute",
			width: `${KNOB}px`,
			height: `${KNOB}px`,
			transform: "translateX(-50%)",
			pointerEvents: "none",
			boxSizing: "border-box"
		};
		const labelStyle$2 = {
			position: "absolute",
			bottom: "0",
			height: `${LABEL_H}px`,
			lineHeight: `${LABEL_H}px`,
			fontSize: "10px",
			color: "var(--dsw-alias-label-tertiary)",
			whiteSpace: "nowrap",
			transform: "translateX(-50%)",
			pointerEvents: "none"
		};
		const labelActiveStyle = {
			...labelStyle$2,
			color: "var(--dsw-alias-state-business-primary)",
			fontWeight: 600
		};
		/**
		* The effort slider for one model line. Renders `null` for an empty stop list —
		* a thrown render would abdicate the whole model-seat entry.
		*/
		function EffortSlider({ stops, value, mascot, disabled, onCommit, t }) {
			const [dragPos, setDragPos] = (0, react.useState)(null);
			const dragRef = (0, react.useRef)(null);
			const [keyIndex, setKeyIndex] = (0, react.useState)(null);
			const canvasRef = (0, react.useRef)(null);
			const fractionRef = (0, react.useRef)(0);
			const draggingRef = (0, react.useRef)(false);
			const padRef = (0, react.useRef)(mascot ? PAD_MASCOT : PAD_KNOB);
			const redrawRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				redrawRef.current?.();
			});
			/**
			* The canvas FX loop: dpr-aware resize, theme-following redraws, one rAF
			* frame per tick — or static single frames when the user prefers reduced
			* motion. Everything dies with the effect (the editor row unmount). Mounted
			* before the empty-stops early return: hooks must run unconditionally (with
			* no stops the canvas never renders and the effect no-ops).
			*/
			(0, react.useEffect)(() => {
				const canvas = canvasRef.current;
				if (canvas === null) return;
				const context = canvas.getContext("2d");
				if (context === null) return;
				const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
				let width = 1;
				let height = 1;
				let frame = 0;
				const resize = () => {
					const bounds = canvas.getBoundingClientRect();
					const ratio = Math.min(window.devicePixelRatio || 1, 2);
					width = Math.max(1, bounds.width);
					height = Math.max(1, bounds.height);
					canvas.width = Math.max(1, Math.round(width * ratio));
					canvas.height = Math.max(1, Math.round(height * ratio));
					context.setTransform(ratio, 0, 0, ratio, 0, 0);
				};
				const draw = (time = performance.now()) => {
					drawRadiation(context, width, height, time, {
						origin: fractionRef.current * width,
						dragging: draggingRef.current
					});
				};
				const loop = (time) => {
					draw(time);
					frame = window.requestAnimationFrame(loop);
				};
				const redraw = () => {
					if (reducedMotion.matches) draw();
				};
				const resizeObserver = new ResizeObserver(() => {
					resize();
					draw();
				});
				const themeObserver = new MutationObserver(() => draw());
				resizeObserver.observe(canvas);
				themeObserver.observe(document.body, {
					attributes: true,
					attributeFilter: ["data-ds-dark-theme"]
				});
				redrawRef.current = redraw;
				resize();
				draw();
				if (!reducedMotion.matches) frame = window.requestAnimationFrame(loop);
				return () => {
					window.cancelAnimationFrame(frame);
					resizeObserver.disconnect();
					themeObserver.disconnect();
					redrawRef.current = null;
				};
			}, []);
			if (stops.length === 0) return null;
			ensureEffectStyle();
			const pad = mascot ? PAD_MASCOT : PAD_KNOB;
			padRef.current = pad;
			const count = stops.length;
			const indexOf = (fraction) => count <= 1 ? 0 : Math.min(count - 1, Math.max(0, Math.round(fraction * (count - 1))));
			const fractionOf = (index) => count <= 1 ? 0 : index / (count - 1);
			const committedIndex = nearestEffortStopIndex(stops, value);
			const shownFraction = dragPos ?? fractionOf(keyIndex ?? committedIndex);
			const shownIndex = indexOf(shownFraction);
			fractionRef.current = shownFraction;
			draggingRef.current = dragPos !== null;
			/** Pointer → 0..1 fraction within the padded rail of the zone's box. */
			const fractionFromEvent = (event) => {
				const rect = event.currentTarget.getBoundingClientRect();
				if (rect.width <= 2 * pad) return 0;
				return clamp01((event.clientX - rect.left - pad) / (rect.width - 2 * pad));
			};
			const onPointerDown = (event) => {
				if (disabled) return;
				event.preventDefault();
				event.stopPropagation();
				event.currentTarget.setPointerCapture(event.pointerId);
				const fraction = fractionFromEvent(event);
				dragRef.current = fraction;
				setDragPos(fraction);
			};
			const onPointerMove = (event) => {
				if (disabled || dragRef.current === null) return;
				event.stopPropagation();
				const fraction = fractionFromEvent(event);
				dragRef.current = fraction;
				setDragPos(fraction);
			};
			const settle = (event) => {
				if (disabled || dragRef.current === null) return;
				event.stopPropagation();
				const index = indexOf(dragRef.current);
				dragRef.current = null;
				setDragPos(null);
				const id = stops[index]?.id;
				if (id !== void 0 && id !== value) onCommit(id);
			};
			const onKeyDown = (event) => {
				if (disabled) return;
				const current = keyIndex ?? committedIndex;
				let next;
				if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(0, current - 1);
				else if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(count - 1, current + 1);
				else if (event.key === "Home") next = 0;
				else if (event.key === "End") next = count - 1;
				else return;
				event.preventDefault();
				event.stopPropagation();
				setKeyIndex(next);
			};
			const onKeyUp = (event) => {
				if (disabled || keyIndex === null) return;
				const moved = event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "Home" || event.key === "End";
				event.stopPropagation();
				if (!moved) return;
				const id = stops[keyIndex]?.id;
				setKeyIndex(null);
				if (id !== void 0 && id !== value) onCommit(id);
			};
			/**
			* Tick/label/thumb x position inside the padded rail (percent of the zone).
			*/
			const at = (fraction) => `calc(${pad}px + ${fraction} * (100% - ${2 * pad}px))`;
			const dragging = dragPos !== null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				role: "slider",
				className: ZONE_CLASS,
				tabIndex: disabled ? -1 : 0,
				"aria-label": t("input.effort.title"),
				"aria-valuemin": 0,
				"aria-valuemax": count - 1,
				"aria-valuenow": shownIndex,
				"aria-valuetext": stops[shownIndex]?.name ?? stops[committedIndex]?.id ?? "",
				"data-drag": dragging ? "1" : "0",
				"data-top": shownIndex === count - 1 ? "1" : "0",
				style: disabled ? zoneDisabledStyle : zoneActiveStyle,
				onPointerDown,
				onPointerMove,
				onPointerUp: settle,
				onPointerCancel: settle,
				onKeyDown,
				onKeyUp,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TRACK_CLASS,
						style: {
							position: "absolute",
							left: `${pad}px`,
							right: `${pad}px`,
							bottom: `${TRACK_B}px`,
							height: `${TRACK_H}px`,
							"--dsh-tl-progress": `${shownFraction * 100}%`
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: FILL_CLASS }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
								ref: canvasRef,
								className: CANVAS_CLASS
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: FLARE_CLASS,
								style: {
									left: `${shownFraction * 100}%`,
									top: "50%"
								}
							}),
							stops.slice(1, -1).map((stop, offset) => {
								const index = offset + 1;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: {
									position: "absolute",
									bottom: `${TRACK_H / 2 - 3.5}px`,
									left: `${index / Math.max(1, count - 1) * 100}%`,
									width: "7px",
									height: "7px",
									borderRadius: "50%",
									background: "#fff",
									border: "1px solid var(--dsw-alias-border-l2)",
									boxSizing: "border-box",
									transform: "translateX(-50%)",
									pointerEvents: "none",
									zIndex: 2,
									opacity: index <= shownIndex ? 1 : .65
								} }, stop.id);
							})
						]
					}),
					mascot ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: `${RUN_CLASS} ${GIRL_CLASS}`,
						style: {
							...girlStyle,
							left: at(shownFraction),
							bottom: `${GIRL_B}px`
						}
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: KNOB_CLASS,
						style: {
							...knobStyle,
							left: at(shownFraction),
							bottom: `${28 - KNOB / 2}px`
						}
					}),
					count <= 6 && stops.map((stop, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							...index === shownIndex ? labelActiveStyle : labelStyle$2,
							left: at(fractionOf(index))
						},
						children: stop.name
					}, stop.id))
				]
			});
		}
		/** The multi-level context-window presets, in ascending order. */
		const CONTEXT_WINDOW_PRESETS = [
			{
				label: "64K",
				value: 64e3
			},
			{
				label: "128K",
				value: 131072
			},
			{
				label: "256K",
				value: 256e3
			},
			{
				label: "400K",
				value: 4e5
			},
			{
				label: "512K",
				value: 524288
			},
			{
				label: "1M",
				value: 1e6
			}
		];
		/** Format a token count as a readable label (exact presets keep their label). */
		function formatContextWindow(value) {
			const preset = CONTEXT_WINDOW_PRESETS.find((candidate) => candidate.value === value);
			if (preset !== void 0) return preset.label;
			if (value >= 1e6) return "1M";
			if (value >= 1024) return `${Math.round(value / 1024)}K`;
			return String(value);
		}
		/**
		* Validate a context-window candidate (number or numeric string). Accepts only
		* base-10 integers inside [CONTEXT_WINDOW_MIN, CONTEXT_WINDOW_MAX]; anything
		* else (float, 'abc', '1e3', out-of-range) is rejected with a reason.
		*/
		function validateContextWindow(value) {
			const raw = typeof value === "string" ? value.trim() : value;
			const asString = typeof raw === "string" ? raw : String(raw);
			if (!/^\d+$/.test(asString)) return {
				ok: false,
				reason: "integer"
			};
			const numeric = Number(asString);
			if (!Number.isSafeInteger(numeric)) return {
				ok: false,
				reason: "integer"
			};
			if (numeric < 2e3 || numeric > 1e6) return {
				ok: false,
				reason: "range"
			};
			return {
				ok: true,
				value: numeric
			};
		}
		//#endregion
		//#region src/client/model-panel.tsx
		/**
		* Model-seat panel for the composer (`conversation.input.model`).
		*
		* Why this seat: the shipped `ModelSelect` renders no slots inside its popup,
		* so a plugin can never contribute *into* that panel — the working pattern
		* (proven by dsh-reasoning-effort) is to occupy the model seat itself: one
		* registered entry named after the seat with `priority: -1` replaces the
		* shipped trigger and popup outright. This component then renders its own
		* picker over the harness's shared model directory (`modelDirectories`
		* service), so model switching keeps working, and adds what the official
		* popup cannot offer: a context-window editor on every model line.
		*
		* Per-line context window (the "max context window" moved into each line):
		* each model row carries a compact chip showing the model's effective
		* `contextWindow`; clicking it opens an inline editor row (preset slider,
		* custom-integer input, Clear). Writes follow the same two-family discipline
		* the retired composer pill used (both consumed live by
		* `resolveModelInfo(...).context.contextWindow`, effective on the next
		* request without a restart):
		* - Custom gateways (`llm-pi-ai` providers): writes the model entry's
		*   `contextWindow` under `providers[provider].models[i]`; a gateway model
		*   missing from the config has no write target and renders the chip disabled.
		* - Official DeepSeek (`deepseek-official`, the `llm-deepseek` entry): writes
		*   the catalog model's `contextWindow` when listed, otherwise caps via
		*   `defaultContextWindow`.
		*
		* Per-line reasoning effort (the 改造 panel): the retired per-line `<select>`
		* became an effort chip that expands an inline segment slider
		* (`EffortSlider`) under the model line — stop count adapts to the model's
		* advertised efforts, `auto` sits leftmost, the thumb follows the pointer and
		* snaps on release. DeepSeek lines run the whale-girl runner strip as the
		* thumb (`isDeepSeekLine`); every other model gets the plain white knob. The
		* select's "provider default" reset survives as the ↺ button of the slider
		* row (submits the declared `defaultEffort`).
		*
		* Graceful degradation: when the harness provides no `modelDirectories`
		* service (older lines) the registration is skipped entirely and the shipped
		* model selector stays untouched.
		*/
		/** The official DeepSeek provider route owned by the llm-deepseek adapter. */
		const DEEPSEEK_PROVIDER = "deepseek-official";
		/** llm-deepseek's native default context capacity (DEFAULT_CONTEXT_WINDOW). */
		const DEEPSEEK_DEFAULT_WINDOW = 1e6;
		/** Slider stop an unset window parks on: the thumb needs a position, the readout stays "unset". */
		const UNSET_STOP_INDEX = CONTEXT_WINDOW_PRESETS.findIndex((preset) => preset.value === 256e3);
		/**
		* Whether one model line gets the whale-girl runner thumb: the official
		* DeepSeek route plus any gateway model whose id or display name says
		* deepseek (custom "DeepSeek"-named providers). Every other line gets the
		* plain white knob.
		*/
		const isDeepSeekLine = (provider, modelId, name) => provider === DEEPSEEK_PROVIDER || /deepseek/i.test(modelId) || /deepseek/i.test(name ?? "");
		/** Snapshot shown when the session's directory face is unavailable. */
		const UNAVAILABLE_STATE = {
			status: "loading",
			groups: [],
			current: null,
			error: null
		};
		const rootStyle = {
			position: "relative",
			display: "inline-flex"
		};
		const triggerStyle = {
			display: "inline-flex",
			alignItems: "center",
			gap: "6px",
			height: "26px",
			padding: "0 10px",
			background: "var(--dsw-alias-bg-layer-1)",
			color: "var(--dsw-alias-label-primary)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "8px",
			fontSize: "12px",
			lineHeight: "18px",
			cursor: "pointer",
			whiteSpace: "nowrap",
			maxWidth: "220px"
		};
		const triggerNameStyle = {
			minWidth: 0,
			overflow: "hidden",
			textOverflow: "ellipsis"
		};
		const triggerEffortStyle = {
			flex: "0 0 auto",
			maxWidth: "72px",
			overflow: "hidden",
			textOverflow: "ellipsis",
			color: "var(--dsw-alias-label-tertiary)"
		};
		const chevronStyle = {
			flex: "0 0 auto",
			fontSize: "9px",
			color: "var(--dsw-alias-label-tertiary)"
		};
		const popStyle = {
			position: "absolute",
			bottom: "calc(100% + 8px)",
			left: "0",
			zIndex: 1300,
			width: "min(320px, calc(100vw - 24px))",
			padding: "8px",
			background: "var(--dsw-alias-bg-layer-3)",
			color: "var(--dsw-alias-label-primary)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "10px",
			boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
			display: "flex",
			flexDirection: "column",
			gap: "4px"
		};
		const backdropStyle = {
			position: "fixed",
			inset: 0,
			zIndex: 1299
		};
		const modelsStyle = {
			maxHeight: "320px",
			overflowY: "auto",
			display: "flex",
			flexDirection: "column",
			gap: "2px"
		};
		const providerToggleStyle = {
			display: "flex",
			alignItems: "center",
			gap: "6px",
			width: "100%",
			padding: "6px 8px",
			border: "none",
			borderRadius: "6px",
			background: "transparent",
			color: "var(--dsw-alias-label-secondary)",
			font: "inherit",
			fontSize: "12px",
			cursor: "pointer",
			textAlign: "left"
		};
		const providerNameStyle$1 = {
			flex: "1 1 auto",
			fontWeight: 600
		};
		const providerMetaStyle = {
			flex: "0 0 auto",
			color: "var(--dsw-alias-label-tertiary)",
			fontSize: "11px"
		};
		/** The model-line row CONTAINER: highlight surface + flex parent of pick/select/chip.
		* Wraps so the inline window editor (a flex item too) takes its own full line. */
		const modelRowStyle$1 = {
			display: "flex",
			flexWrap: "wrap",
			alignItems: "center",
			gap: "6px",
			width: "100%",
			borderRadius: "6px"
		};
		const modelRowActiveStyle = {
			...modelRowStyle$1,
			background: "var(--dsw-alias-state-business-primary-weak, var(--dsw-alias-interactive-bg-hover, transparent))"
		};
		/** The pick button inside the row: name/description/✓, keeps the row's old padding. */
		const modelPickStyle = {
			flex: "1 1 auto",
			minWidth: 0,
			display: "flex",
			alignItems: "center",
			gap: "6px",
			padding: "6px 4px 6px 18px",
			border: "none",
			background: "transparent",
			color: "var(--dsw-alias-label-primary)",
			font: "inherit",
			fontSize: "12px",
			cursor: "pointer",
			textAlign: "left"
		};
		const modelCopyStyle = {
			flex: "1 1 auto",
			minWidth: 0,
			display: "flex",
			flexDirection: "column",
			gap: "1px"
		};
		const modelNameStyle = {
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap"
		};
		const checkStyle = {
			flex: "0 0 auto",
			color: "var(--dsw-alias-state-business-primary)"
		};
		const chipStyle = {
			flex: "0 0 auto",
			height: "18px",
			padding: "0 6px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "5px",
			background: "var(--dsw-alias-bg-layer-1)",
			color: "var(--dsw-alias-label-secondary)",
			fontSize: "11px",
			lineHeight: "16px",
			fontFamily: "var(--ds-font-family-code, monospace)",
			fontVariantNumeric: "tabular-nums",
			cursor: "pointer",
			whiteSpace: "nowrap",
			marginRight: "8px"
		};
		const chipDisabledStyle = {
			...chipStyle,
			cursor: "default",
			opacity: .55
		};
		/** The per-line effort chip (ex-select): shows the line's effective level name. */
		const effortChipStyle = {
			flex: "0 0 auto",
			height: "18px",
			maxWidth: "96px",
			padding: "0 6px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "5px",
			background: "var(--dsw-alias-bg-layer-1)",
			color: "var(--dsw-alias-label-secondary)",
			fontSize: "11px",
			lineHeight: "16px",
			cursor: "pointer",
			whiteSpace: "nowrap",
			overflow: "hidden",
			textOverflow: "ellipsis",
			userSelect: "none"
		};
		const editorRowStyle = {
			flex: "1 1 100%",
			display: "flex",
			alignItems: "center",
			gap: "6px",
			margin: "2px 8px 6px 18px",
			padding: "6px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "6px",
			background: "var(--dsw-alias-bg-layer-1)",
			fontSize: "12px",
			position: "relative",
			zIndex: 2
		};
		const labelStyle$1 = {
			flex: "0 0 auto",
			color: "var(--dsw-alias-label-tertiary)",
			whiteSpace: "nowrap"
		};
		const sliderStyle = {
			flex: "1 1 auto",
			minWidth: "48px",
			maxWidth: "170px",
			height: "14px",
			margin: "0",
			padding: "0",
			accentColor: "var(--dsw-alias-state-business-primary)",
			cursor: "pointer"
		};
		const valueStyle = {
			flex: "0 0 auto",
			minWidth: "24px",
			textAlign: "right",
			color: "var(--dsw-alias-label-primary)",
			fontFamily: "var(--ds-font-family-code, monospace)",
			fontVariantNumeric: "tabular-nums"
		};
		const actionButtonStyle = {
			flex: "0 0 auto",
			height: "18px",
			padding: "0 6px",
			border: "1px solid transparent",
			borderRadius: "4px",
			background: "transparent",
			color: "var(--dsw-alias-label-secondary)",
			font: "inherit",
			cursor: "pointer"
		};
		const inputStyle = {
			flex: "1 1 auto",
			minWidth: "0",
			boxSizing: "border-box",
			padding: "2px 6px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "5px",
			background: "var(--dsw-alias-bg-layer-1)",
			color: "var(--dsw-alias-label-primary)",
			font: "inherit"
		};
		const errorStyle = {
			flex: "0 0 auto",
			color: "var(--dsw-alias-state-error-primary)",
			fontSize: "11px"
		};
		const statusStyle = {
			padding: "10px 8px",
			fontSize: "12px",
			color: "var(--dsw-alias-label-tertiary)"
		};
		const errorBannerStyle = {
			padding: "6px 8px",
			borderRadius: "6px",
			background: "var(--dsw-alias-interactive-bg-hover-danger)",
			color: "var(--dsw-alias-state-error-primary)",
			fontSize: "11px"
		};
		/** The user-layer `providers` value of the llm-pi-ai namespace, when present. */
		function providersOf$1(snapshot) {
			if (typeof snapshot !== "object" || snapshot === null) return {};
			const user = snapshot.user ?? snapshot.value;
			if (typeof user !== "object" || user === null || Array.isArray(user)) return {};
			const providers = user["providers"];
			return typeof providers === "object" && providers !== null && !Array.isArray(providers) ? providers : {};
		}
		/** The user-layer `models`/`defaultContextWindow` of the llm-deepseek namespace. */
		function deepseekSectionOf(snapshot) {
			if (typeof snapshot !== "object" || snapshot === null) return {};
			const user = snapshot.user;
			if (typeof user !== "object" || user === null || Array.isArray(user)) return {};
			const section = user;
			const models = Array.isArray(section.models) ? section.models.filter((model) => typeof model === "object" && model !== null && !Array.isArray(model)) : void 0;
			const defaultContextWindow = typeof section.defaultContextWindow === "number" ? section.defaultContextWindow : void 0;
			return {
				...models === void 0 ? {} : { models },
				...defaultContextWindow === void 0 ? {} : { defaultContextWindow }
			};
		}
		/** One model entry's declared contextWindow, when present. */
		function contextWindowOf(model) {
			const value = model["contextWindow"];
			return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : void 0;
		}
		/** A provider's model entry in the llm-pi-ai user layer, when present. */
		function piModelEntry(providers, provider, model) {
			const profile = providers[provider];
			return profile !== void 0 && Array.isArray(profile.models) ? profile.models.find((candidate) => typeof candidate === "object" && candidate !== null && candidate["id"] === model) : void 0;
		}
		/** The slider stop nearest to a committed token count. */
		function stopIndexOf(value) {
			if (value === void 0) return Math.max(0, UNSET_STOP_INDEX);
			let best = 0;
			let bestDistance = Number.POSITIVE_INFINITY;
			CONTEXT_WINDOW_PRESETS.forEach((preset, index) => {
				const distance = Math.abs(preset.value - value);
				if (distance < bestDistance) {
					bestDistance = distance;
					best = index;
				}
			});
			return best;
		}
		/**
		* The model-seat panel: replaces the shipped model selector on this seat and
		* renders one picker whose every model line carries a context-window chip
		* (the "max context window" editor moved into each line).
		* @param props - injected directory + config forms, session seat, copy.
		*/
		function ModelPanel({ directory, piAiScope, deepseekScope, useProjection, t }) {
			const state = (0, react.useSyncExternalStore)((listener) => directory?.store.subscribe(listener) ?? (() => {}), () => directory?.store.getSnapshot() ?? UNAVAILABLE_STATE);
			const piSnapshot = (0, react.useSyncExternalStore)((listener) => piAiScope.subscribe(listener), () => piAiScope.getSnapshot());
			const dsSnapshot = (0, react.useSyncExternalStore)((listener) => deepseekScope.subscribe(listener), () => deepseekScope.getSnapshot());
			const [open, setOpen] = (0, react.useState)(false);
			const [expanded, setExpanded] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [editing, setEditing] = (0, react.useState)(null);
			const [draft, setDraft] = (0, react.useState)(null);
			const [custom, setCustom] = (0, react.useState)(false);
			const [raw, setRaw] = (0, react.useState)("");
			const [error, setError] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const rootRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!open) return;
				directory?.load().catch(() => {});
			}, [directory, open]);
			const close = (0, react.useCallback)(() => {
				setOpen(false);
				setEditing(null);
				setError(null);
			}, []);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onOutside = (event) => {
					const target = event.target;
					if (target instanceof Node && rootRef.current?.contains(target)) return;
					close();
				};
				document.addEventListener("mousedown", onOutside);
				return () => document.removeEventListener("mousedown", onOutside);
			}, [close, open]);
			const writable = piSnapshot.status === "ready" && piSnapshot.writable && dsSnapshot.status === "ready" && dsSnapshot.writable;
			const current = (0, react.useMemo)(() => {
				if (state.current === null) return void 0;
				for (const group of state.groups) {
					if (group.id !== state.current.provider) continue;
					const model = group.models.find((candidate) => candidate.id === state.current?.model);
					if (model !== void 0) return {
						model,
						name: model.name
					};
				}
			}, [state]);
			const providers = (0, react.useMemo)(() => providersOf$1(piSnapshot), [piSnapshot]);
			const dsSection = (0, react.useMemo)(() => deepseekSectionOf(dsSnapshot), [dsSnapshot]);
			/** The effective window of one model line, resolved against its family. */
			const windowOf = (provider, model) => {
				if (provider === DEEPSEEK_PROVIDER) {
					const models = dsSection.models ?? [];
					const index = models.findIndex((entry) => entry["id"] === model);
					return index >= 0 ? contextWindowOf(models[index]) : dsSection.defaultContextWindow;
				}
				const entry = piModelEntry(providers, provider, model);
				return entry === void 0 ? void 0 : contextWindowOf(entry);
			};
			/** Whether one model line has a config write target. */
			const writableLine = (provider, model) => {
				if (!writable) return false;
				if (provider === DEEPSEEK_PROVIDER) return true;
				return piModelEntry(providers, provider, model) !== void 0;
			};
			/** Commit (or delete) one model line's context window. */
			const commitWindow = (provider, model, value) => {
				setBusy(true);
				const done = () => {
					setBusy(false);
					setDraft(null);
				};
				if (provider === DEEPSEEK_PROVIDER) {
					const models = (deepseekSectionOf(dsSnapshot).models ?? []).map((entry) => ({ ...entry }));
					const index = models.findIndex((entry) => entry["id"] === model);
					(index >= 0 ? deepseekScope.set("models", models.map((entry, at) => {
						if (at !== index) return entry;
						if (value === void 0) {
							const rest = { ...entry };
							delete rest["contextWindow"];
							return rest;
						}
						return {
							...entry,
							contextWindow: value
						};
					})) : deepseekScope.set("defaultContextWindow", value === void 0 ? DEEPSEEK_DEFAULT_WINDOW : value)).then(done, done);
					return;
				}
				const next = structuredClone(providers);
				const entry = piModelEntry(next, provider, model);
				if (entry === void 0) {
					setBusy(false);
					setDraft(null);
					return;
				}
				if (value === void 0) delete entry["contextWindow"];
				else entry["contextWindow"] = value;
				piAiScope.set("providers", next).then(done, done);
			};
			/** Validate and commit the custom input; empty clears. */
			const applyCustom = () => {
				if (editing === null) return;
				const trimmed = raw.trim();
				if (trimmed === "") {
					setError(null);
					commitWindow(editing.provider, editing.model, void 0);
					return;
				}
				const validation = validateContextWindow(trimmed);
				if (!validation.ok) {
					setError(t(validation.reason === "integer" ? "input.context.integer" : "input.context.range"));
					return;
				}
				setError(null);
				commitWindow(editing.provider, editing.model, validation.value);
			};
			const openEditor = (provider, model) => {
				setEditing({
					provider,
					model,
					kind: "context"
				});
				setDraft(null);
				setCustom(false);
				setRaw("");
				setError(null);
			};
			/** Toggle one line's inline effort slider (the ex-select). */
			const toggleEffortEditor = (provider, model) => {
				setEditing((previous) => previous !== null && previous.provider === provider && previous.model === model && previous.kind === "effort" ? null : {
					provider,
					model,
					kind: "effort"
				});
			};
			const toggleProvider = (provider) => {
				setExpanded((previous) => {
					const next = new Set(previous);
					if (next.has(provider)) next.delete(provider);
					else next.add(provider);
					return next;
				});
			};
			const chooseModel = (provider, model) => {
				if (busy || directory === void 0) return;
				setBusy(true);
				directory.select({
					provider,
					model
				}).then(() => {
					setBusy(false);
					close();
				}).catch(() => {
					setBusy(false);
				});
			};
			/** Commit one model line's reasoning effort; empty string = provider default (omit the field). */
			const chooseEffort = (provider, model, effort) => {
				if (busy || directory === void 0) return;
				setBusy(true);
				directory.select({
					provider,
					model,
					...effort === "" ? {} : { reasoningEffort: effort }
				}).then(() => {
					setBusy(false);
				}).catch(() => {
					setBusy(false);
				});
			};
			const triggerLabel = current?.name ?? state.current?.model ?? t("model.panel.choose");
			const currentReasoning = current?.model.reasoning;
			const effectiveEffort = state.current?.reasoningEffort ?? currentReasoning?.defaultEffort;
			const effortLabel = currentReasoning === void 0 ? void 0 : effectiveEffort === void 0 ? t("input.effort.default") : currentReasoning.efforts.find((level) => level.id === effectiveEffort)?.name ?? effectiveEffort;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: rootRef,
				style: rootStyle,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						style: triggerStyle,
						"aria-expanded": open,
						"aria-haspopup": "dialog",
						"aria-label": t("model.panel.choose"),
						title: state.current === null ? triggerLabel : `${state.current.provider}/${triggerLabel}`,
						onClick: () => {
							if (open) close();
							else {
								setOpen(true);
								setError(null);
							}
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: triggerNameStyle,
								children: triggerLabel
							}),
							effortLabel !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: triggerEffortStyle,
								children: effortLabel
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: chevronStyle,
								children: open ? "▲" : "▼"
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ContextRing, { useProjection }),
					open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: backdropStyle,
						onClick: close
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: popStyle,
						role: "dialog",
						"aria-label": t("model.panel.choose"),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: modelsStyle,
							children: [
								directory === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: statusStyle,
									children: t("model.panel.unavailable")
								}),
								directory !== void 0 && state.status === "loading" && state.groups.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: statusStyle,
									children: t("model.panel.loading")
								}),
								directory !== void 0 && state.groups.map((group) => {
									const isExpanded = expanded.has(group.id);
									const name = group.name ?? group.label ?? group.id;
									const activeModel = state.current?.provider === group.id ? state.current.model : void 0;
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										style: providerToggleStyle,
										"aria-expanded": isExpanded,
										onClick: () => toggleProvider(group.id),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: providerNameStyle$1,
												children: name
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: providerMetaStyle,
												children: group.models.length
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: chevronStyle,
												children: isExpanded ? "▼" : "▶"
											})
										]
									}), isExpanded && group.models.map((model) => {
										const active = activeModel === model.id;
										const lineWritable = writableLine(group.id, model.id);
										const lineWindow = windowOf(group.id, model.id);
										const isContextEditing = editing !== null && editing.provider === group.id && editing.model === model.id && editing.kind === "context";
										const isEffortEditing = editing !== null && editing.provider === group.id && editing.model === model.id && editing.kind === "effort";
										const lineEffort = active ? state.current?.reasoningEffort ?? model.reasoning?.defaultEffort : model.reasoning?.defaultEffort;
										const lineStops = model.reasoning === void 0 ? [] : orderEffortsForSlider(model.reasoning.efforts);
										const lineEffortName = lineEffort === void 0 ? t("input.effort.default") : lineStops.find((stop) => stop.id === lineEffort)?.name ?? lineEffort;
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: active ? modelRowActiveStyle : modelRowStyle$1,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
													type: "button",
													role: "option",
													"aria-selected": active,
													style: modelPickStyle,
													disabled: busy,
													onClick: () => chooseModel(group.id, model.id),
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														style: modelCopyStyle,
														children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															style: modelNameStyle,
															children: model.name
														})
													}), active && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														style: checkStyle,
														"aria-hidden": "true",
														children: "✓"
													})]
												}),
												(model.reasoning?.efforts.length ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													role: "button",
													tabIndex: 0,
													"aria-label": t("input.effort.title"),
													title: t("input.effort.title"),
													"aria-expanded": isEffortEditing,
													style: effortChipStyle,
													onClick: (event) => {
														event.stopPropagation();
														if (!busy) toggleEffortEditor(group.id, model.id);
													},
													onKeyDown: (event) => {
														if (event.key !== "Enter" && event.key !== " ") return;
														event.preventDefault();
														event.stopPropagation();
														if (!busy) toggleEffortEditor(group.id, model.id);
													},
													children: lineEffortName
												}),
												isEffortEditing && model.reasoning !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													style: editorRowStyle,
													onClick: (event) => event.stopPropagation(),
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															style: labelStyle$1,
															children: t("input.effort.title")
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)(EffortSlider, {
															stops: lineStops,
															value: lineEffort,
															mascot: isDeepSeekLine(group.id, model.id, model.name),
															disabled: busy,
															onCommit: (id) => chooseEffort(group.id, model.id, id),
															t
														}),
														model.reasoning.defaultEffort !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															disabled: busy,
															"aria-label": t("input.effort.reset"),
															title: t("input.effort.reset"),
															style: actionButtonStyle,
															onClick: (event) => {
																event.stopPropagation();
																const target = model.reasoning?.defaultEffort;
																if (target !== void 0) chooseEffort(group.id, model.id, target);
															},
															children: "↺"
														})
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													role: "button",
													tabIndex: 0,
													"aria-label": t("input.context.title"),
													title: lineWritable ? t("input.context.globalHint") : t("model.panel.noTarget"),
													style: lineWritable && !busy ? chipStyle : chipDisabledStyle,
													onClick: (event) => {
														event.stopPropagation();
														if (!lineWritable || busy) return;
														if (isContextEditing) {
															setEditing(null);
															return;
														}
														openEditor(group.id, model.id);
													},
													onKeyDown: (event) => {
														if (event.key !== "Enter" && event.key !== " ") return;
														event.preventDefault();
														event.stopPropagation();
														if (!lineWritable || busy) return;
														openEditor(group.id, model.id);
													},
													children: lineWindow === void 0 ? t("input.context.unset") : formatContextWindow(lineWindow)
												}),
												isContextEditing && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													style: editorRowStyle,
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															style: labelStyle$1,
															title: t("input.context.globalHint"),
															children: t("model.panel.window")
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															type: "range",
															min: 0,
															max: CONTEXT_WINDOW_PRESETS.length - 1,
															step: 1,
															value: draft ?? stopIndexOf(lineWindow),
															disabled: busy,
															"aria-label": t("input.context.title"),
															style: sliderStyle,
															onChange: (event) => {
																setDraft(Number(event.currentTarget.value));
															},
															onPointerUp: () => {
																if (draft === null) return;
																commitWindow(group.id, model.id, CONTEXT_WINDOW_PRESETS[draft]?.value);
															},
															onKeyUp: () => {
																if (draft === null) return;
																commitWindow(group.id, model.id, CONTEXT_WINDOW_PRESETS[draft]?.value);
															}
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															style: valueStyle,
															children: draft === null ? lineWindow === void 0 ? t("input.context.unset") : formatContextWindow(lineWindow) : formatContextWindow(CONTEXT_WINDOW_PRESETS[draft]?.value ?? 0)
														}),
														custom ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															type: "text",
															inputMode: "numeric",
															value: raw,
															disabled: busy,
															placeholder: t("input.context.customPlaceholder"),
															"aria-label": t("input.context.customPlaceholder"),
															style: inputStyle,
															onChange: (event) => {
																setRaw(event.currentTarget.value);
															},
															onKeyDown: (event) => {
																if (event.key === "Enter") applyCustom();
															}
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															disabled: busy,
															style: actionButtonStyle,
															onClick: applyCustom,
															children: t("input.context.apply")
														})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															disabled: busy,
															"aria-label": t("input.context.custom"),
															title: t("input.context.custom"),
															style: actionButtonStyle,
															onClick: () => {
																setCustom(true);
																setError(null);
															},
															children: "⋯"
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															disabled: busy || lineWindow === void 0,
															style: {
																...actionButtonStyle,
																opacity: lineWindow === void 0 ? .55 : 1
															},
															onClick: () => {
																setDraft(null);
																setError(null);
																commitWindow(group.id, model.id, void 0);
															},
															children: t("input.context.clear")
														})] }),
														error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															style: errorStyle,
															children: error
														})
													]
												})
											]
										}, group.id + ":" + model.id);
									})] }, group.id);
								}),
								directory !== void 0 && state.status !== "loading" && state.groups.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: statusStyle,
									children: t("model.panel.empty")
								})
							]
						}), directory !== void 0 && state.error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: errorBannerStyle,
							role: "status",
							children: state.error
						})]
					})] }) : null
				]
			});
		}
		//#endregion
		//#region src/client/card.tsx
		/**
		* Thinking-levels settings card — the family settings tab face of the
		* dsh-thinking-levels plugin.
		*
		* The card binds this plugin's entry config through the `configForms` cordis
		* service and renders its fields: the level picker
		* (off / on / minimal / low / medium / high / xhigh / max / auto) plus the
		* scheduler toggles. Every change commits immediately through the scope (no
		* staged form): the decision is read per model request, so a committed change
		* applies to the next request without a restart.
		*
		* Below the scheduler rows, a "model capabilities" block edits the
		* `llm-pi-ai` namespace directly (read + write through the same settings
		* transport), borrowing dsh-thinking-effort's presentation: providers group
		* their models, each model row shows capability badges and expands into a
		* per-level editor where a level is ticked and its gateway wire value entered
		* (e.g. `high` → `ultra`); `off` left empty means "do not send". A search box
		* filters models and one-click presets apply official/generic level sets to
		* every thinking model.
		*
		* Kept dependency-free beyond react: the scopes are subscribed with
		* `useSyncExternalStore`, and the controls are plain HTML so the client bundle
		* needs no CSS modules and no primitives value import.
		*/
		/** The user-facing levels, in picker order: eight standard levels plus the auto scheduler sentinel. */
		const EFFORT_OPTIONS = [
			"off",
			"on",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max",
			"auto"
		];
		/**
		* The levels the capability editor offers. This is the llm-pi-ai
		* `reasoningEfforts` table-key space — pi-ai's fixed seven levels (schema
		* rejects any other key). `on` (the enable-thinking toggle) is a selector /
		* injection-level concept, expressed here by the `off` + `high` pair
		* (enable_thinking false/true), so it has no table key of its own.
		*/
		const CAPABILITY_LEVELS = [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		];
		/** One-click presets, mirroring dsh-thinking-effort: official DeepSeek style and a generic set. */
		const PRESETS = [{
			key: "official",
			levels: {
				off: null,
				high: "high",
				max: "max"
			}
		}, {
			key: "generic",
			levels: {
				off: null,
				low: "low",
				medium: "medium",
				high: "high"
			}
		}];
		/** The wire thinking formats offered (llm-pi-ai's nameable set, incl. qwen-chat-template). */
		const THINKING_FORMATS = [
			"openai",
			"deepseek",
			"openrouter",
			"together",
			"zai",
			"qwen",
			"qwen-chat-template",
			"string-thinking",
			"ant-ling"
		];
		const rowStyle = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: "12px",
			padding: "6px 0",
			fontSize: "13px",
			lineHeight: "20px"
		};
		const labelStyle = {
			margin: 0,
			color: "var(--dsw-alias-label-primary)"
		};
		const controlStyle = {
			background: "var(--dsw-alias-bg-surface, #fff)",
			color: "var(--dsw-alias-label-primary)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "4px",
			padding: "3px 8px",
			fontSize: "13px"
		};
		const sectionStyle = {
			marginTop: "14px",
			paddingTop: "12px",
			borderTop: "1px solid var(--dsw-alias-border-l2)"
		};
		const fieldStyle = {
			display: "flex",
			flexDirection: "column",
			gap: "4px"
		};
		const fieldLabelStyle = {
			margin: 0,
			fontSize: "12px",
			lineHeight: "18px",
			color: "var(--dsw-alias-label-tertiary)"
		};
		const hintStyle = {
			margin: "6px 0 0",
			fontSize: "12px",
			lineHeight: "18px",
			color: "var(--dsw-alias-label-tertiary)"
		};
		/** Provider group shell: an outlined row grouping its models. */
		const providerStyle = {
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "8px",
			margin: "8px 0 0",
			overflow: "hidden"
		};
		const providerHeadStyle = {
			display: "flex",
			alignItems: "center",
			gap: "8px",
			padding: "7px 10px",
			background: "var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.06))"
		};
		const providerNameStyle = {
			margin: 0,
			flex: "1 1 auto",
			minWidth: 0,
			fontFamily: "var(--ds-font-family-code, monospace)",
			fontSize: "12px",
			lineHeight: "18px",
			fontWeight: 600,
			color: "var(--dsw-alias-label-primary)",
			overflowWrap: "anywhere"
		};
		const providerBadgeStyle = {
			margin: 0,
			fontSize: "10px",
			lineHeight: "16px",
			color: "var(--dsw-alias-label-tertiary)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "4px",
			padding: "0 5px",
			whiteSpace: "nowrap"
		};
		const iconButtonStyle = {
			background: "none",
			border: "none",
			color: "var(--dsw-alias-label-tertiary)",
			cursor: "pointer",
			padding: "2px 4px",
			display: "inline-flex",
			alignItems: "center"
		};
		/** One model row inside a provider group. */
		const modelRowStyle = {
			display: "flex",
			alignItems: "center",
			gap: "8px",
			padding: "7px 10px",
			borderTop: "1px solid var(--dsw-alias-border-l2)"
		};
		const modelIdStyle = {
			margin: 0,
			flex: "1 1 auto",
			minWidth: 0,
			fontFamily: "var(--ds-font-family-code, monospace)",
			fontSize: "12px",
			lineHeight: "18px",
			color: "var(--dsw-alias-label-secondary)",
			overflowWrap: "anywhere"
		};
		/** Capability badge chips (text / image / context). */
		const badgeStyle = {
			fontSize: "10px",
			lineHeight: "16px",
			color: "var(--dsw-alias-label-tertiary)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "4px",
			padding: "0 5px",
			whiteSpace: "nowrap"
		};
		/** The per-level editor grid: one row per level with a toggle, a label and a wire input. */
		const levelRowStyle = {
			display: "grid",
			gridTemplateColumns: "auto 92px minmax(0, 1fr)",
			alignItems: "center",
			gap: "8px",
			padding: "4px 0",
			fontSize: "13px"
		};
		const levelNameStyle = {
			margin: 0,
			fontSize: "12px",
			lineHeight: "18px",
			color: "var(--dsw-alias-label-secondary)"
		};
		const wireInputStyle = {
			background: "var(--dsw-alias-bg-surface, #fff)",
			color: "var(--dsw-alias-label-primary)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "4px",
			padding: "3px 8px",
			fontSize: "12px",
			width: "100%",
			boxSizing: "border-box"
		};
		/** A row's `reasoningEfforts` as stored in the user layer. */
		function effortsOf(model) {
			const value = model["reasoningEfforts"];
			if (value === false) return false;
			if (typeof value === "object" && value !== null && !Array.isArray(value)) return value;
		}
		/**
		* Build a `reasoningEfforts` table from a level→wire draft. `off` maps to
		* `null` (omit the reasoning option → enable_thinking false) unless the user
		* typed a wire value; every other ticked level keeps its typed wire value.
		* pi-ai rejects a table offering nothing beyond `off`, so a selection of only
		* `off` falls back to the default `high` level.
		*/
		function effortTableOf(draft) {
			const table = {};
			for (const level of CAPABILITY_LEVELS) {
				const wire = draft[level];
				if (wire === void 0 || wire === null) continue;
				const trimmed = typeof wire === "string" ? wire.trim() : "";
				if (level === "off") table[level] = trimmed === "" ? null : trimmed;
				else if (trimmed !== "") table[level] = trimmed;
			}
			if (Object.keys(table).length === 0 || Object.keys(table).every((level) => table[level] === null)) return {
				...table,
				high: "high"
			};
			return table;
		}
		/** Whether a row declares `compat.supportsReasoningEffort` (the wire sends reasoning_effort). */
		function supportsEffortOf(model) {
			const compat = model["compat"];
			if (typeof compat !== "object" || compat === null || Array.isArray(compat)) return false;
			return compat["supportsReasoningEffort"] === true;
		}
		/** Patch one row's `compat` object, merging rather than replacing sibling fields. */
		function patchCompat(row, patch) {
			const compat = typeof row["compat"] === "object" && row["compat"] !== null && !Array.isArray(row["compat"]) ? { ...row["compat"] } : {};
			patch(compat);
			if (Object.keys(compat).length === 0) delete row["compat"];
			else row["compat"] = compat;
		}
		/** The user-layer `providers` value of the llm-pi-ai namespace, when present. */
		function providersOf(snapshot) {
			if (typeof snapshot !== "object" || snapshot === null) return {};
			const user = snapshot.user ?? snapshot.value;
			if (typeof user !== "object" || user === null || Array.isArray(user)) return {};
			const providers = user["providers"];
			return typeof providers === "object" && providers !== null && !Array.isArray(providers) ? providers : {};
		}
		/** Whether a route-level profile declares `compat.supportsDeveloperRole: false`. */
		function developerRoleDisabledOf(profile) {
			if (typeof profile !== "object" || profile === null) return false;
			const compat = profile["compat"];
			if (typeof compat !== "object" || compat === null || Array.isArray(compat)) return false;
			return compat["supportsDeveloperRole"] === false;
		}
		/**
		* Whether the transport currently takes this route over: its master switch on
		* AND the route in its manual providers list. Pure membership — the checkbox
		* is the single per-route truth, so dispatch uses the same set.
		*/
		function takeoverActiveOf(section, providerId) {
			if (section.enabled !== true) return false;
			return Array.isArray(section.providers) && section.providers.includes(providerId);
		}
		/** The effective `compat` of an entry: its own `compat` merged over the provider-level `compat`. */
		function compatOf(entry) {
			const base = typeof entry.providerCompat === "object" && entry.providerCompat !== null ? entry.providerCompat : {};
			const own = entry.model["compat"];
			return typeof own === "object" && own !== null && !Array.isArray(own) ? {
				...base,
				...own
			} : base;
		}
		/** Flatten the user-layer providers into capability entries (models arrays only). */
		function entriesOf(providers) {
			return Object.entries(providers).flatMap(([providerId, profile]) => {
				const raw = profile;
				const models = raw["models"];
				if (!Array.isArray(models)) return [];
				const providerCompat = raw["compat"];
				const providerInput = Array.isArray(raw["defaultInput"]) ? raw["defaultInput"] : void 0;
				return models.map((model, index) => ({
					providerId,
					index,
					model: typeof model === "object" && model !== null && !Array.isArray(model) ? model : {},
					modelId: typeof model === "object" && model !== null && typeof model["id"] === "string" ? model["id"] : `#${index + 1}`,
					providerCompat,
					providerInput
				}));
			});
		}
		/** Human-readable capability summary of one entry (input modalities + declared context window). */
		function summaryOf(entry) {
			const input = Array.isArray(entry.model["input"]) ? entry.model["input"] : entry.providerInput;
			const text = !Array.isArray(input) || input.length === 0 || input.includes("text");
			const image = Array.isArray(input) && input.includes("image");
			const contextWindow = entry.model["contextWindow"];
			return {
				text,
				image,
				context: typeof contextWindow === "number" && Number.isFinite(contextWindow) && contextWindow > 0 ? formatContextWindow(contextWindow) : null
			};
		}
		/** A tiny inline chevron icon (no CSS modules). */
		function ChevronIcon({ open }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: "12",
				height: "12",
				viewBox: "0 0 16 16",
				"aria-hidden": true,
				style: {
					transform: open ? "rotate(180deg)" : "none",
					transition: "transform 0.16s"
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M4 6l4 4 4-4",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				})
			});
		}
		/**
		* The llm-pi-ai model-capability editor block (dsh-thinking-effort style:
		* provider groups, model rows with badges, per-level wire editors, search and
		* one-click presets).
		* @param scope - the `llm-pi-ai` namespace scope.
		* @param t - copy lookup.
		* @param readonly - whether writes are forbidden.
		* @returns the capabilities block, or a placeholder when nothing is configured.
		*/
		function ModelCapabilities(props) {
			const { scope, ocScope, t, readonly } = props;
			const snapshot = (0, react.useSyncExternalStore)((listener) => scope.subscribe(listener), () => scope.getSnapshot());
			const ocSnapshot = (0, react.useSyncExternalStore)((listener) => ocScope?.subscribe(listener) ?? (() => {}), () => ocScope !== void 0 ? ocScope.getSnapshot() : {
				status: "unavailable",
				value: void 0,
				revision: void 0,
				writable: false,
				base: void 0,
				user: void 0,
				mode: "memory"
			});
			const ocSection = ocSnapshot.status === "ready" && typeof ocSnapshot.value === "object" && ocSnapshot.value !== null ? ocSnapshot.value : {};
			const ocWritable = ocSnapshot.status === "ready" && ocSnapshot.writable && !readonly;
			const unavailable = snapshot.status === "unavailable";
			const providers = snapshot.status === "ready" ? providersOf(snapshot) : {};
			const allEntries = entriesOf(providers);
			const [query, setQuery] = (0, react.useState)("");
			const [expandedProviders, setExpandedProviders] = (0, react.useState)({});
			const [expandedModels, setExpandedModels] = (0, react.useState)({});
			const [drafts, setDrafts] = (0, react.useState)({});
			const [busy, setBusy] = (0, react.useState)(false);
			const [contextRaw, setContextRaw] = (0, react.useState)({});
			const [contextError, setContextError] = (0, react.useState)({});
			const entryKey = (entry) => `${entry.providerId}\u0000${entry.index}`;
			/** Commit one patch over the user-layer providers. */
			const commitProviders = (mutate) => {
				if (snapshot.status !== "ready" || readonly) return;
				setBusy(true);
				scope.set("providers", mutate(structuredClone(providers))).then(() => {
					setBusy(false);
				}).catch(() => {
					setBusy(false);
				});
			};
			/** Toggle the route-level official compat flag: unchecked = inherit (unset). */
			const toggleDeveloperRole = (providerId, next) => {
				commitProviders((current) => {
					const profile = current[providerId];
					if (profile === void 0) return current;
					const compat = typeof profile["compat"] === "object" && profile["compat"] !== null && !Array.isArray(profile["compat"]) ? { ...profile["compat"] } : {};
					if (next) compat["supportsDeveloperRole"] = false;
					else delete compat["supportsDeveloperRole"];
					if (Object.keys(compat).length === 0) delete profile["compat"];
					else profile["compat"] = compat;
					return current;
				});
			};
			/** Toggle the per-route third-party takeover: writes the transport's own section only. */
			const toggleTakeover = (providerId, next) => {
				if (ocScope === void 0 || !ocWritable) return;
				const currentProviders = Array.isArray(ocSection.providers) ? ocSection.providers.filter((id) => typeof id === "string") : [];
				const providers = next ? [.../* @__PURE__ */ new Set([...currentProviders, providerId])] : currentProviders.filter((id) => id !== providerId);
				const enabled = next ? true : ocSection.enabled === true;
				ocScope.set("providers", providers).catch(() => {});
				if (ocSection.enabled !== enabled) ocScope.set("enabled", enabled).catch(() => {});
			};
			/** Patch one model row of one provider. */
			const patchModel = (providerId, index, patch) => {
				commitProviders((current) => {
					const profile = current[providerId];
					if (profile === void 0 || !Array.isArray(profile.models)) return current;
					const model = profile.models[index];
					if (typeof model !== "object" || model === null) return current;
					patch(model);
					return current;
				});
			};
			/** Toggle whether a model is a thinking model (reasoningEfforts table vs false). */
			const toggleThinking = (entry, next) => {
				patchModel(entry.providerId, entry.index, (row) => {
					if (next) {
						const effortCapable = supportsEffortOf(row);
						row["reasoningEfforts"] = effortCapable ? effortTableOf({ high: "high" }) : {
							off: null,
							high: "high"
						};
						if (!effortCapable) patchCompat(row, (compat) => {
							if (compat["thinkingFormat"] === void 0) compat["thinkingFormat"] = "qwen-chat-template";
						});
					} else row["reasoningEfforts"] = false;
				});
			};
			/** Toggle whether a model accepts reasoning_effort levels. */
			const toggleEffortCapable = (entry, next) => {
				patchModel(entry.providerId, entry.index, (row) => {
					patchCompat(row, (compat) => {
						compat["supportsReasoningEffort"] = next;
						if (next && compat["thinkingFormat"] === "qwen-chat-template") delete compat["thinkingFormat"];
					});
				});
			};
			/** Apply one model's wire draft as its `reasoningEfforts` table. */
			const applyDraft = (entry) => {
				const key = entryKey(entry);
				const draft = drafts[key];
				if (draft === void 0) return;
				const table = effortTableOf(draft);
				patchModel(entry.providerId, entry.index, (row) => {
					row["reasoningEfforts"] = table;
					const extended = Object.keys(table).some((level) => level !== "off" && level !== "on" && level !== "high");
					if (supportsEffortOf(row) || extended) patchCompat(row, (compat) => {
						compat["supportsReasoningEffort"] = true;
					});
				});
			};
			/** Reset a model's draft to its persisted table (or the default high set). */
			const resetDraft = (entry) => {
				const key = entryKey(entry);
				setDrafts((current) => {
					const next = { ...current };
					const table = effortsOf(entry.model);
					if (typeof table === "object" && table !== null) next[key] = Object.fromEntries(CAPABILITY_LEVELS.map((level) => [level, table[level] === void 0 ? null : table[level] === null ? "" : String(table[level])]));
					else next[key] = {
						off: "",
						high: "high"
					};
					return next;
				});
			};
			/** Seed a model's draft when it is first expanded. */
			const ensureDraft = (entry) => {
				const key = entryKey(entry);
				setDrafts((current) => {
					if (current[key] !== void 0) return current;
					const next = { ...current };
					const table = effortsOf(entry.model);
					if (typeof table === "object" && table !== null) next[key] = Object.fromEntries(CAPABILITY_LEVELS.map((level) => [level, table[level] === void 0 ? null : table[level] === null ? "" : String(table[level])]));
					else next[key] = {
						off: "",
						high: "high"
					};
					return next;
				});
			};
			/** Apply a one-click preset to every thinking model. */
			const applyPreset = (levels) => {
				commitProviders((current) => {
					for (const entry of entriesOf(current)) {
						const profile = current[entry.providerId];
						if (profile === void 0 || !Array.isArray(profile.models)) continue;
						const model = profile.models[entry.index];
						if (typeof model !== "object" || model === null) continue;
						const row = model;
						if (effortsOf(row) === void 0) continue;
						row["reasoningEfforts"] = levels;
					}
					return current;
				});
			};
			/** Seed a model's context-window input when it is first expanded. */
			const seedContext = (entry) => {
				const key = entryKey(entry);
				setContextRaw((current) => {
					if (current[key] !== void 0) return current;
					const value = entry.model["contextWindow"];
					return {
						...current,
						[key]: typeof value === "number" && Number.isFinite(value) ? String(value) : ""
					};
				});
			};
			/** Write (or delete) a model's `contextWindow` in the llm-pi-ai entry. */
			const commitContextWindow = (entry, value) => {
				const key = entryKey(entry);
				patchModel(entry.providerId, entry.index, (row) => {
					if (value === void 0) delete row["contextWindow"];
					else row["contextWindow"] = value;
				});
				setContextError((current) => {
					const next = { ...current };
					delete next[key];
					return next;
				});
			};
			/** Apply one preset immediately. */
			const applyContextPreset = (entry, value) => {
				const key = entryKey(entry);
				setContextRaw((current) => ({
					...current,
					[key]: String(value)
				}));
				commitContextWindow(entry, value);
			};
			/** Validate and commit the custom input (blur / Enter); empty clears it. */
			const applyContextInput = (entry) => {
				const key = entryKey(entry);
				const raw = (contextRaw[key] ?? "").trim();
				if (raw === "") {
					commitContextWindow(entry, void 0);
					return;
				}
				const validation = validateContextWindow(raw);
				if (!validation.ok) {
					setContextError((current) => ({
						...current,
						[key]: t(validation.reason === "integer" ? "card.capabilities.contextInteger" : "card.capabilities.contextRange")
					}));
					return;
				}
				commitContextWindow(entry, validation.value);
			};
			/** Clear the model's context-window declaration (delete the field). */
			const clearContext = (entry) => {
				const key = entryKey(entry);
				setContextRaw((current) => ({
					...current,
					[key]: ""
				}));
				commitContextWindow(entry, void 0);
			};
			if (unavailable) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: sectionStyle,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					style: hintStyle,
					children: t("card.capabilities.unavailable")
				})
			});
			if (allEntries.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: sectionStyle,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					style: fieldLabelStyle,
					children: t("card.capabilities")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					style: hintStyle,
					children: t("card.capabilities.empty")
				})]
			});
			const needle = query.trim().toLowerCase();
			const visible = needle === "" ? allEntries : allEntries.filter((entry) => entry.modelId.toLowerCase().includes(needle) || entry.providerId.toLowerCase().includes(needle));
			const providerIds = [...new Set(visible.map((entry) => entry.providerId))];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: sectionStyle,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: fieldLabelStyle,
						children: t("card.capabilities")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: hintStyle,
						children: t("card.capabilities.hint")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: "8px",
							flexWrap: "wrap",
							alignItems: "center",
							margin: "8px 0 2px"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "text",
							value: query,
							placeholder: t("card.capabilities.search"),
							disabled: readonly || busy,
							style: {
								...controlStyle,
								flex: "1 1 160px",
								minWidth: "140px"
							},
							onChange: (event) => setQuery(event.currentTarget.value)
						}), PRESETS.map((preset) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: readonly || busy,
							onClick: () => applyPreset(preset.levels),
							style: {
								...controlStyle,
								cursor: readonly || busy ? "default" : "pointer",
								opacity: readonly || busy ? .5 : 1
							},
							children: t(`card.capabilities.preset${preset.key === "official" ? "Official" : "Generic"}`)
						}, preset.key))]
					}),
					visible.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: hintStyle,
						children: t("card.capabilities.noMatches")
					}) : providerIds.map((providerId) => {
						const providerEntries = visible.filter((entry) => entry.providerId === providerId);
						const providerOpen = expandedProviders[providerId] === true || needle !== "";
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: providerStyle,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: providerHeadStyle,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-expanded": providerOpen,
										disabled: readonly || busy,
										onClick: () => setExpandedProviders((current) => ({
											...current,
											[providerId]: current[providerId] !== true
										})),
										style: {
											...iconButtonStyle,
											cursor: readonly || busy ? "default" : "pointer"
										},
										title: providerOpen ? t("card.capabilities.collapseProvider") : t("card.capabilities.expandProvider"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChevronIcon, { open: providerOpen })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										style: providerNameStyle,
										children: providerId
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										style: {
											display: "inline-flex",
											alignItems: "center",
											gap: "5px",
											fontSize: "11px",
											whiteSpace: "nowrap",
											color: "var(--dsw-alias-label-secondary)"
										},
										title: t("card.capabilities.developerRoleHint"),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: developerRoleDisabledOf(providers[providerId]),
											disabled: readonly || busy,
											onChange: (event) => toggleDeveloperRole(providerId, event.currentTarget.checked)
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("card.capabilities.developerRole") })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										style: {
											display: "inline-flex",
											alignItems: "center",
											gap: "5px",
											fontSize: "11px",
											whiteSpace: "nowrap",
											color: ocWritable ? "var(--dsw-alias-label-secondary)" : "var(--dsw-alias-label-disabled, var(--dsw-alias-label-caption))"
										},
										title: ocScope === void 0 ? t("card.capabilities.takeoverHintAbsent") : t("card.capabilities.takeoverHint"),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: takeoverActiveOf(ocSection, providerId),
											disabled: readonly || busy || !ocWritable,
											onChange: (event) => toggleTakeover(providerId, event.currentTarget.checked)
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("card.capabilities.takeover") })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										style: providerBadgeStyle,
										children: providerEntries.length
									})
								]
							}), providerOpen ? providerEntries.map((entry) => {
								const key = entryKey(entry);
								const modelOpen = expandedModels[key] === true;
								const thinking = typeof effortsOf(entry.model) === "object";
								const compat = compatOf(entry);
								const supportsEffort = compat["supportsReasoningEffort"] === true;
								const meta = summaryOf(entry);
								const format = typeof compat["thinkingFormat"] === "string" ? compat["thinkingFormat"] : void 0;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: modelRowStyle,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-expanded": modelOpen,
											disabled: readonly || busy,
											onClick: () => {
												const next = expandedModels[key] !== true;
												setExpandedModels((current) => ({
													...current,
													[key]: next
												}));
												if (next) {
													ensureDraft(entry);
													seedContext(entry);
												}
											},
											style: {
												...iconButtonStyle,
												cursor: readonly || busy ? "default" : "pointer"
											},
											title: modelOpen ? t("card.capabilities.closeModelSettings") : t("card.capabilities.openModelSettings"),
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChevronIcon, { open: modelOpen })
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											style: modelIdStyle,
											children: entry.modelId
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: badgeStyle,
											title: "text",
											children: meta.text ? "T" : "–"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: badgeStyle,
											title: "image",
											children: meta.image ? "IMG" : "–"
										}),
										meta.context !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: badgeStyle,
											children: meta.context
										}),
										thinking && !supportsEffort && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: badgeStyle,
											children: "On/Off"
										})
									]
								}), modelOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										padding: "4px 10px 10px",
										borderTop: "1px solid var(--dsw-alias-border-l2)"
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: {
												display: "flex",
												gap: "16px",
												flexWrap: "wrap",
												margin: "2px 0 8px"
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												style: {
													display: "inline-flex",
													alignItems: "center",
													gap: "6px",
													fontSize: "12px"
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: thinking,
													disabled: readonly || busy,
													onChange: (event) => toggleThinking(entry, event.currentTarget.checked)
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("card.capabilities.thinking") })]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												style: {
													display: "inline-flex",
													alignItems: "center",
													gap: "6px",
													fontSize: "12px"
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: meta.image,
													disabled: readonly || busy,
													onChange: (event) => {
														patchModel(entry.providerId, entry.index, (row) => {
															row["input"] = event.currentTarget.checked ? ["text", "image"] : ["text"];
														});
													}
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("card.capabilities.vision") })]
											})]
										}),
										thinking ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											style: {
												display: "inline-flex",
												alignItems: "center",
												gap: "6px",
												fontSize: "12px",
												margin: "0 0 8px"
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: supportsEffort,
												disabled: readonly || busy,
												onChange: (event) => toggleEffortCapable(entry, event.currentTarget.checked)
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("card.capabilities.supportsEffort") })]
										}) : null,
										thinking && supportsEffort ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
												style: fieldLabelStyle,
												children: t("card.capabilities.efforts")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												style: { margin: "4px 0 6px" },
												children: CAPABILITY_LEVELS.map((level) => {
													const wire = drafts[key]?.[level];
													const on = wire !== void 0 && wire !== null;
													return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														style: levelRowStyle,
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
																style: {
																	display: "inline-flex",
																	alignItems: "center",
																	gap: "6px",
																	fontSize: "12px"
																},
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																	type: "checkbox",
																	checked: on,
																	disabled: readonly || busy,
																	onChange: (event) => {
																		const checked = event.currentTarget.checked;
																		setDrafts((current) => {
																			const draft = { ...current[key] ?? {} };
																			draft[level] = checked ? level === "off" ? "" : level : null;
																			return {
																				...current,
																				[key]: draft
																			};
																		});
																	}
																}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: level })]
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																style: levelNameStyle,
																children: level === "off" ? t("card.capabilities.offPlaceholder") : "→"
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																type: "text",
																value: wire ?? "",
																disabled: readonly || busy || !on,
																placeholder: t("card.capabilities.wirePlaceholder"),
																style: wireInputStyle,
																onChange: (event) => {
																	setDrafts((current) => {
																		const draft = { ...current[key] ?? {} };
																		draft[level] = event.currentTarget.value;
																		return {
																			...current,
																			[key]: draft
																		};
																	});
																}
															})
														]
													}, level);
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													display: "flex",
													gap: "8px",
													flexWrap: "wrap"
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													disabled: readonly || busy,
													onClick: () => applyDraft(entry),
													style: {
														...controlStyle,
														cursor: readonly || busy ? "default" : "pointer",
														opacity: readonly || busy ? .5 : 1
													},
													children: t("card.capabilities.applyLevel")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													disabled: readonly || busy,
													onClick: () => resetDraft(entry),
													style: {
														...controlStyle,
														cursor: readonly || busy ? "default" : "pointer",
														opacity: readonly || busy ? .5 : 1
													},
													children: t("card.capabilities.restoreDefault")
												})]
											})
										] }) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											style: {
												display: "flex",
												gap: "16px",
												flexWrap: "wrap",
												marginTop: "10px"
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												style: fieldStyle,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													style: fieldLabelStyle,
													children: t("card.capabilities.thinkingFormat")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
													style: controlStyle,
													value: format ?? "inherit",
													disabled: readonly || busy,
													onChange: (event) => {
														const next = event.currentTarget.value;
														patchModel(entry.providerId, entry.index, (row) => {
															patchCompat(row, (compat) => {
																if (next === "inherit") delete compat["thinkingFormat"];
																else compat["thinkingFormat"] = next;
															});
														});
													},
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "inherit",
														children: t("card.capabilities.thinkingFormat.inherit")
													}), THINKING_FORMATS.map((formatOption) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: formatOption,
														children: formatOption
													}, formatOption))]
												})]
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											style: {
												display: "flex",
												gap: "16px",
												flexWrap: "wrap",
												marginTop: "10px"
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												style: fieldStyle,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														style: fieldLabelStyle,
														children: t("card.capabilities.contextWindow")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														style: {
															display: "flex",
															gap: "6px",
															flexWrap: "wrap",
															alignItems: "center"
														},
														children: [
															CONTEXT_WINDOW_PRESETS.map((preset) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																type: "button",
																disabled: readonly || busy,
																onClick: () => applyContextPreset(entry, preset.value),
																style: {
																	...controlStyle,
																	padding: "2px 8px",
																	cursor: readonly || busy ? "default" : "pointer",
																	opacity: readonly || busy ? .5 : 1
																},
																children: preset.label
															}, preset.value)),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																type: "text",
																value: contextRaw[key] ?? "",
																disabled: readonly || busy,
																placeholder: t("card.capabilities.contextCustomPlaceholder"),
																style: {
																	...controlStyle,
																	width: "120px"
																},
																onChange: (event) => {
																	const next = event.currentTarget.value;
																	setContextRaw((current) => ({
																		...current,
																		[key]: next
																	}));
																},
																onBlur: () => applyContextInput(entry),
																onKeyDown: (event) => {
																	if (event.key === "Enter") event.currentTarget.blur();
																}
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																type: "button",
																disabled: readonly || busy,
																onClick: () => clearContext(entry),
																style: {
																	...controlStyle,
																	cursor: readonly || busy ? "default" : "pointer",
																	opacity: readonly || busy ? .5 : 1
																},
																children: t("card.capabilities.contextClear")
															})
														]
													}),
													contextError[key] !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														style: {
															margin: 0,
															fontSize: "12px",
															lineHeight: "18px",
															color: "var(--dsw-alias-danger, #e5484d)"
														},
														children: contextError[key]
													}) : null
												]
											})
										})
									]
								}) : null] }, key);
							}) : null]
						}, providerId);
					}),
					readonly ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: hintStyle,
						children: t("card.readonly")
					}) : null
				]
			});
		}
		/**
		* The card body, wrapped in a disclosure shell like every peer settings card:
		* a header (name + description + chevron) that toggles the body, expanded by
		* default so the family section reads as an open page of drawers.
		* @param props - locale copy and the injected scopes.
		*/
		function ThinkingLevelsCard({ t, scope, piAiScope, ocScope }) {
			const [open, setOpen] = (0, react.useState)(true);
			const snapshot = (0, react.useSyncExternalStore)((listener) => scope.subscribe(listener), () => scope.getSnapshot());
			const unavailable = snapshot.status === "unavailable";
			const readonly = unavailable || !snapshot.writable;
			const value = snapshot.value ?? {};
			const level = EFFORT_OPTIONS.includes(value.level) ? value.level : "auto";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					border: "1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))",
					background: "var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.05))",
					borderRadius: "12px",
					transition: "border-color 0.16s, background 0.16s"
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					"aria-expanded": open,
					style: {
						appearance: "none",
						width: "100%",
						font: "inherit",
						color: "inherit",
						textAlign: "left",
						cursor: "pointer",
						background: "none",
						border: 0,
						borderRadius: "12px",
						display: "flex",
						alignItems: "center",
						gap: "12px",
						padding: "14px 16px"
					},
					onClick: () => {
						setOpen((current) => !current);
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: {
							flex: "1 1 0%",
							minWidth: 0
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								fontSize: "14px",
								fontWeight: 600,
								color: "var(--dsw-alias-label-primary)"
							},
							children: t("card.title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								color: "var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))",
								fontSize: "13px",
								lineHeight: 1.5
							},
							children: t("card.description")
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
						width: "16",
						height: "16",
						viewBox: "0 0 16 16",
						"aria-hidden": true,
						style: {
							color: "var(--dsw-alias-label-tertiary, rgba(127,127,127,0.8))",
							flex: "0 0 auto",
							transition: "transform 0.16s",
							transform: open ? "rotate(180deg)" : "none"
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: "M4 6l4 4 4-4",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.5",
							strokeLinecap: "round",
							strokeLinejoin: "round"
						})
					})]
				}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: { padding: "12px 16px" },
					children: unavailable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							fontSize: "13px",
							color: "var(--dsw-alias-label-tertiary)"
						},
						children: t("card.unavailable")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: rowStyle,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								htmlFor: "plugin-config-thinking-levels-level",
								style: labelStyle,
								children: t("card.level")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
								id: "plugin-config-thinking-levels-level",
								value: level,
								disabled: readonly,
								style: controlStyle,
								onChange: (event) => {
									scope.set("level", event.currentTarget.value);
								},
								children: EFFORT_OPTIONS.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: option,
									children: t(`card.level.${option}`)
								}, option))
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: rowStyle,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								htmlFor: "plugin-config-thinking-levels-enabled",
								style: labelStyle,
								children: t("card.enabled")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								id: "plugin-config-thinking-levels-enabled",
								type: "checkbox",
								checked: value.enabled ?? true,
								disabled: readonly,
								onChange: (event) => {
									scope.set("enabled", event.currentTarget.checked);
								}
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: rowStyle,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								htmlFor: "plugin-config-thinking-levels-downgrade",
								style: labelStyle,
								children: t("card.allowDowngrade")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								id: "plugin-config-thinking-levels-downgrade",
								type: "checkbox",
								checked: value.allowDowngrade ?? true,
								disabled: readonly || value.level !== "auto",
								onChange: (event) => {
									scope.set("allowDowngrade", event.currentTarget.checked);
								}
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: rowStyle,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								htmlFor: "plugin-config-thinking-levels-upgrade",
								style: labelStyle,
								children: t("card.allowUpgrade")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								id: "plugin-config-thinking-levels-upgrade",
								type: "checkbox",
								checked: value.allowUpgrade ?? false,
								disabled: readonly || value.level !== "auto",
								onChange: (event) => {
									scope.set("allowUpgrade", event.currentTarget.checked);
								}
							})]
						}),
						!snapshot.writable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							style: {
								margin: "8px 0 0",
								fontSize: "12px",
								color: "var(--dsw-alias-label-tertiary)"
							},
							children: t("card.readonly")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelCapabilities, {
							scope: piAiScope,
							ocScope,
							t,
							readonly
						})
					] })
				}) : null]
			});
		}
		//#endregion
		//#region src/client/family-tab.tsx
		/**
		* FamilySettingsSection — the top-level 「起子插件设置」 settings section.
		*
		* One `settings.section` nav entry (registered by this plugin) whose entry
		* declares the `dsh-family.tab` child slot; sibling plugins (session-guard
		* first) contribute their cards there via `ctx.slots.inject('dsh-family.tab',
		* …)`. The section renders the family's own thinking-levels card as the first
		* tab and every contributor as a following tab — the same tabs-around-pages
		* pattern the built-in Plugins section uses (ui-settings-plugins): the tab
		* ledger is a HostObservable projected from the child-slot registry, and the
		* active tab mounts through `renderSlot(key, {}, { only: id })`. Each card is
		* a disclosure drawer expanded by default, so an opened tab shows its full
		* panel right away.
		*
		* When this section is absent the whole family surface is absent; a
		* contributor's inject simply idles (an undischarged wait never blocks the
		* client half), so plugins stay fully functional without their card.
		*/
		/** This plugin's own tab, always first: the thinking-levels card itself. */
		const OWN_TAB_ID = "thinking-levels";
		function FamilySettingsSection(props) {
			const { t, renderSlot, scope, piAiScope } = props;
			const { useTabs } = props;
			const contributors = useTabs((value) => value);
			const [activeId, setActiveId] = (0, react.useState)(OWN_TAB_ID);
			const rows = [{
				id: OWN_TAB_ID,
				order: Number.NEGATIVE_INFINITY,
				label: t("card.title")
			}, ...contributors];
			const active = rows.some((row) => row.id === activeId) ? activeId : OWN_TAB_ID;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gap: "12px"
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					role: "tablist",
					"aria-label": t("family.title"),
					style: {
						display: "flex",
						flexWrap: "wrap",
						gap: "4px"
					},
					children: rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						role: "tab",
						"aria-selected": row.id === active,
						onClick: () => {
							setActiveId(row.id);
						},
						style: {
							appearance: "none",
							font: "inherit",
							cursor: "pointer",
							border: "1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))",
							background: row.id === active ? "var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.08))" : "none",
							color: "var(--dsw-alias-label-primary, inherit)",
							borderRadius: "8px",
							padding: "5px 12px",
							fontSize: "13px"
						},
						children: row.label
					}, row.id))
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					role: "tabpanel",
					children: active === OWN_TAB_ID ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThinkingLevelsCard, {
						t,
						scope,
						piAiScope
					}) : renderSlot?.("dsh-family.tab", {}, {
						only: active,
						fallback: null
					})
				})]
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Services required by the browser half (the common floor across all host
		* generations). Generation-specific services resolve through separate deferred
		* injects below: a cordis inject naming an absent service would pend forever,
		* so `configForms` (0.1.7+), `settingsScope` (≤0.1.6) and `modelDirectories`
		* each get their own inject that simply never fires where the service is
		* missing — shape-detected availability, never version-guessed.
		*/
		const inject = ["slots", "locale"];
		/**
		* Client plugin body: dictionaries plus the composer quick-control slot.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const locale = ctx.locale;
			const t = typeof locale.bind === "function" ? locale.bind(NS) : (key) => key;
			let scopeOf;
			const scopeInject = ctx.inject;
			ctx.effect(() => {
				const disposers = [
					ctx.locale.register(NS, {
						zh,
						en
					}),
					ctx.locale.register(NS, "ja", ja),
					ctx.locale.register(NS, "ko", ko),
					ctx.locale.register(NS, "fr", fr),
					ctx.locale.register(NS, "de", de),
					ctx.locale.register(NS, "it", it),
					ctx.locale.register(NS, "ru", ru),
					ctx.locale.register(NS, "es", es)
				];
				return () => {
					for (const dispose of disposers) dispose();
				};
			}, "dsh-thinking-levels: dictionaries");
			ctx.inject([
				"modelDirectories",
				"sessions",
				"remote",
				"remote.session"
			], (scope) => {
				const directories = scope.modelDirectories;
				if (directories === void 0) return;
				ctx.slots.inject("conversation.input.model", function* () {
					yield ctx.slots.register({
						name: "conversation.input.model",
						id: "context-window-model-panel",
						priority: -1,
						locale: NS,
						inject: (sessionId) => {
							let directory;
							try {
								directory = directories.directoryFor(sessionId);
							} catch {
								directory = void 0;
							}
							return {
								directory,
								piAiScope: scopeOf?.("llm-pi-ai"),
								deepseekScope: scopeOf?.("llm-deepseek")
							};
						}
					}, ModelPanel);
				});
			});
			/** Registrant labels arrive as a string or a locale thunk; unwrap either.
			* A throwing thunk (e.g. a contributor whose label touches a service its own
			* inject never declared) must not kill the whole tab-ledger projection — fall
			* back to the entry id. */
			const resolveLabel = (label, fallback = "") => {
				try {
					if (typeof label === "function") return label() || fallback;
					if (typeof label === "string") return label;
				} catch {}
				return fallback;
			};
			let tabsVersion = -1;
			let tabsRevision = -1;
			let tabs = [];
			const sectionInjected = () => ({
				scope: scopeOf("thinking-levels"),
				piAiScope: scopeOf("llm-pi-ai"),
				ocScope: scopeOf("llm-openai-completions"),
				hooks: { tabs: {
					getSnapshot: () => {
						const version = ctx.slots.getVersion("dsh-family.tab");
						const revision = ctx.locale.getSnapshot().revision;
						if (version !== tabsVersion || revision !== tabsRevision) {
							tabsVersion = version;
							tabsRevision = revision;
							tabs = ctx.slots.entries("dsh-family.tab").map((entry) => ({
								id: entry.options.id ?? "",
								order: entry.options.order ?? 0,
								label: resolveLabel(entry.options.label, entry.options.id ?? "")
							})).sort((a, b) => a.order - b.order);
						}
						return tabs;
					},
					subscribe: (listener) => {
						const offLedger = ctx.slots.subscribe("dsh-family.tab", listener);
						const offLocale = ctx.locale.subscribe(listener);
						return () => {
							offLedger();
							offLocale();
						};
					}
				} }
			});
			/** ≤0.1.6 surface: the per-plugin settings card (the 0.1.7 migration's casualty). */
			function registerLegacyCard() {
				if (scopeOf === void 0) return;
				ctx.slots.inject("settings.plugin.item", function* () {
					yield ctx.slots.register({
						name: "settings.plugin.item",
						id: NS,
						key: NS,
						locale: NS,
						inject: () => ({
							scope: scopeOf("thinking-levels"),
							piAiScope: scopeOf("llm-pi-ai")
						})
					}, ThinkingLevelsCard);
				});
			}
			/** 0.1.7+/0.2.0 surfaces: family section, plugins-page card, context ring. */
			function registerModernSurface() {
				if (scopeOf === void 0) return;
				ctx.slots.inject("settings.section", function* () {
					yield ctx.slots.register({
						name: "settings.section",
						id: "dsh-family",
						order: 40,
						label: () => t("family.title"),
						locale: NS,
						inject: sectionInjected,
						children: { "dsh-family.tab": {
							kind: "list",
							scope: "root"
						} }
					}, FamilySettingsSection);
				});
				ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
					name: "plugins.bundle.config",
					key: "dsh-thinking-levels",
					locale: NS,
					inject: sectionInjected
				}, FamilySettingsSection));
			}
			scopeInject.call(ctx, ["configForms"], (scope) => {
				const forms = scope.configForms;
				if (forms === void 0) return;
				scopeOf = ((ns) => forms.get(ns));
				registerModernSurface();
			});
			scopeInject.call(ctx, ["settingsScope"], (scope) => {
				const settingsScope = scope.settingsScope;
				if (settingsScope === void 0) return;
				scopeOf = ((ns) => settingsScope.bind({ namespace: ns }));
				registerLegacyCard();
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map