# How to keep improving Devasarvam from a browser

This is for editing the codebase from any browser, no local dev tools needed. It works on a Chromebook, on a phone, or any laptop with internet.

## The 30-second version

1. Open https://claude.ai/code (sign in).
2. Pick this repo from the project list.
3. Tell Claude what you want, in plain English. Examples:
   - "Add a new vazhipadu called Maha Mrityunjaya Homam, ₹1001, area Homakundam, ingredients are Coconut 7, Ghee 0.5kg, Camphor 0.05kg."
   - "The Camphor unit cost went up to ₹950, please update."
   - "Add 5 new retail items from this list: ..." (paste the list).
4. Claude opens a pull request with the change.
5. Vercel posts a **preview URL** on the PR within ~1 minute. Click it, verify the change looks right.
6. If it's good, merge the PR. The change goes live in another minute.

That's it. No installing Node, no terminal, no Git knowledge required beyond clicking "Merge".

## Useful slash commands inside Claude

Once you're chatting with Claude in claude.ai/code on this repo, these shortcuts give Claude the right context faster:

- `/add-vazhipadu` — add a new pooja to the catalog
- `/add-inventory-item` — add a new consumable (camphor, flowers, etc.)
- `/add-retail-item` — add a new counter-sale product

Just type the command, then describe what you want. Claude will ask for any missing info (Malayalam name, etc.) and make the edit.

## What to do when Claude gets it wrong

- The PR's preview URL is always safe to test — it can't break the live site.
- If the preview looks broken: tell Claude *what* is broken ("the new vazhipadu shows ₹501 instead of ₹1001") and it'll push a fix to the same PR.
- If you're not sure: don't merge. Ask Nipun.

## Things you can't do from claude.ai/code (yet)

- Anything that needs the Supabase database password / service-role key. Schema migrations, manual data fixes in production — those go through Nipun.
- Hardware setup (printers, network) — those need someone physically at the temple.

## Rolling back

Every change is a separate commit on `main`. If something goes wrong after merge:

1. On GitHub, find the commit (the merge commit of the PR).
2. Click "Revert" — it opens a new PR that undoes the change.
3. Merge the revert PR. Live site is back within a minute.
