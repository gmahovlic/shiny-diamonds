import { signal } from "@preact/signals";
import type {
  Clue,
  Color,
  ErrorCode,
  GameEvent,
  GameView,
  StructureKind,
  Terrain,
  Territory,
} from "@shiny/core";
import { cellLabel } from "./components/HexMap";

export type Lang = "pt" | "en";
const LANG_KEY = "sd:lang";

function detect(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "pt" || saved === "en") return saved;
  } catch {
    // ignore
  }
  return /^pt/i.test(navigator.language) ? "pt" : "en";
}

export const lang = signal<Lang>(detect());

export function setLang(l: Lang): void {
  lang.value = l;
  document.documentElement.lang = l === "pt" ? "pt-BR" : "en";
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {
    // ignore
  }
}

const pt = {
  "home.tagline":
    "🏖️ Um diamante tá escondido na praia. Cada um tem uma pista. Quem acha primeiro? 🔎",
  "home.name": "Seu nome",
  "home.namePh": "Jogador",
  "home.create": "Criar sala",
  "home.codePh": "CÓDIGO",
  "home.join": "Entrar",
  "home.tv": "Abrir como TV / telão",
  "home.players": "De 2 a 5 jogadores. Dá pra completar a mesa com bots.",
  "home.codeLen": "o código tem 4 letras",
  "home.createFail": "não consegui criar a sala",
  "lobby.room": "Sala",
  "lobby.scan": "Aponta a câmera pra entrar",
  "lobby.tv": "TV / telão",
  "lobby.players": "Jogadores",
  "lobby.you": "(você)",
  "lobby.remove": "tirar",
  "lobby.screens": "📺 {n} tela(s) conectada(s)",
  "lobby.addBot": "+ Bot",
  "lobby.hard": "Modo difícil",
  "lobby.assist": "Ajuda de dedução",
  "assist.off": "Nenhuma (hardcore)",
  "assist.normal": "Normal (anotações + contagem)",
  "assist.full": "Completa (elimina hexes)",
  "lobby.start": "Começar",
  "lobby.need": "Precisa de {min} a {max} jogadores",
  "lobby.waiting": "Esperando o host começar…",
  "lobby.hardChip": "difícil",
  "lobby.share": "Compartilhar link",
  "lobby.copied": "link copiado!",
  "lobby.leave": "Sair da sala",
  "lobby.rename": "Trocar nome",
  "lobby.renamePrompt": "Seu nome:",
  "game.cube": "Coloque um cubo onde sua pista diz NÃO",
  "game.setup": "Preparação: toque num hex",
  "game.yourTurn": "Sua vez! Toque num hex",
  "game.turnOf": "Vez de {name}",
  "game.over": "Fim de jogo",
  "game.yourClue": "Sua pista",
  "game.yourClues": "Suas pistas",
  "game.noClue": "Sem pista (você está só assistindo).",
  "game.hint": "Toque num hex pra ver detalhes e marcar anotações.",
  "game.clearNotes": "limpar anotações",
  "game.hyps": "{name}: {n} pistas possíveis",
  "game.possible": "{n} hex(es) ainda possíveis",
  "game.found": "{name} achou o diamante!",
  "game.foundShort": "{name} achou!",
  "game.end": "Fim",
  "game.wasAt": "Estava em {cell}.",
  "game.hex": "Hex {cell}",
  "game.again": "Jogar de novo",
  "game.rules": "Regras",
  "game.sound": "Som",
  "hex.nothing": "Nada por aqui ainda.",
  "hex.territory": "Território: {name}",
  "hex.ask": "Perguntar a {name}",
  "hex.search": "🔎 Procurar aqui",
  "hex.cube": "Colocar cubo aqui",
  "hex.cubeNo": "Sua pista diz SIM aqui",
  "hex.mark": "✏️ marcar",
  "hex.markX": "✕ marcado · trocar",
  "hex.markQ": "? marcado · limpar",
  "hex.yes": "sim",
  "hex.no": "não",
  "hex.close": "fechar",
  "seat.you": "(você)",
  "seat.cubing": "colocando cubo",
  "seat.answering": "respondendo",
  "seat.turn": "na vez",
  "ev.found": "💎 {name} achou o diamante em {cell}!",
  "ev.searched": "{name} procurou em {cell}",
  "ev.searchedNo": "{name} procurou em {cell}: {other} disse NÃO",
  "ev.asked": "{name} perguntou a {target} sobre {cell}: {answer}",
  "ev.yes": "SIM",
  "ev.no": "NÃO",
  "ev.setup": "{name} colocou um cubo inicial em {cell}",
  "ev.cube": "{name} colocou um cubo em {cell}",
  "tv.scan": "entrar como tela",
  "conn.connecting": "Conectando…",
  "conn.reconnecting": "Reconectando…",
  "conn.oops": "Ops",
  "conn.back": "Voltar",
  "conn.lost": "sem conexão com a sala",
  "conn.cantJoin": "não deu pra entrar na sala",
  "player.default": "Jogador",
  "terrain.sea": "mar",
  "terrain.sand": "areia",
  "terrain.palms": "palmeiras",
  "terrain.boardwalk": "calçadão",
  "terrain.street": "rua",
  "territory.gulls": "gaivotas",
  "territory.crabs": "caranguejos",
  "structure.kiosk": "quiosque",
  "structure.tent": "barraca",
  "color.blue": "azul",
  "color.white": "branca",
  "color.green": "verde",
  "color.black": "preta",
  "clue.terrain2": "O diamante está em {a} ou em {b}",
  "clue.terrain2.not": "O diamante NÃO está em {a} nem em {b}",
  "clue.nearTerrain": "O diamante está a até 1 hex de {t}",
  "clue.nearTerrain.not": "O diamante NÃO está a até 1 hex de {t}",
  "clue.nearTerritory": "O diamante está a até 1 hex de um território (gaivotas ou caranguejos)",
  "clue.nearTerritory.not":
    "O diamante NÃO está a até 1 hex de um território (gaivotas ou caranguejos)",
  "clue.near2Territory": "O diamante está a até 2 hexes de {t}",
  "clue.near2Territory.not": "O diamante NÃO está a até 2 hexes de {t}",
  "clue.near2Structure": "O diamante está a até 2 hexes de um(a) {s}",
  "clue.near2Structure.not": "O diamante NÃO está a até 2 hexes de um(a) {s}",
  "clue.near3Color": "O diamante está a até 3 hexes de uma estrutura {c}",
  "clue.near3Color.not": "O diamante NÃO está a até 3 hexes de uma estrutura {c}",
  "rules.title": "Regras & taxonomia",
  "rules.how": "Como jogar",
  "rules.r1":
    "Um diamante tá escondido num hex. Só existe um hex que bate com todas as pistas juntas.",
  "rules.r2":
    "Cada jogador tem uma pista secreta{hard}. Preparação: cada um coloca 2 cubos em hexes que a própria pista rejeita.",
  "rules.r2hard": " (no difícil, pode ser negativa: “NÃO está…”)",
  "rules.r3":
    "Perguntar: escolha um hex e um jogador. Ele responde na hora: disco = a pista dele aceita o hex, cubo = rejeita. Se vier cubo, você coloca um cubo seu em algum hex que sua pista rejeita.",
  "rules.r4":
    "Procurar: escolha um hex que sua pista aceita. Todo mundo responde em ordem. Se todos aceitarem, achou e venceu. O primeiro cubo interrompe, e você paga um cubo.",
  "rules.r5":
    "Disco = SIM, cubo = NÃO. Tudo que tá na mesa é informação pública. Nunca se pode procurar num hex com cubo.",
  "rules.terrains": "Terrenos",
  "rules.territories": "Territórios",
  "rules.dashed": "(hexes tracejados)",
  "rules.structures": "Estruturas",
  "rules.oneEach": "Cada cor tem exatamente um quiosque e uma barraca.",
  "rules.blackHard": " A cor preta só aparece no modo difícil.",
  "rules.clues": "Tipos de pista",
  "rules.c1": "O diamante está em terreno A ou em terreno B (10 combinações)",
  "rules.c2": "O diamante está a até 1 hex de um terreno (5)",
  "rules.c3": "O diamante está a até 1 hex de um território, gaivotas ou caranguejos (1)",
  "rules.c4": "O diamante está a até 2 hexes de gaivotas / de caranguejos (2)",
  "rules.c5": "O diamante está a até 2 hexes de um quiosque / de uma barraca (2)",
  "rules.c6": "O diamante está a até 3 hexes de uma estrutura azul / branca / verde{black} ({n})",
  "rules.c6black": " / preta",
  "rules.c7": "No difícil, qualquer pista acima pode vir negada: “O diamante NÃO está…”",
  "rules.tip": "Dica: “a até N hexes” conta o próprio hex. Um hex de areia está a 0 de areia.",
  "err.game_over": "o jogo já acabou",
  "err.invalid_seat": "assento inválido",
  "err.no_cube_owed": "você não deve cubo agora",
  "err.already_marked": "você já marcou esse hex",
  "err.cube_needs_no": "o cubo tem que ir num hex que sua pista rejeita",
  "err.not_in_play": "a partida não está rolando",
  "err.cube_owed": "ainda falta colocar um cubo",
  "err.not_your_turn": "não é sua vez",
  "err.invalid_target": "jogador inválido",
  "err.target_marked": "esse jogador já marcou esse hex",
  "err.search_cubed": "não dá pra procurar num hex com cubo",
  "err.search_needs_yes": "só dá pra procurar num hex que sua pista aceita",
  "err.unknown_member": "você não está na sala",
  "err.rename_in_game": "não dá pra trocar o nome durante a partida",
  "err.host_only": "só o host pode fazer isso",
  "err.game_started": "a partida já começou",
  "err.room_full": "a sala está cheia",
  "err.host_self_remove": "o host não pode se tirar",
  "err.need_players": "precisa de {min} a {max} jogadores (tem {have})",
  "err.not_finished": "a partida ainda não acabou",
  "err.no_game": "não tem partida rolando",
  "err.not_seated": "você não está jogando",
  "err.own_seat_only": "só dá pra agir pelo seu assento",
  "err.malformed": "mensagem inválida",
  "err.room_not_found": "essa sala não existe (ou expirou)",
  "lobby.house": "Regras da casa",
  "lobby.setupCubes": "Cubos iniciais (2 por jogador)",
  "lobby.penaltyCube": "Cubo de penalidade após um NÃO",
  "lobby.manualAnswers": "Jogadores respondem na mão (bots respondem sozinhos)",
  "game.answerAsk": "{name} perguntou: sua pista aceita {cell}?",
  "game.answerSearch": "{name} está procurando em {cell}. Sua pista aceita?",
  "game.yes": "SIM",
  "game.no": "NÃO",
  "game.waitingAnswer": "Esperando {name} responder sobre {cell}…",
  "game.answerStatus": "Responda: {cell}",
  "ev.question": "{name} perguntou a {target} sobre {cell}…",
  "ev.searchStart": "{name} está procurando em {cell}…",
  "rules.kiosk": "quiosque",
  "rules.tent": "barraca",
  "rules.house":
    "Regras da casa (opcionais no lobby): cubos iniciais, cubo de penalidade e resposta manual.",
  "err.answer_owed": "alguém ainda precisa responder",
  "err.nothing_to_answer": "não tem pergunta pra você responder",
  "err.wrong_answer": "sua pista diz o contrário, confere de novo",
  "err.internal": "deu ruim aqui dentro, tenta de novo",
} as const;

