window.__ModuleLoader__.load({
	id: "dsh-thinking-levels",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/locales.ts
		/** `thinking-levels` client dictionaries (zh / en / ja / ko). */
		/** Dictionary namespace owned by this plugin. */
		const NS = "thinking-levels";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"card.title": "思考档位",
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
			"card.capabilities.failed": "保存失败：配置被拒绝或冲突，请检查值。"
		};
		/** English dictionary (keys mirror zh). */
		const en = {
			"card.title": "Thinking Levels",
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
			"card.capabilities.failed": "Save failed: the value was rejected or conflicted. Check it."
		};
		/** Japanese dictionary (keys mirror zh). */
		const ja = {
			"card.title": "思考レベル",
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
			"card.capabilities.failed": "保存に失敗しました：値が拒否されたか競合しています。確認してください。"
		};
		/** Korean dictionary (keys mirror zh). */
		const ko = {
			"card.title": "사고 수준",
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
			"card.capabilities.failed": "저장 실패: 값이 거부되었거나 충돌합니다. 확인하세요."
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
		//#region src/client/context-quick.tsx
		/**
		* Context-window quick control for the composer tool row
		* (`conversation.input.right`, the seat just left of the model/effort select).
		*
		* Why this seat: the model *card* has no injection point (the shipped
		* `ModelSelect` calls `renderSlot` zero times and owns its popup outright), so a
		* plugin can only contribute inside the composer area. `conversation.input.right`
		* is a session-scoped `list` seat, which is where the harness lets any plugin put
		* a tool-row control. The trigger is a compact pill showing the committed value
		* only; the popover holds one slider row over the shared presets, a collapsed
		* custom-integer editor and Clear — no preset button grid.
		*
		* Model source: whichever session seat this harness provides, in order —
		* `useTrajectory` (the trajectory ledger's `requests`, DSH 0.1.2+) or
		* `useConversation` (`ConversationSnapshot.views.get('trajectory')`). Every
		* renderer standard seat is a `useSyncExternalStoreWithSelector` selector hook
		* and the selector is mandatory: calling one without a selector throws
		* `TypeError: <minified> is not a function` inside the binding shim and takes the
		* whole slot entry down. A harness that provides neither seat renders nothing
		* here instead of a dead control.
		*
		* Two model families are served, each with its own writable config form
		* (both consumed live by `resolveModelInfo(...).context.contextWindow`,
		* so a write takes effect on the next request without a restart):
		* - Custom gateways (`llm-pi-ai` providers): writes the model entry's
		*   `contextWindow` under `providers[provider].models[i]`.
		* - Official DeepSeek models (`deepseek-official`, the `llm-deepseek`
		*   entry): writes the catalog model's `contextWindow` when the model is
		*   listed, otherwise caps via `defaultContextWindow`.
		*
		* Write discipline: dragging the slider only moves a local draft; the config
		* write happens once per gesture (pointer release, key release, blur), so a
		* drag never floods the host with intermediate values.
		*
		* Kept dependency-free beyond react + the injected scopes: plain HTML controls
		* with token-based inline styling, and validation reuses the shared
		* `validateContextWindow`.
		*/
		/** The official DeepSeek provider route owned by the llm-deepseek adapter. */
		const DEEPSEEK_PROVIDER = "deepseek-official";
		/** llm-deepseek's native default context capacity (DEFAULT_CONTEXT_WINDOW). */
		const DEEPSEEK_DEFAULT_WINDOW = 1e6;
		/** Slider stop an unset window parks on: the thumb needs a position, the readout stays "unset". */
		const UNSET_STOP_INDEX = CONTEXT_WINDOW_PRESETS.findIndex((preset) => preset.value === 256e3);
		const pillStyle = {
			display: "inline-flex",
			alignItems: "center",
			gap: "4px",
			height: "24px",
			padding: "0 8px",
			background: "var(--dsw-alias-bg-surface, #fff)",
			color: "var(--dsw-alias-label-secondary)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "6px",
			fontSize: "11px",
			lineHeight: "16px",
			fontFamily: "var(--ds-font-family-code, monospace)",
			cursor: "pointer",
			whiteSpace: "nowrap"
		};
		const popStyle = {
			position: "absolute",
			bottom: "calc(100% + 8px)",
			right: "0",
			zIndex: 1200,
			minWidth: "260px",
			padding: "10px",
			background: "var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.05))",
			color: "var(--dsw-alias-label-primary)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "10px",
			boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
			display: "flex",
			flexDirection: "column",
			gap: "8px"
		};
		const backdropStyle = {
			position: "fixed",
			inset: 0,
			zIndex: 1199
		};
		const rowStyle = {
			display: "flex",
			alignItems: "center",
			gap: "8px",
			fontSize: "12px",
			lineHeight: "18px",
			color: "var(--dsw-alias-label-secondary)"
		};
		const labelStyle = {
			flex: "0 0 auto",
			minWidth: "0",
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
			color: "var(--dsw-alias-label-tertiary)"
		};
		const sliderStyle = {
			flex: "1 1 auto",
			minWidth: "56px",
			height: "14px",
			margin: "0",
			accentColor: "var(--dsw-alias-state-business-primary)",
			cursor: "pointer"
		};
		const valueStyle = {
			flex: "0 0 auto",
			minWidth: "40px",
			textAlign: "right",
			color: "var(--dsw-alias-label-primary)",
			fontFamily: "var(--ds-font-family-code, monospace)",
			fontVariantNumeric: "tabular-nums"
		};
		const glyphButtonStyle = {
			flex: "0 0 auto",
			height: "18px",
			padding: "0 5px",
			border: "1px solid transparent",
			borderRadius: "4px",
			background: "transparent",
			color: "var(--dsw-alias-label-tertiary)",
			font: "inherit",
			cursor: "pointer"
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
		const customRowStyle = {
			display: "flex",
			alignItems: "center",
			gap: "6px"
		};
		const inputStyle = {
			flex: "1 1 auto",
			minWidth: "0",
			boxSizing: "border-box",
			padding: "2px 6px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "5px",
			background: "var(--dsw-alias-bg-surface, #fff)",
			color: "var(--dsw-alias-label-primary)",
			font: "inherit"
		};
		const errorStyle = {
			flex: "0 0 auto",
			color: "var(--dsw-alias-danger, #e5484d)"
		};
		/** The user-layer `providers` value of the llm-pi-ai namespace, when present. */
		function providersOf(snapshot) {
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
		/**
		* The stable trajectory-ledger selector (the `useTrajectory` seat): the seat
		* memoizes its selection on the selector reference, so it must not be a fresh
		* closure per render. The ledger is a store-owned array whose reference only
		* moves when the trajectory changes.
		* @param snapshot - the current trajectory snapshot.
		* @returns the request ledger.
		*/
		const selectRequests = (snapshot) => snapshot.requests;
		/**
		* The stable trajectory-view selector (the `useConversation` seat): selecting
		* the view snapshot (a store-owned reference, not a derived object) keeps the
		* selected value stable between snapshots — a selector that built a new object
		* would re-render forever.
		* @param snapshot - the current conversation snapshot.
		* @returns the trajectory view snapshot, absent while the view is unregistered.
		*/
		const selectTrajectory = (snapshot) => snapshot.views?.get?.("trajectory");
		/**
		* The current session's active model, taken from the trajectory ledger's
		* latest assistant request prompt config. Absent for a blank session (no
		* request yet) — the control then renders disabled.
		* @param source - the request ledger, or a trajectory snapshot carrying it.
		* @returns the provider/model pair, or undefined when the ledger has none.
		*/
		function activeModelOf(source) {
			const requests = Array.isArray(source) ? source ?? [] : typeof source === "object" && source !== null ? source.requests ?? [] : [];
			for (let index = requests.length - 1; index >= 0; index -= 1) {
				const config = requests[index]?.prompt?.config;
				if (requests[index]?.purpose === "assistant" && typeof config?.provider === "string" && typeof config?.model === "string") return {
					provider: config.provider,
					model: config.model
				};
			}
		}
		/** One model entry's declared contextWindow, when present. */
		function contextWindowOf(model) {
			const value = model["contextWindow"];
			return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : void 0;
		}
		/**
		* The slider stop nearest to a committed token count; a window that matches no
		* preset still parks the thumb on its closest stop.
		* @param value - the committed context window, when one is set.
		* @returns the stop index, or the unset park position.
		*/
		function stopIndexOf(value) {
			if (value === void 0) return UNSET_STOP_INDEX;
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
		* The composer context-window quick control. Renders nothing when this harness
		* provides neither session seat, so a missing seat never leaves a dead control
		* (or a crash) in the tool row.
		* @param props - injected scopes, session standard seats, copy.
		*/
		function ContextQuick(props) {
			if (typeof props.useTrajectory === "function") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrajectoryBound, {
				...props,
				useTrajectory: props.useTrajectory
			});
			if (typeof props.useConversation === "function") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConversationBound, {
				...props,
				useConversation: props.useConversation
			});
			return null;
		}
		/**
		* The trajectory-seat binding (DSH 0.1.2+).
		* @param props - the control props plus the present trajectory seat.
		*/
		function TrajectoryBound({ useTrajectory, ...rest }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ContextQuickView, {
				...rest,
				active: activeModelOf(useTrajectory(selectRequests))
			});
		}
		/**
		* The conversation-seat binding (harness lines without the trajectory seat).
		* @param props - the control props plus the present conversation seat.
		*/
		function ConversationBound({ useConversation, ...rest }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ContextQuickView, {
				...rest,
				active: activeModelOf(useConversation(selectTrajectory))
			});
		}
		/**
		* The bound control: a value pill that opens a one-row slider popover
		* (preset slider, committed value, collapsed custom-integer editor, Clear).
		* Custom gateways and official DeepSeek models are both supported (see module
		* doc for the namespace each writes).
		* @param props - injected scopes, the resolved active model, copy.
		*/
		function ContextQuickView({ active, piAiScope, deepseekScope, t }) {
			const official = active !== void 0 && active.provider === DEEPSEEK_PROVIDER;
			const piSnapshot = (0, react.useSyncExternalStore)((listener) => piAiScope.subscribe(listener), () => piAiScope.getSnapshot());
			const dsSnapshot = (0, react.useSyncExternalStore)((listener) => deepseekScope.subscribe(listener), () => deepseekScope.getSnapshot());
			const snapshot = official ? dsSnapshot : piSnapshot;
			const readonly = snapshot.status === "unavailable" || !snapshot.writable;
			const providers = official ? {} : providersOf(piSnapshot);
			const dsSection = official ? deepseekSectionOf(dsSnapshot) : void 0;
			let currentWindow;
			let writableTarget = false;
			if (official && active !== void 0) {
				const models = dsSection?.models ?? [];
				const index = models.findIndex((model) => model["id"] === active.model);
				currentWindow = index >= 0 ? contextWindowOf(models[index]) : void 0;
				if (currentWindow === void 0) currentWindow = dsSection?.defaultContextWindow;
				writableTarget = true;
			} else if (active !== void 0) {
				const profile = providers[active.provider];
				const model = profile !== void 0 && Array.isArray(profile.models) ? profile.models.find((candidate) => typeof candidate === "object" && candidate !== null && candidate["id"] === active.model) : void 0;
				currentWindow = model === void 0 ? void 0 : contextWindowOf(model);
				writableTarget = model !== void 0;
			}
			const [open, setOpen] = (0, react.useState)(false);
			const [draft, setDraft] = (0, react.useState)(null);
			const [custom, setCustom] = (0, react.useState)(false);
			const [raw, setRaw] = (0, react.useState)("");
			const [error, setError] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const disabled = readonly || busy || active === void 0 || !writableTarget;
			const stop = draft ?? stopIndexOf(currentWindow);
			/** Commit (or delete) the active model's context window. */
			const commitWindow = (value) => {
				if (active === void 0 || snapshot.status !== "ready" || !writableTarget) {
					setDraft(null);
					return;
				}
				setBusy(true);
				if (official) {
					const models = (deepseekSectionOf(dsSnapshot).models ?? []).map((model) => ({ ...model }));
					const index = models.findIndex((model) => model["id"] === active.model);
					(index >= 0 ? deepseekScope.set("models", models.map((model, at) => {
						if (at !== index) return model;
						if (value === void 0) {
							const rest = { ...model };
							delete rest["contextWindow"];
							return rest;
						}
						return {
							...model,
							contextWindow: value
						};
					})) : deepseekScope.set("defaultContextWindow", value === void 0 ? DEEPSEEK_DEFAULT_WINDOW : value)).then(() => {
						setBusy(false);
						setDraft(null);
					}).catch(() => {
						setBusy(false);
						setDraft(null);
					});
					return;
				}
				const next = structuredClone(providers);
				const entry = next[active.provider]?.models?.find((candidate) => typeof candidate === "object" && candidate !== null && candidate["id"] === active.model);
				if (entry === void 0) {
					setBusy(false);
					setDraft(null);
					return;
				}
				if (value === void 0) delete entry["contextWindow"];
				else entry["contextWindow"] = value;
				piAiScope.set("providers", next).then(() => {
					setBusy(false);
					setDraft(null);
				}).catch(() => {
					setBusy(false);
					setDraft(null);
				});
			};
			/** Write the stop the gesture landed on; a drag only moves the draft. */
			const commitStop = () => {
				if (disabled || draft === null) return;
				commitWindow(CONTEXT_WINDOW_PRESETS[draft]?.value);
			};
			/** Validate and commit the custom input; empty clears. */
			const applyCustom = () => {
				const trimmed = raw.trim();
				if (trimmed === "") {
					setError(null);
					commitWindow(void 0);
					return;
				}
				const validation = validateContextWindow(trimmed);
				if (!validation.ok) {
					setError(t(validation.reason === "integer" ? "input.context.integer" : "input.context.range"));
					return;
				}
				setError(null);
				commitWindow(validation.value);
			};
			const value = draft === null ? currentWindow === void 0 ? t("input.context.unset") : formatContextWindow(currentWindow) : formatContextWindow(CONTEXT_WINDOW_PRESETS[draft]?.value ?? 0);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: { position: "relative" },
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					disabled,
					"aria-expanded": open,
					"aria-label": t("input.context.title"),
					title: active === void 0 ? t("input.context.noModel") : `${active.provider}/${active.model}`,
					style: {
						...pillStyle,
						cursor: disabled ? "default" : "pointer",
						opacity: disabled ? .55 : 1
					},
					onClick: () => {
						setOpen((value) => !value);
						setError(null);
					},
					children: value
				}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: backdropStyle,
					onClick: () => {
						setOpen(false);
						setError(null);
					}
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: popStyle,
					role: "group",
					"aria-label": t("input.context.title"),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: rowStyle,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: labelStyle,
								title: t("input.context.globalHint"),
								children: t("input.context.title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: CONTEXT_WINDOW_PRESETS.length - 1,
								step: 1,
								value: stop,
								disabled,
								"aria-label": t("input.context.title"),
								style: {
									...sliderStyle,
									cursor: disabled ? "default" : "pointer",
									opacity: disabled ? .55 : 1
								},
								onChange: (event) => {
									setDraft(Number(event.currentTarget.value));
								},
								onPointerUp: commitStop,
								onKeyUp: commitStop,
								onBlur: commitStop
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: valueStyle,
								children: value
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								disabled,
								"aria-label": t("input.context.custom"),
								"aria-expanded": custom,
								title: t("input.context.custom"),
								style: {
									...glyphButtonStyle,
									cursor: disabled ? "default" : "pointer",
									opacity: disabled ? .55 : 1
								},
								onClick: () => {
									setCustom((open) => !open);
									setError(null);
								},
								children: "⋯"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: disabled || currentWindow === void 0,
								style: {
									...actionButtonStyle,
									cursor: disabled || currentWindow === void 0 ? "default" : "pointer",
									opacity: disabled || currentWindow === void 0 ? .55 : 1
								},
								onClick: () => {
									setDraft(null);
									setError(null);
									setRaw("");
									commitWindow(void 0);
								},
								children: t("input.context.clear")
							})
						]
					}), custom ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: customRowStyle,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "text",
								inputMode: "numeric",
								value: raw,
								disabled,
								placeholder: t("input.context.customPlaceholder"),
								"aria-label": t("input.context.customPlaceholder"),
								style: inputStyle,
								onChange: (event) => {
									setRaw(event.currentTarget.value);
								},
								onKeyDown: (event) => {
									if (event.key === "Enter") applyCustom();
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								disabled,
								style: {
									...actionButtonStyle,
									cursor: disabled ? "default" : "pointer",
									opacity: disabled ? .55 : 1
								},
								onClick: applyCustom,
								children: t("input.context.apply")
							}),
							error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: errorStyle,
								children: error
							})
						]
					}) : null]
				})] }) : null]
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Services required by the browser half. */
		const inject = [
			"slots",
			"locale",
			"configForms"
		];
		/**
		* Client plugin body: dictionaries plus the composer quick-control slot.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => {
				const disposers = [
					ctx.locale.register(NS, {
						zh,
						en
					}),
					ctx.locale.register(NS, "ja", ja),
					ctx.locale.register(NS, "ko", ko)
				];
				return () => {
					for (const dispose of disposers) dispose();
				};
			}, "dsh-thinking-levels: dictionaries");
			ctx.slots.inject("conversation.input.right", function* () {
				yield ctx.slots.register({
					name: "conversation.input.right",
					id: "context-window-quick",
					locale: NS,
					inject: () => {
						return {
							piAiScope: ctx.configForms.get("llm-pi-ai"),
							deepseekScope: ctx.configForms.get("llm-deepseek")
						};
					}
				}, ContextQuick);
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map