import { useState } from "preact/hooks";
import { lang, setLang, t } from "../i18n";
import { createRoom, nameKey } from "../net";
import { navigate } from "../router";
import { showToast } from "../store";

function savedName(): string {
  try {
    return localStorage.getItem(nameKey) ?? "";
  } catch {
    return "";
  }
}

export function Home() {
  const [name, setName] = useState(savedName);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const keepName = () => {
    try {
      localStorage.setItem(nameKey, name.trim());
    } catch {
      // ignore
    }
  };

  const create = async () => {
    setBusy(true);
    try {
      keepName();
      navigate(`/p/${await createRoom()}`);
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const join = (e: Event) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length !== 4) return showToast(t("home.codeLen"));
    keepName();
    navigate(`/p/${c}`);
  };

  return (
    <main class="home">
      <div class="langbar">
        <button
          type="button"
          class={`btn tiny ${lang.value === "pt" ? "primary" : ""}`}
          onClick={() => setLang("pt")}
        >
          PT
        </button>
        <button
          type="button"
          class={`btn tiny ${lang.value === "en" ? "primary" : ""}`}
          onClick={() => setLang("en")}
        >
          EN
        </button>
      </div>
      <h1 class="logo">
        <span class="gem">◆</span> Shiny Diamonds
      </h1>
      <p class="tagline">{t("home.tagline")}</p>

      <label class="field">
        <span>{t("home.name")}</span>
        <input
          value={name}
          maxLength={16}
          placeholder={t("home.namePh")}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
        />
      </label>

      <button type="button" class="btn primary" disabled={busy} onClick={create}>
        {t("home.create")}
      </button>

      <form class="join" onSubmit={join}>
        <input
          value={code}
          maxLength={4}
          placeholder={t("home.codePh")}
          class="code-input"
          autoCapitalize="characters"
          autoCorrect="off"
          onInput={(e) => setCode((e.target as HTMLInputElement).value.toUpperCase())}
        />
        <button type="submit" class="btn">
          {t("home.join")}
        </button>
      </form>

      <button
        type="button"
        class="btn ghost"
        onClick={() => code.length === 4 && navigate(`/tv/${code.toUpperCase()}`)}
      >
        {t("home.tv")}
      </button>
      <p class="small">{t("home.players")}</p>
    </main>
  );
}