export type Key = keyof typeof pt;

const en: Record<Key, string> = {
  "home.tagline":
    "🏖️ A diamond is hidden on the beach. Everyone holds a clue. Who finds it first? 🔎",
  "home.name": "Your name",
  "home.namePh": "Player",
  "home.create": "Create room",
  "home.codePh": "CODE",
  "home.join": "Join",
  "home.tv": "Open as TV / big screen",
  "home.players": "2 to 5 players. Fill the table with bots if you like.",
  "home.codeLen": "the code has 4 letters",
  "home.createFail": "couldn't create the room",
  "lobby.room": "Room",
  "lobby.scan": "Point your camera to join",
  "lobby.tv": "TV / big screen",
  "lobby.players": "Players",
  "lobby.you": "(you)",
  "lobby.remove": "remove",
  "lobby.screens": "📺 {n} screen(s) connected",
  "lobby.addBot": "+ Bot",
  "lobby.hard": "Hard mode",
  "lobby.assist": "Deduction help",
  "assist.off": "None (hardcore)",
  "assist.normal": "Normal (notes + counts)",
  "assist.full": "Full (eliminates hexes)",
  "lobby.start": "Start",
  "lobby.need": "Needs {min} to {max} players",
  "lobby.waiting": "Waiting for the host to start…",
  "lobby.hardChip": "hard",
  "lobby.share": "Share link",
  "lobby.copied": "link copied!",
  "lobby.leave": "Leave room",
  "lobby.rename": "Change name",
  "lobby.renamePrompt": "Your name:",
  "game.cube": "Place a cube where your clue says NO",
  "game.setup": "Setup: tap a hex",
  "game.yourTurn": "Your turn! Tap a hex",
  "game.turnOf": "{name}'s turn",
  "game.over": "Game over",
  "game.yourClue": "Your clue",
  "game.yourClues": "Your clues",
  "game.noClue": "No clue (you're just watching).",
  "game.hint": "Tap a hex for details and to add notes.",
  "game.clearNotes": "clear notes",
  "game.hyps": "{name}: {n} possible clues",
  "game.possible": "{n} hex(es) still possible",
  "game.found": "{name} found the diamond!",
  "game.foundShort": "{name} found it!",
  "game.end": "Over",
  "game.wasAt": "It was at {cell}.",
  "game.hex": "Hex {cell}",
  "game.again": "Play again",
  "game.rules": "Rules",
  "game.sound": "Sound",
  "hex.nothing": "Nothing here yet.",
  "hex.territory": "Territory: {name}",
  "hex.ask": "Ask {name}",
  "hex.search": "🔎 Search here",
  "hex.cube": "Place cube here",
  "hex.cubeNo": "Your clue says YES here",
  "hex.mark": "✏️ mark",
  "hex.markX": "✕ marked · change",
  "hex.markQ": "? marked · clear",
  "hex.yes": "yes",
  "hex.no": "no",
  "hex.close": "close",
  "seat.you": "(you)",
  "seat.cubing": "placing a cube",
  "seat.answering": "answering",
  "seat.turn": "up now",
  "ev.found": "💎 {name} found the diamond at {cell}!",
  "ev.searched": "{name} searched {cell}",
  "ev.searchedNo": "{name} searched {cell}: {other} said NO",
  "ev.asked": "{name} asked {target} about {cell}: {answer}",
  "ev.yes": "YES",
  "ev.no": "NO",
  "ev.setup": "{name} placed a starting cube at {cell}",
  "ev.cube": "{name} placed a cube at {cell}",
  "tv.scan": "join as screen",
  "conn.connecting": "Connecting…",
  "conn.reconnecting": "Reconnecting…",
  "conn.oops": "Oops",
  "conn.back": "Back",
  "conn.lost": "lost connection to the room",
  "conn.cantJoin": "couldn't join the room",
  "player.default": "Player",
  "terrain.sea": "sea",
  "terrain.sand": "sand",
  "terrain.palms": "palms",
  "terrain.boardwalk": "boardwalk",
  "terrain.street": "street",
  "territory.gulls": "gulls",
  "territory.crabs": "crabs",
  "structure.kiosk": "kiosk",
  "structure.tent": "umbrella",
  "color.blue": "blue",
  "color.white": "white",
  "color.green": "green",
  "color.black": "black",
  "clue.terrain2": "The diamond is on {a} or {b}",
  "clue.terrain2.not": "The diamond is NOT on {a} nor {b}",
  "clue.nearTerrain": "The diamond is within 1 hex of {t}",
  "clue.nearTerrain.not": "The diamond is NOT within 1 hex of {t}",
  "clue.nearTerritory": "The diamond is within 1 hex of a territory (gulls or crabs)",
  "clue.nearTerritory.not": "The diamond is NOT within 1 hex of a territory (gulls or crabs)",
  "clue.near2Territory": "The diamond is within 2 hexes of {t}",
  "clue.near2Territory.not": "The diamond is NOT within 2 hexes of {t}",
  "clue.near2Structure": "The diamond is within 2 hexes of a {s}",
  "clue.near2Structure.not": "The diamond is NOT within 2 hexes of a {s}",
  "clue.near3Color": "The diamond is within 3 hexes of a {c} structure",
  "clue.near3Color.not": "The diamond is NOT within 3 hexes of a {c} structure",
  "rules.title": "Rules & taxonomy",
  "rules.how": "How to play",
  "rules.r1": "A diamond is hidden in one hex. Exactly one hex matches every clue at once.",
  "rules.r2":
    "Each player holds a secret clue{hard}. Setup: everyone places 2 cubes on hexes their own clue rejects.",
  "rules.r2hard": " (in hard mode it can be negative: “is NOT…”)",
  "rules.r3":
    "Ask: pick a hex and a player. They answer instantly: disc = their clue accepts the hex, cube = it rejects. If you get a cube, you place a cube of your own on a hex your clue rejects.",
  "rules.r4":
    "Search: pick a hex your clue accepts. Everyone answers in order. If all accept, you found it and win. The first cube stops the search and you pay a cube.",
  "rules.r5":
    "Disc = YES, cube = NO. Everything on the table is public. You can never search a hex with a cube.",
  "rules.terrains": "Terrains",
  "rules.territories": "Territories",
  "rules.dashed": "(dashed hexes)",
  "rules.structures": "Structures",
  "rules.oneEach": "Each color has exactly one kiosk and one umbrella.",
  "rules.blackHard": " Black only appears in hard mode.",
  "rules.clues": "Clue types",
  "rules.c1": "The diamond is on terrain A or terrain B (10 combos)",
  "rules.c2": "The diamond is within 1 hex of a terrain (5)",
  "rules.c3": "The diamond is within 1 hex of a territory, gulls or crabs (1)",
  "rules.c4": "The diamond is within 2 hexes of gulls / of crabs (2)",
  "rules.c5": "The diamond is within 2 hexes of a kiosk / of an umbrella (2)",
  "rules.c6": "The diamond is within 3 hexes of a blue / white / green{black} structure ({n})",
  "rules.c6black": " / black",
  "rules.c7": "In hard mode any clue above can be negated: “The diamond is NOT…”",
  "rules.tip": "Tip: “within N hexes” includes the hex itself. A sand hex is 0 away from sand.",
  "err.game_over": "the game is over",
  "err.invalid_seat": "invalid seat",
  "err.no_cube_owed": "you don't owe a cube right now",
  "err.already_marked": "you already marked that hex",
  "err.cube_needs_no": "the cube must go on a hex your clue rejects",
  "err.not_in_play": "the game isn't running",
  "err.cube_owed": "a cube still has to be placed",
  "err.not_your_turn": "not your turn",
  "err.invalid_target": "invalid player",
  "err.target_marked": "that player already marked that hex",
  "err.search_cubed": "you can't search a hex with a cube",
  "err.search_needs_yes": "you can only search a hex your clue accepts",
  "err.unknown_member": "you're not in this room",
  "err.rename_in_game": "you can't rename during a game",
  "err.host_only": "only the host can do that",
  "err.game_started": "the game already started",
  "err.room_full": "the room is full",
  "err.host_self_remove": "the host can't remove themselves",
  "err.need_players": "needs {min} to {max} players (have {have})",
  "err.not_finished": "the game isn't over yet",
  "err.no_game": "no game running",
  "err.not_seated": "you're not playing",
  "err.own_seat_only": "you can only act for your own seat",
  "err.malformed": "invalid message",
  "err.room_not_found": "that room doesn't exist (or expired)",
  "lobby.house": "House rules",
  "lobby.setupCubes": "Starting cubes (2 per player)",
  "lobby.penaltyCube": "Penalty cube after a NO",
  "lobby.manualAnswers": "Players answer by hand (bots answer on their own)",
  "game.answerAsk": "{name} asked: does your clue accept {cell}?",
  "game.answerSearch": "{name} is searching {cell}. Does your clue accept it?",
  "game.yes": "YES",
  "game.no": "NO",
  "game.waitingAnswer": "Waiting for {name} to answer about {cell}…",
  "game.answerStatus": "Answer: {cell}",
  "ev.question": "{name} asked {target} about {cell}…",
  "ev.searchStart": "{name} is searching {cell}…",
  "rules.kiosk": "kiosk",
  "rules.tent": "umbrella",
  "rules.house":
    "House rules (optional in the lobby): starting cubes, penalty cube and manual answers.",
  "err.answer_owed": "someone still has to answer",
  "err.nothing_to_answer": "there is no question for you to answer",
  "err.wrong_answer": "your clue says otherwise, check again",
  "err.internal": "something broke in here, try again",
};

