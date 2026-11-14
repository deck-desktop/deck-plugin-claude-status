# Claude status

Puts what Claude Code knows about a session beside a Claude chat's message box in Deck, as chips you
can click:

- **The branch** of the folder Claude runs in. Click it to switch to a recent branch, or to ask Claude
  to commit.
- **Lines changed** in the session (+ and −). Click it to ask Claude to review or commit them.
- **Usage**: how much of the five-hour limit is used, and what the session has cost. Click it for the
  weekly limit and when each resets.
- **How long** the session has run. Click it to copy the command that resumes it.

Beside them:

- **Capture the phone's screen** (over adb) or **snip part of this one**, into the message. Recent
  captures are a click away for a day, then deleted. They are kept in the plugin's own folder, never
  in your Screenshots.
- **Tidy the draft**: Claude (Sonnet) rewrites what you have typed into a clear request, keeping every
  detail and adding nothing; it is not sent. Undo puts your draft back.

The figures come from Claude Code's status line, which Deck installs with its hooks for Claude Code, so
they appear once a session has updated.

## Developing

```sh
npm run dev   # rebuild as you edit; each save shows in your test Deck
npm test      # how the chips write the figures
```

Needs a Deck with chat plugins (after 1.17.4). Permissions: `chat`, `processes` (git, adb, PowerShell,
claude) and `files` (its captures).
