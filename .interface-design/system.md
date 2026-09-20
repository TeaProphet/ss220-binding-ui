# SS220 Binding interface system

## Direction and feel

SS220 Binding is a compact, local desktop workbench for an SS14 player preparing character-specific chat, emote, and system bindings. It should feel like a native station terminal: dense, direct, technical, and legible rather than decorative. A dedicated smartphone version is outside the product scope; narrow-layout rules are defensive safeguards, not a separate mobile design target.

The primary workflow is chat and emotes. In the binding modal, message content and the recorded shortcut are the focal controls. System remapping is advanced and stays behind the explicit `Переназначить системный бинд` toggle.

Binding inheritance is `Для всех` → character → position. User-facing Russian copy uses `Должность` consistently, while internal identifiers stay unchanged for data compatibility. Always use concrete labels such as `Общие бинды`, `Бинды персонажа`, and `Бинды должности`. The `Для всех` entry appears only as the group-icon item in the sidebar; the upper tab strip is reserved for the character and its positions.

## Domain language

- Character dossier
- Position (`Должность` in user-facing copy)
- Binding set
- Chat command
- Emote
- Physical key combination
- System action
- Apply to game

## Visual signature

The signature is the SS14/TGUI-like framed workbench: blue title bars, inset dark controls, pixel-art position portraits, physical-looking keycaps, and a subdued SS14 loading-menu-inspired starfield behind the workspace. Reuse this language in new editor surfaces.

Avoid generic floating white cards, oversized marketing headings, pill-heavy navigation, gradients used only as decoration, and unrelated accent colors.

## Color and depth

- Canvas: the bundled `/assets/station-starfield.png` under dark linear and radial overlays. Keep it fixed, cover the viewport, and preserve strong text and panel contrast; do not replace it with a generic CSS star pattern.
- Primary panels: charcoal with small lightness steps.
- Title bars and selected tabs: muted station blue.
- Primary action: blue; destructive action: restrained red; success: muted green.
- Text hierarchy: near-white primary, blue-gray supporting, gray metadata, subdued disabled.
- Depth strategy: quiet borders and inset/outset edges, with restrained shadows only for overlays and the fixed action dock.
- Keep borders low-contrast except for focus, selection, warning, or conflict states.

Use existing CSS variables and component colors before adding tokens. New colors must have a semantic role and harmonize with the TGUI palette.

## Typography

- Interface/body: the existing system sans-serif stack.
- Window titles and major headings: Verdana bold, matching the current TGUI character.
- Engine identifiers and key labels: Consolas/monospace.
- Prefer weight and text color over small, arbitrary font-size changes.
- Keep dynamic counts and identifiers compact; use tabular numerals where changing numbers could shift layout.

## Spacing and geometry

- Base spacing unit: 4 px.
- Dense controls: 8–12 px internal gaps and padding.
- Forms and modal sections: 16–20 px separation.
- Controls: 4 px radius; windows and overlays: 5–6 px radius.
- Interactive targets should be at least 40 px where layout permits.
- Design and verify primarily for desktop use. Existing narrow-width fallbacks should prevent clipping and horizontal overflow, but do not grow the interface into a separate smartphone workflow.

## Reusable patterns

- Primary button: 36 px minimum height, 14 px horizontal padding, 4 px radius, 12 px/600 text, blue gradient and light border.
- Standard field: 36 px height, 11 px horizontal padding, inset dark surface, 4 px radius, visible blue focus ring.
- Binding row: 52 px minimum height, compact action name + engine metadata, right-aligned physical keycaps.
- Keycap: 25 px height, 28 px minimum width, monospace 11 px/600, dark raised surface.
- Modal: sticky blue title bar, scrollable dark body, separated action footer; must fit inside the viewport.
- Mode toggle: full-width 58 px minimum row with a 36×20 px switch, bold title, and explanatory secondary line. It is a secondary mode control, not the main call to action.
- Shortcut capture: inset panel containing state label, current combination or `Не назначено`, and an explicit recording button.
- Native button titles: every button exposes a non-empty `title`. Prefer an explicit Russian `aria-label` for icon-only controls; otherwise derive the title from rendered `innerText`, normalize whitespace, and keep it synchronized when the label changes. Two-line labels must retain a space between their primary and secondary text, for example `Системные бинды справочник игры`.
- Shutdown control: a subdued destructive row at the bottom of the sidebar, separated from navigation. Confirm before stopping; after success, replace interaction with a full-screen stopped state and relaunch guidance.
- Character import action: an upload icon beside the add-character control in the `ПЕРСОНАЖИ` sidebar heading. Keep import and manual creation visually equal as secondary profile-management actions.
- Batch character import modal: a desktop-first wide terminal dialog with one inset multi-file drop zone, followed by compact dossier rows containing selection, race portrait, character name, mapped race, and import status. The drop zone must support both the native file picker and drag-and-drop through the same processing path. While files hover over it, use the station-blue highlighted state and the text `Отпустите файлы здесь`. Preselect valid new profiles; disable existing or repeated names and label them `Уже добавлен` rather than overwriting them.
- Character import scope: accept character files exported from the game and import only the character name and mapped race. Preserve every existing binding and game preference. Keep user-facing instructions short and plain: say to choose or drag exported character files; do not expose file formats, versions, extensions, YAML, or parser terminology. Show unreadable files inline, and map unknown species to `Человек` with a visible warning before confirmation.
- Character position tabs: represent the character bindings and each `Должность` as compact framed tabs above the binding window. The active tab uses the station-blue selected state but must not create a downward `button::after` bridge or protrusion; the tab border itself is the complete selection shape.
- Fixed action dock: on desktop, center the dock within the workspace remaining to the right of the sidebar, not within the full viewport. Use the sidebar as the fixed left boundary and the viewport edge as the right boundary so automatic inline margins produce the correct center; retain the existing viewport-edge layout at collapsed-sidebar breakpoints.

## Interaction states

- Every control needs default, hover, active, focus-visible, and disabled states.
- New bindings show `Не назначено`; never invent a default key.
- Saving without a message/action or physical key shows a specific inline error.
- Existing chat commands matching `me`, `say`, or `whisper` reopen in the simple chat editor.
- Existing non-chat bindings reopen with system remapping enabled.
- Motion stays below 200 ms, animates only transform/opacity/color, and respects `prefers-reduced-motion`.

## Accessibility and responsive checks

- Use native buttons, labels, inputs, selects, and checkboxes.
- Preserve modal focus trap, Escape close, focus return, semantic dialog labeling, and visible focus.
- Do not rely on color alone for selected, error, or conflict states.
- Keep narrow-width safeguards accessible and free of horizontal overflow, but visual acceptance is desktop-first because the application is not intended for smartphone use.
- Verify non-trivial changes at representative desktop widths, including the sidebar-adjusted center of the fixed action dock.
