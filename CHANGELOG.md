# Changelog

## 1.0.1 (2026-11-16)

- The branch chip shows the branch of the project Claude works in, also in a workspace of several
  projects, where the pane's own folder is no repository. As a status line of Claude Code's own does,
  it follows Claude into the folder it moves to.

## 1.0.0 (2026-11-14)

- First version: chips in a Claude chat's message box row for the branch, lines changed, usage limits
  and cost, and how long the session has run; capture the phone's screen or snip this one into the
  message; tidy the draft with Claude, and undo it. A band over the box shows more for each.
- Cost is a chip of its own, beside the usage limit, each with its own switch.
- Where the figures and the buttons sit, each at either end of the row (a Deck after 1.17.4 with ChatChipsEnd).
- Settings, on its page of Deck's Settings: which chips show, the usage limit shown, the model a tidy uses, and how long captures are kept.
- The capture, snip and tidy buttons moved to a plugin of their own, Claude tools. The chips sit at the
  right end of the row by default.
- A prompt cache chip: how long the session's cache stays warm (amber under 10 minutes, red under 3), then
  "Cold". Its tooltip says how many tokens the next message would send again at full price.
- The chips can sit on a line of their own above the message box, at its right (Where the chips sit).
