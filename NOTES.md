# UniCook: design notes

## The idea
On UniCook, the name-taped shelf of a shared dorm fridge is the main design device. Ingredients are
strips of masking tape with handwriting on them. Recipes print out as receipts that list only what
you're missing. A recipe you can fully make gets a READY stamp.

## Decisions (CEO approved the plan on 2026-10-27; "Auto" fields decided by Claude)
- Playfulness: **4** (the CEO raised it from 3). This means bold color fields per screen, chunky
  pressable buttons, tilted tape, a stamp that lands, a "Surprise me" picker and playful empty states.
- Motion: one signature moment, the READY stamp. Small extras: tape sticks on, peels off, receipts
  slide when they reshuffle, the like button pops. All of it is turned off under reduced motion.
- Dark ground (kitchen at night), because the user is "hungry at night."
- Palette (changed 2026-10-27 to UMass Amherst colors, at the CEO's request): UMass Maroon #840028
  for the big fields, UMass Black #212721 ground, UMass grays #373A36 / #505759 / #A2AAAD, UMass Yellow
  #FFC72C as the accent. Values taken from umass.edu/brand (maroon refined July 2026). Tape #E9DDB5,
  paper #F7F5EE, ink #1C1C1C and the green READY stamp stay.
- Type: Archivo (condensed width for headings), Permanent Marker on tape only. Sizes 14/16/20/32/56.
- Screens: Fridge, Cook, List, Feed, Import, Me. Bottom tabs on phones, top tabs on desktop.
- Photo input, video import and sign-in are honest demos (see README). Field 11 of the brief was
  treated as blank.
- Most site text is Claude's wording. Lines from the brain dump are used where they fit. The CEO
  should edit the copy.

## Later (not built)
Rewards/points, real accounts, a shared feed other students can see
(Supabase), real photo scanning and video import (server + AI), Claude as a live "personal chef."

## Changelog
- 2026-10-27: First version built and checked at 390, 768 and 1440 px.
  - Fixed the READY stamp overlapping the time.
  - Fixed tape labels that disappeared on tape-colored feed cards.
  - Fixed long names widening the page on phones.
- 2026-10-27 (round 2): UMass maroon color scheme. Added the CEO's three ideas:
  - Floating "N ready to cook" badge on phones; tap scrolls to the recipes; hides once they're on screen.
  - Grocery list tab: pick meals (or "Add to grocery list" in any recipe), get one merged list of
    missing items, check them off, and put checked items straight into the fridge.
  - Post a dish to the feed (needs a kitchen card); "Share it to the feed" after cooking. Saved on
    this device only, labeled as yours, deletable.
- 2026-10-27 (round 3, design review): checked at 390/768/1440 with the real fonts loaded. Fixed:
  - Phone first screen showed no tape or recipe: bands made compact, photo/sample on one row,
    quick-add chips on one sideways-scrolling row. First shelf now visible on load.
  - Desktop bands were mostly empty: headline and line now side by side, about half the height.
  - Recipe dialog on phones: Close bar now sticks to the top; cook panel is about half as tall.
  - Info tags looked like buttons: now square, filled, no outline (round = clickable).
  - Inputs, chips and checkboxes had faint 2:1 outlines: now light gray, above 3:1.
- 2026-10-27 (round 4, Feed): like button is now a thumbs-up icon (Lucide, inline SVG) with the count;
  liking flicks the thumb up and floats a "+1" (still under reduced motion). Added a comment section on
  every post: "Comments N" opens it; demo comments on 3 demo posts; your comments need a kitchen card,
  are saved on this device only, and show your name in maroon. Likes and comments now update in place,
  so typing in one comment box is never wiped by a like elsewhere.
- 2026-10-27 (round 5, Me): "Have something else? Add it" box under the appliance list. Typed
  appliances (e.g. Crockpot) appear as dashed checkboxes, save to the kitchen card, and show as tags.
  Duplicates of an existing appliance just tick it. Enter adds the appliance instead of saving the
  card. The demo recipes only use the 8 built-in appliances, so custom ones don't unlock recipes yet.
- 2026-10-27 (round 6, Cook + Feed): one shared filter set with labeled rows: Level (any/easy/medium/
  hard), Time (10/20/45 min or less) and new Ingredients (3/4/5 or fewer). Set it on either screen and
  the other follows. Each screen shows "Showing X of Y" and a "Clear filters" button when any filter is
  on. Phones: each row swipes sideways; desktop: label on the left, one line per filter.
- 2026-10-27 (round 7, Me + recipes): "Your spice rack" section on Me (works with or without a kitchen
  card): 14 preset seasonings to tap, plus "Add your own". All 15 recipes now list their seasonings,
  and every step text says when to add them. The recipe view shows each seasoning as solid (in your
  rack) or dashed (not in your rack). Seasonings never block READY; "assumed" is now just oil and water.
