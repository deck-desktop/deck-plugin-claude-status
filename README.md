# Claude status

Puts what Claude Code knows about a session beside a Claude chat's message box in Deck, as chips you
can click:

- **The branch** of the folder Claude runs in. Click it to switch to a recent branch, or to ask Claude
  to commit.
- **Lines changed** in the session (+ and −). Click it to ask Claude to review or commit them.
- **Usage**: how much of the five-hour (or weekly) limit is used. Click it for both limits and when
  each resets.
- **Cost**: what the session has cost so far.
- **How long** the session has run. Click it to copy the command that resumes it.
- **Prompt cache**: how long the session's cache stays warm. Once it runs out ("Cold"), your next message
  sends the whole context again at full price, so a long session costs more to pick up again.

Settings choose which chips show, where they sit (either end of the box's row, or a line above the box), and which limit the usage chip
shows. The buttons that used to sit beside them (captures and tidy) are the Claude tools plugin now.

The figures come from Claude Code's status line, which Deck installs with its hooks for Claude Code, so
they appear once a session has updated.

## Developing

```sh
npm run dev   # rebuild as you edit; each save shows in your test Deck
npm test      # how the chips write the figures
```

Needs a Deck with chat plugins (after 1.17.4). Permissions: `chat` and `processes` (git).
