import { useState } from "preact/hooks";
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
    if (c.length !== 4) return showToast("o código tem 4 letras");
    keepName();
    navigate(`/p/${c}`);
  };

  return (
    <main class="home">
      <h1 class="logo">
        <span class="gem">◆</span> Shiny Diamonds
      </h1>
      <p class="tagline">
        Um diamante tá escondido na praia. Cada um tem uma pista. Quem acha primeiro?
      </p>

      <label class="field">
        <span>Seu nome</span>
        <input
          value={name}
          maxLength={16}
          placeholder="Jogador"
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
        />
      </label>

      <button type="button" class="btn primary" disabled={busy} onClick={create}>
        Criar sala
      </button>

      <form class="join" onSubmit={join}>
        <input
          value={code}
          maxLength={4}
          placeholder="CÓDIGO"
          class="code-input"
          autoCapitalize="characters"
          autoCorrect="off"
          onInput={(e) => setCode((e.target as HTMLInputElement).value.toUpperCase())}
        />
        <button type="submit" class="btn">
          Entrar
        </button>
      </form>

      <button
        type="button"
        class="btn ghost"
        onClick={() => code.length === 4 && navigate(`/tv/${code.toUpperCase()}`)}
      >
        Abrir como TV / telão
      </button>
      <p class="small">De 2 a 5 jogadores. Dá pra completar a mesa com bots.</p>
    </main>
  );
}
