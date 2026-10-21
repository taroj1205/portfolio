# Game titles and hashtags

A game's title and its hashtags are its identity on X, so neither is the bare word for the thing. 間, 居合 and 餅つき are everyday words, and posts about the real thing bury ours.

## Choosing a title

- Give the game a title only it would have, in Japanese and English: 無音の十秒 / Ten Silent Seconds, 鞘走り / Sayabashiri, 半分こ道場 / Halving Dojo. Build it from what the player does or feels, or coin a word. A coined word may come from the genre, as 消しボウ / Keshibo shortens 消しゴムボウリング; the bare genre word may not.
- Coin or reword it so a search for the title finds our game. A title made of one common word is not enough. Before settling on one, search the exact title on the web and look at what the search engine corrects it to: if it turns into a well-known work, pick another (放課後ストライク came back as the song 放課後ストライド). Keep a title that already passes instead of trading it for a longer one.
- Keep 星合 and 天の川水切り as they are. They already work.
- Add the romanised name of a new title to `words` in `cspell.json`.

## Hashtags

- Share text ends with `#<日本語タイトル>` in Japanese, and that plus `#<EnglishTitleInCamelCase>` in English (`#鞘走り #Sayabashiri`, `#無音の十秒 #TenSilentSeconds`). Drop a leading article and a possessive when keeping them makes the tag clumsy (`#EmberLife` for An Ember's Life).
- If the title is still a common phrase, make the tag more specific, as 餅つきマスター uses `#ぺったんマスター #PettanMaster`. When a Japanese title is only a bare word, add `ゲーム` (`#星合ゲーム`).
- Every share text for the game carries the same tags: the result, the stats card and any helper such as 星合's `hashtags` in `_lib/result.ts`. No two games share a tag.
- Nobody owns a hashtag and X can't be searched from a script. Before a new tag ships, search it on X's Latest tab and swap it if the results are mostly unrelated posts. Say in the PR that you did or did not check.

## Where a title lives

Read the title from `copy` instead of typing the kanji again.

- `_lib/copy.ts`: `name` in both languages. 餅つきマスター and 息止め型抜き also keep a `reading`.
- `_components/hud.tsx`: the `<h1 lang="ja">` shows `copy.ja.name` with its kana reading above it.
- `og/route.tsx`: the header row, the pitch headline, and the glyph string passed to `loadMincho`. Build that string from `copy`, because a glyph missing from it renders as a box.
- `_lib/result.ts`: the first line of the share text, in both languages.
- The tests that compare share text exactly.

Prose that names the real thing (a rule that says "型抜きを針で抜く") stays as it is. The red seals on the OG art (円相, 一刀) are part of the picture, not the title.

## Check the layout

A longer title breaks layouts the old one fit in. Check these at 390px wide and in both languages:

- The HUD header: the title must not wrap and must not squeeze or push off the corner buttons. Use `whiteSpace: "nowrap"`, put the reading above the title in a column, and size the font to fit. When something else sits in the header (円相's best score), move it to its own row.
- The OG image with no result: the headline there is the game's name at a large size. Size it per language so it stays on one or two lines.
- The OG image with a result, and the games list card.
