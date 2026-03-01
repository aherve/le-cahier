import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from 'chess.js';

// ── Hardcoded placeholders ──────────────────────────────────────────
const LICHESS_USERNAME = 'MaximeCaVaChierGrave';
const USER_ID = '6480f506-e51e-49a4-ad51-f2ccb3b70c92';
// ────────────────────────────────────────────────────────────────────

const TABLE_NAME = 'le-cahier-positions';
const dynamo = new DynamoDB({ region: 'eu-west-1' });

function stripFEN(fen) {
  return fen.split(' ').slice(0, 4).join(' ');
}

// ── Position cache ──────────────────────────────────────────────────
const positionCache = new Map();

async function getPosition(fen, userId) {
  const key = stripFEN(fen);
  const cacheKey = `${key}|${userId}`;
  if (positionCache.has(cacheKey)) return positionCache.get(cacheKey);

  const data = await dynamo.getItem({
    TableName: TABLE_NAME,
    Key: marshall({ fen: key, userId }),
  });

  const result = data.Item ? unmarshall(data.Item) : null;
  positionCache.set(cacheKey, result);
  return result;
}

// ── Fetch games from Lichess ────────────────────────────────────────
async function fetchGames(username, max = 100) {
  const url = `https://lichess.org/api/games/user/${username}?max=${max}&rated=true&perfType=rapid,classical,blitz&opening=true`;
  const res = await fetch(url, {
    headers: { Accept: 'application/x-ndjson' },
  });
  if (!res.ok) throw new Error(`Lichess API ${res.status}: ${res.statusText}`);

  const text = await res.text();
  return text
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

// ── Walk a single game ──────────────────────────────────────────────
async function findFirstDeviation(game, username, userId) {
  if (!game.moves || game.moves.trim() === '') return null;

  const playerIsWhite =
    game.players?.white?.user?.id?.toLowerCase() === username.toLowerCase();

  const chess = new Chess();
  const moves = game.moves.split(' ');

  for (let i = 0; i < moves.length; i++) {
    const fenBefore = chess.fen();
    const isWhiteTurn = chess.turn() === 'w';
    const isPlayerTurn =
      (isWhiteTurn && playerIsWhite) || (!isWhiteTurn && !playerIsWhite);

    const made = chess.move(moves[i]);
    if (!made) return null; // broken move list

    const position = await getPosition(fenBefore, userId);

    if (isPlayerTurn) {
      // Player's move — check bookMoves
      if (
        !position ||
        !position.bookMoves ||
        !(made.lan in position.bookMoves)
      ) {
        // Player deviated first → skip game
        return null;
      }
    } else {
      // Opponent's move — check opponentMoves
      if (
        !position ||
        !position.opponentMoves ||
        !(made.lan in position.opponentMoves)
      ) {
        // Opponent deviated. Check if the *resulting* position has bookMoves
        const resultingPosition = await getPosition(chess.fen(), userId);
        if (
          resultingPosition &&
          resultingPosition.bookMoves &&
          Object.keys(resultingPosition.bookMoves).length > 0
        ) {
          // We have a response for this position — it's covered via transposition
          continue;
        }
        // First opponent deviation — this is a hole
        return {
          resultFen: stripFEN(chess.fen()),
          fullResultFen: chess.fen(),
          parentFen: stripFEN(fenBefore),
          san: made.san,
          playerSide: playerIsWhite ? 'white' : 'black',
        };
      }
    }
  }

  return null; // fully in book
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log(`Fetching games for ${LICHESS_USERNAME}...`);
  const games = await fetchGames(LICHESS_USERNAME);
  console.log(`Fetched ${games.length} games. Analyzing...\n`);

  // resultFen → { count, san, parentFen }
  const holes = new Map();

  for (const game of games) {
    const deviation = await findFirstDeviation(game, LICHESS_USERNAME, USER_ID);
    if (!deviation) continue;

    const entry = holes.get(deviation.resultFen) || {
      count: 0,
      san: deviation.san,
      parentFen: deviation.parentFen,
      fullResultFen: deviation.fullResultFen,
      playerSide: deviation.playerSide,
    };
    entry.count++;
    holes.set(deviation.resultFen, entry);
  }

  // Filter 2+ and sort descending
  const sorted = [...holes.entries()]
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count);

  if (sorted.length === 0) {
    console.log('No repertoire holes found with 2+ occurrences.');
    return;
  }

  const LE_CAHIER_URL = 'https://le-cahier.fly.dev';

  console.log('=== Repertoire Holes (positions with 2+ occurrences) ===\n');
  for (const [resultFen, { count, san, parentFen, fullResultFen, playerSide }] of sorted) {
    const side = playerSide === 'white' ? '♔ as white' : '♚ as black';
    const lichessColor = playerSide;
    const lichessUrl = `https://lichess.org/analysis/${encodeURI(fullResultFen)}?color=${lichessColor}`;
    const cahierUrl = `${LE_CAHIER_URL}/explore?fen=${encodeURIComponent(parentFen)}`;
    console.log(`[${count} games] ${san}  (${side})`);
    console.log(`  After:    ${parentFen}`);
    console.log(`  Lichess:  ${lichessUrl}`);
    console.log(`  Le Cahier: ${cahierUrl}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
