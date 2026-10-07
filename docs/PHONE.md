# Using a gamify-learn game on a phone

A built game is **one HTML file** with fonts, pictures and code inside. It needs no internet and no app. The layout is responsive (since v1.2): on a phone it becomes one column, buttons are thumb-sized, and the red button at the bottom does the work of the space bar.

**What was tested.** Every screen of the sample courses was opened in a phone *emulator* (Chrome headless at 390 x 844, 360 and 320 px wide, touch on, iPhone user agent) and checked for sideways overflow. That is emulation, not a real iPhone or Android phone. The steps below are the standard ways to open a local HTML file on each system; if one does not work on your device, use the next one.

## The three ways, easiest first

| Way | iPhone | Android | Needs internet | Works offline later |
|---|---|---|---|---|
| **A. Put it on a web address** | yes | yes | to open the first time | yes, after Add to Home Screen |
| **B. Open the file you copied to the phone** | with a free file-viewer app | with Chrome | no | yes |
| **C. Read the PDF edition** (no sliders) | yes | yes | no | yes |

---

## iPhone (iOS 15 or newer)

### A. Web address, then a Home Screen icon (recommended)

1. Put the game file on any static web host you control. Free options: **GitHub Pages**, **Netlify Drop** (drag the file onto netlify.com/drop), **Cloudflare Pages**. Keep it **private** if it contains someone else's copyrighted material (use a password-protected or unlisted host).
2. On the iPhone open **Safari** and type the address.
3. Tap the **Share** button (square with an arrow).
4. Scroll and tap **Add to Home Screen**, then **Add**.
5. Open the new icon. The game runs full-screen, like an app, and works without internet from then on.

### B. File sent to the phone

iOS Safari cannot open a file from storage by itself, and the built-in file preview may not run the game's code. Use a free file viewer that has its own browser:

1. Get the `.html` onto the phone: **AirDrop** it, save it to **iCloud Drive**, or attach it to an email and tap **Save to Files**.
2. Install **Documents by Readdle** (free, App Store).
3. In the **Files** app tap the game file, tap **Share**, choose **Documents** (or copy it into Documents from inside the app).
4. In Documents, tap the file. It opens in the app's built-in browser and the game runs.

(Not tested on a physical iPhone. If the file only shows as plain text, the app opened it in a text viewer: choose "Open in browser" or use way A.)

### C. PDF edition

AirDrop or save the `.pdf` to Files and tap it. Every page is phone-sized (9:16). Slide-style: pictures, worked answers, quizzes and the glossary, but sliders and quizzes are not interactive.

---

## Android

### A. Web address, then an app icon

1. Host the file as above.
2. Open **Chrome** and go to the address.
3. Tap the **three dots** menu, then **Add to Home screen** (or **Install app**), then confirm.

### B. File on the phone

1. Send the `.html` to the phone: USB, Google Drive, email attachment or any file-sharing app. It lands in **Downloads**.
2. Open **Files by Google** (or your phone's Files app), open **Downloads**, tap the `.html`.
3. Choose **Chrome** if asked "Open with". The game opens and runs.
4. If it opens as text, long-press the file, **Open with**, **Chrome**.

### C. PDF edition

Tap the `.pdf`; any PDF reader works.

---

## Using it once it is open

| Do this | To |
|---|---|
| Tap the big red **REVEAL / NEXT** button | show the next piece, then go on |
| Swipe **left** | same as REVEAL / NEXT |
| Swipe **right** or tap **BACK** | go back one screen |
| Tap an answer | answer a quiz question (your first try counts) |
| Drag a slider | change a lab's number and watch the picture |
| **MENU** | calm mode (no motion or sound), sound, export / import progress |
| **GLOSS** | glossary of every term and symbol |

Tips for a small screen:

- Turn the phone **sideways** for wide pictures (flow charts, networks, tables).
- A staged picture builds one step per press; read the numbered notes under it as they appear.
- Turn on **Calm mode** in MENU if animations are distracting.
- Set the phone to **Do Not Disturb** and use the built-in timer (the TIMER button) for 15-minute rounds.

## Saving progress

Progress (XP, answered questions, flashcard dates) is saved **inside the browser or app that opened the game**. Opening the same file in another app or browser starts fresh, and clearing site data erases it. To move progress: **MENU, Export** in one place and **Import** in the other. A Home Screen icon (way A) keeps its own saved progress.

## If something looks wrong

- **Page is wider than the screen / zoomed out:** reload; if it persists, note the phone model and the screen title (the counter at the bottom shows the screen number, like `11/32`).
- **Blank or text-only page:** the app is not running scripts. Use another way above.
- **Pictures look tiny:** turn the phone sideways, or pinch to zoom.
- **Developer check:** `python skills/gamify-learn/scripts/mobile_test.py game.html --w 390` (needs `pip install websocket-client` and Chrome or Edge) lists any screen that becomes wider than the phone.