const dict: Record<Lang, Record<Key, string>> = { pt, en };

/** Translate a key, substituting {params}. Reads the `lang` signal so components re-render. */
export function t(key: Key, params?: Record<string, string | number>): string {
  let s: string = dict[lang.value][key] ?? pt[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export const terrainName = (x: Terrain) => t(`terrain.${x}` as Key);
export const territoryName = (x: Territory) => t(`territory.${x}` as Key);
export const structureName = (x: StructureKind) => t(`structure.${x}` as Key);
export const colorName = (x: Color) => t(`color.${x}` as Key);

/** Human-readable clue in the current language. */
export function clueText(clue: Clue): string {
  const k = (base: string) => `${base}${clue.negate ? ".not" : ""}` as Key;
  switch (clue.kind) {
    case "terrain2":
      return t(k("clue.terrain2"), { a: terrainName(clue.a), b: terrainName(clue.b) });
    case "nearTerrain":
      return t(k("clue.nearTerrain"), { t: terrainName(clue.terrain) });
    case "nearTerritory":
      return t(k("clue.nearTerritory"));
    case "near2Territory":
      return t(k("clue.near2Territory"), { t: territoryName(clue.territory) });
    case "near2Structure":
      return t(k("clue.near2Structure"), { s: structureName(clue.structure) });
    case "near3Color":
      return t(k("clue.near3Color"), { c: colorName(clue.color) });
  }
}

export function errorText(code: ErrorCode, params?: Record<string, string | number>): string {
  return t(`err.${code}` as Key, params);
}

/** One-line narration of the latest meaningful event. */
export function describeEvents(events: GameEvent[], game: GameView): string | null {
  const name = (seat: number) => game.seats[seat]?.name ?? `${t("player.default")} ${seat + 1}`;
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i] as GameEvent;
    switch (e.type) {
      case "found":
        return t("ev.found", { name: name(e.seat), cell: cellLabel(e.cell) });
      case "question":
        return t("ev.question", {
          name: name(e.seat),
          target: name(e.target),
          cell: cellLabel(e.cell),
        });
      case "searchStart":
        if (events.some((x) => x.type === "searched")) break;
        return t("ev.searchStart", { name: name(e.seat), cell: cellLabel(e.cell) });
      case "searched":
        return e.stoppedBy === null
          ? t("ev.searched", { name: name(e.seat), cell: cellLabel(e.cell) })
          : t("ev.searchedNo", {
              name: name(e.seat),
              cell: cellLabel(e.cell),
              other: name(e.stoppedBy),
            });
      case "asked":
        return t("ev.asked", {
          name: name(e.seat),
          target: name(e.target),
          cell: cellLabel(e.cell),
          answer: e.yes ? t("ev.yes") : t("ev.no"),
        });
      case "marker":
        if (e.by === "setup")
          return t("ev.setup", { name: name(e.marker.seat), cell: cellLabel(e.marker.cell) });
        if (e.by === "penalty")
          return t("ev.cube", { name: name(e.marker.seat), cell: cellLabel(e.marker.cell) });
        break;
      default:
        break;
    }
  }
  return null;
}
