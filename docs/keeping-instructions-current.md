# Keeping instructions current

`AGENTS.md` and `docs/` are working notes that should get better every time an agent loses time. Update them in the same change as the work, without waiting to be asked.

## When to update

- You guessed an API, path, command, or convention wrong and had to correct it.
- You searched or read several files for something a single line in these notes would have answered.
- A failure took more than one attempt to understand, such as a check that only passes after a setup step.
- The user corrected you, or you found an instruction that is wrong, stale, or points at a file that moved.

## How

- Fix the existing line instead of adding a second one that contradicts it. Delete lines that are no longer true.
- Write the fact and the fix in one or two lines: what to do, where, and the command or path. Skip the story of how you found out.
- Keep `AGENTS.md` to short pointers that say when to read a file. Put rules, detail, and examples in `docs/`, and link any new doc from `AGENTS.md` with the situation that should make an agent open it.
- Only record things that stay true across tasks. Leave out one-off details, task status, and anything the code or git history already shows.
- Say in your final message which instruction lines you changed and why.
