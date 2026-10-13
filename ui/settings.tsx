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
  return <UiProvider theme={s.snapshot?.theme?.mode ?? "system"} locale={s.zh ? "zh-CN" : "en"} className="imagegen-settings-ui mu-settings-codex">
    <SettingsPage title={t("图片生成", "Image generation")} description={t("配置生图渠道与凭据，独立于聊天模型。", "Configure image providers and credentials independently of chat models.")} actions={<span role="status" aria-live="polite">{s.error || s.failed ? "" : s.message}</span>}>
      {!s.config ? <DialogNotice>{t("正在加载…", "Loading…")}</DialogNotice> : <>
        <SettingsPanel title={t("生图渠道", "Image provider")} variant="preferences"><Form>
          <FormItem variant="inline" label={t("渠道", "Provider")} description={t("生成会使用所选账户的额度或产生费用。", "Generation uses the selected account's quota or billing.")}><Select label={t("生图渠道", "Image provider")} value={String(s.values.provider ?? "openai")} disabled={s.busy} onValueChange={provider => s.setValues(current => ({ ...current, provider }))} options={[{ value: "openai", label: "OpenAI API" }, { value: "codex-cli", label: "Codex CLI" }]} /></FormItem>
        </Form></SettingsPanel>
        {cli ? <SettingsPanel title="Codex CLI" variant="preferences"><Form>
          <FormItem variant="inline" label={t("Codex 连接", "Codex connection")} description={t("使用已登录的账户；在模型设置中添加和登录。", "Uses the signed-in account. Add and sign in from model settings.")}><Select label={t("Codex 连接", "Codex connection")} value={String(s.values.connectionId ?? "")} disabled={s.busy} onValueChange={connectionId => s.setValues(current => ({ ...current, connectionId, cliModel: "" }))} options={connections.map(c => ({ value: c.id, label: c.name }))} /></FormItem>
          <FormItem variant="inline" label={t("生图执行模型", "Codex model")}><Select label={t("生图执行模型", "Codex model")} value={String(s.values.cliModel || selected?.models[0] || "")} disabled={!selected || s.busy} onValueChange={cliModel => s.setValues(current => ({ ...current, cliModel }))} options={(selected?.models ?? []).map(model => ({ value: model, label: model }))} /></FormItem>
          <FormItem variant="inline" label={t("连接状态", "Connections")} description={!connections.length ? t("暂无已启用的 Codex 连接。", "No enabled Codex connections.") : t(`已找到 ${connections.length} 个连接。`, `${connections.length} connections available.`)}><Button variant="outline" disabled={busy} onClick={() => void action("status")}>{t("刷新", "Refresh")}</Button></FormItem>
        </Form></SettingsPanel> : <SettingsPanel title="OpenAI API" variant="preferences"><Form>
          <FormItem variant="inline" label={t("生图模型", "Image model")} description="api.openai.com/v1"><Select label={t("生图模型", "Image model")} disabled={s.busy} value={String(s.values.model ?? "gpt-image-1.5")} onValueChange={model => s.setValues(current => ({ ...current, model }))} options={["gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini", "chatgpt-image-latest"].map(model => ({ value: model, label: model }))} /></FormItem>
          <FormItem variant="inline" label="OpenAI API Key" description={configured ? t("凭据已配置，保存在本机安全存储中。", "Credential configured in local secure storage.") : t("尚未配置凭据。", "No credential configured.")}><Input label="OpenAI API Key" hideLabel type="password" autoComplete="off" value={key} onChange={setKey} disabled={busy} /></FormItem>
          <FormItem variant="inline" className="settings-path-row" label={t("凭据管理", "Credentials")}><FieldRow><Button variant="primary" disabled={busy || !key.trim()} onClick={() => void action("saveCredential", key)}>{t("保存", "Save")}</Button><Button variant="outline" disabled={busy || !configured} onClick={() => void action("clearCredential")}>{t("清除", "Clear")}</Button></FieldRow></FormItem>
        </Form></SettingsPanel>}
      </>}
      {(error || s.error || s.failed) && <DialogNotice tone="error">{error || s.error || s.message}</DialogNotice>}
    </SettingsPage>
  </UiProvider>;
}
mountPlugin(<Settings />);
