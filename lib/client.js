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
		/** Combined dictionary map — all 9 languages, single-call registration. */
		const dictionaries = {
			zh: {
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
				"card.capabilities.failed": "保存失败：配置被拒绝或冲突，请检查值。"
			},
			en: {
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
				"card.capabilities.failed": "Save failed: the value was rejected or conflicted. Check it."
			},
			ja: {
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
				"card.capabilities.failed": "保存に失敗しました：値が拒否されたか競合しています。確認してください。"
			},
			ko: {
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
				"card.capabilities.failed": "저장 실패: 값이 거부되었거나 충돌합니다. 확인하세요."
			},
			fr: {
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
				"card.capabilities.failed": "Échec de l'enregistrement : la valeur a été rejetée ou est en conflit. Vérifiez-la."
			},
			de: {
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
				"card.capabilities.failed": "Speichern fehlgeschlagen: Der Wert wurde abgelehnt oder steht in Konflikt. Bitte überprüfen."
			},
			it: {
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
				"card.capabilities.failed": "Salvataggio non riuscito: il valore è stato rifiutato o è in conflitto. Verifica."
			},
			ru: {
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
				"card.capabilities.failed": "Ошибка сохранения: значение отклонено или конфликтует. Проверьте его."
			},
			es: {
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
				"card.capabilities.failed": "Error al guardar: el valor fue rechazado o está en conflicto. Verifícalo."
			}
		};
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
			zIndex: 1200,
			width: "320px",
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
			zIndex: 1199
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
		const selectStyle = {
			flex: "0 0 auto",
			height: "18px",
			maxWidth: "96px",
			padding: "0 2px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "5px",
			background: "var(--dsw-alias-bg-layer-1)",
			color: "var(--dsw-alias-label-secondary)",
			font: "inherit",
			fontSize: "11px",
			lineHeight: "16px",
			cursor: "pointer",
			colorScheme: "dark light"
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
			fontSize: "12px"
		};
		const labelStyle$1 = {
			flex: "0 0 auto",
			color: "var(--dsw-alias-label-tertiary)",
			whiteSpace: "nowrap"
		};
		const sliderStyle = {
			flex: "1 1 auto",
			minWidth: "48px",
			height: "14px",
			margin: "0",
			accentColor: "var(--dsw-alias-state-business-primary)",
			cursor: "pointer"
		};
		const valueStyle = {
			flex: "0 0 auto",
			minWidth: "36px",
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
			const user = snapshot.user;
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
		function ModelPanel({ directory, piAiScope, deepseekScope, t }) {
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
					model
				});
				setDraft(null);
				setCustom(false);
				setRaw("");
				setError(null);
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
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
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
				}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
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
									const isEditing = editing !== null && editing.provider === group.id && editing.model === model.id;
									const lineEffort = active ? state.current?.reasoningEffort ?? model.reasoning?.defaultEffort : model.reasoning?.defaultEffort;
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
											model.reasoning !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												"aria-label": t("input.effort.title"),
												title: t("input.effort.title"),
												style: selectStyle,
												disabled: busy,
												value: lineEffort ?? "",
												onClick: (event) => event.stopPropagation(),
												onChange: (event) => {
													event.stopPropagation();
													const value = event.currentTarget.value;
													const target = value === "" ? model.reasoning?.defaultEffort : value;
													if (target !== void 0) chooseEffort(group.id, model.id, target);
												},
												children: [
													model.reasoning.defaultEffort !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "",
														children: t("input.effort.default")
													}),
													model.reasoning.defaultEffort === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "",
														hidden: true,
														children: t("input.effort.default")
													}),
													model.reasoning.efforts.map((level) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: level.id,
														children: level.name
													}, level.id))
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
													if (isEditing) {
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
											isEditing && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
				})] }) : null]
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
			const user = snapshot.user;
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
			const { scope, t, readonly } = props;
			const snapshot = (0, react.useSyncExternalStore)((listener) => scope.subscribe(listener), () => scope.getSnapshot());
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
		function ThinkingLevelsCard({ t, scope, piAiScope }) {
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
					}) : renderSlot("dsh-family.tab", {}, {
						only: active,
						fallback: null
					})
				})]
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Services required by the browser half. */
		const inject = [
			"slots",
			"locale",
			"configForms",
			"modelDirectories"
		];
		/**
		* Client plugin body: dictionaries plus the composer quick-control slot.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const t = ctx.locale.bind(NS);
			ctx.effect(() => {
				try {
					return ctx.locale.register(NS, dictionaries);
				} catch {
					return () => {};
				}
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
								piAiScope: ctx.configForms.get("llm-pi-ai"),
								deepseekScope: ctx.configForms.get("llm-deepseek")
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
				scope: ctx.configForms.get("dsh-thinking-levels"),
				piAiScope: ctx.configForms.get("llm-pi-ai"),
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
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map