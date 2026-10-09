import { useEffect, useState } from "react";
import {
  mountPlugin,
  settingsAction,
  useSettings,
} from "@modera/plugin-sdk/react";
import "@modera/ui/styles.css";
import { Button, Input, Select, UiProvider, DialogNotice } from "@modera/ui";
import {
  SettingsPage,
  SettingsPanel,
  Form,
  FormItem,
  FieldRow,
} from "@modera/ui/settings";
function Settings() {
  const s = useSettings({ autoSave: true });
  const [key, setKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [connections, setConnections] = useState<readonly { id: string; name: string; models: readonly string[] }[]>([]);
  const cli = s.values.provider === "codex-cli";
  const selected = connections.find(c => c.id === s.values.connectionId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = (zh: string, en: string) => (s.zh ? zh : en);
  async function action(id: string, value?: string) {
    setBusy(true);
    setError("");
    try {
      const state = await settingsAction<{ configured: boolean; connections?: typeof connections }>(id, value);
      setConfigured(state.configured);
      setConnections(state.connections ?? []);
    } catch {
      setError(
        t(
          "操作失败，请检查宿主安全存储是否可用。",
          "Operation failed. Check desktop secure storage.",
        ),
      );
    } finally {
      setKey("");
      setBusy(false);
    }
  }
  useEffect(() => {
    void action("status");
  }, []);
  return (
    <UiProvider theme="system" locale={s.zh ? "zh-CN" : "en"}>
      <SettingsPage
        title={t("图片生成", "Image generation")}
        description={t(
          "生图渠道与聊天模型独立配置。生成会使用对应账户的额度或产生费用。",
          "Image generation is independent of the chat model and uses the selected account's quota or billing.",
        )}
      >
        <SettingsPanel title={t("生图渠道", "Image provider")}>
          <Select label={t("生图渠道", "Image provider")} value={String(s.values.provider ?? "openai")} disabled={!s.config || s.busy} onValueChange={provider => s.setValues(current => ({ ...current, provider }))} options={[{ value: "openai", label: "OpenAI API" }, { value: "codex-cli", label: "Codex CLI" }]} />
        </SettingsPanel>
        {cli ? <SettingsPanel title="Codex CLI">
          <p>{t("可以继续使用任意聊天模型。生图工具会调用下方 Codex 连接的已登录账户，无需 API Key。请先在设置 → 模型中添加并登录 Codex CLI。", "Keep any chat model. The image tool uses the selected Codex connection's existing login without an API key. Add and sign in to Codex CLI in model settings first.")}</p>
          <Form>
            <FormItem label={t("Codex 连接", "Codex connection")}><Select label={t("Codex 连接", "Codex connection")} value={String(s.values.connectionId ?? "")} disabled={!s.config || s.busy} onValueChange={connectionId => s.setValues(current => ({ ...current, connectionId, cliModel: "" }))} options={connections.map(c => ({ value: c.id, label: c.name }))} /></FormItem>
            <FormItem label={t("生图执行模型", "Codex model")}><Select label={t("生图执行模型", "Codex model")} value={String(s.values.cliModel || selected?.models[0] || "")} disabled={!selected || s.busy} onValueChange={cliModel => s.setValues(current => ({ ...current, cliModel }))} options={(selected?.models ?? []).map(model => ({ value: model, label: model }))} /></FormItem>
          </Form>
          {!connections.length && <p>{t("尚无已启用的 Codex 连接，请在模型设置中配置后刷新。", "No enabled Codex connection. Configure one in model settings, then refresh.")}</p>}
          <Button variant="outline" disabled={busy} onClick={() => void action("status")}>{t("刷新连接", "Refresh connections")}</Button>
        </SettingsPanel> : <SettingsPanel title="OpenAI" description="https://api.openai.com/v1">
          <p>
            {t(
              "以下配置用于 OpenAI 图片 API，与当前聊天模型独立。",
              "These settings apply to the OpenAI Image API independently of the chat model.",
            )}
          </p>
          <Form>
            <FormItem label={t("生图模型", "Image model")}>
              <Select
                label={t("生图模型", "Image model")}
                disabled={!s.config || s.busy}
                value={String(s.values.model ?? "gpt-image-1.5")}
                onValueChange={(value) =>
                  s.setValues((current) => ({
                    ...current,
                    model: value,
                  }))
                }
                options={[
                  "gpt-image-1.5",
                  "gpt-image-1",
                  "gpt-image-1-mini",
                  "chatgpt-image-latest",
                ].map((model) => ({ value: model, label: model }))}
              />
            </FormItem>
            <p>
              {configured
                ? t("凭据已配置", "Credential configured")
                : t("尚未配置凭据", "Credential not configured")}
            </p>
            <FormItem label="OpenAI API Key">
              <Input
                label="OpenAI API Key"
                hideLabel
                type="password"
                autoComplete="off"
                value={key}
                onChange={setKey}
              />
            </FormItem>
          </Form>
          <FieldRow>
            <Button
              disabled={busy || !key.trim()}
              onClick={() => void action("saveCredential", key)}
            >
              {t("保存凭据", "Save credential")}
            </Button>
            <Button
              variant="outline"
              disabled={busy || !configured}
              onClick={() => void action("clearCredential")}
            >
              {t("清除凭据", "Clear credential")}
            </Button>
          </FieldRow>
        </SettingsPanel>}
        {(error || s.error) && (
          <DialogNotice tone="error">{error || s.error}</DialogNotice>
        )}
      </SettingsPage>
    </UiProvider>
  );
}
mountPlugin(<Settings />);
