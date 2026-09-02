# 🔗 Connect your GitHub brain to MemTrant (noob-friendly guide)

MemTrant can store all your memories in **your own private GitHub repo**.
You own the data. You can see every change. Here's how to set it up — takes ~3 minutes.

---

## Step 1 — Create your private repo 📓

1. Click this exact link: **[github.com/new](https://github.com/new)** — this is GitHub's "create a new repository" page (you must be logged in to GitHub).
2. Fill in just two things:
   - **Repository name:** `my-membox-brain` (or any name you like)
   - **Visibility:** select **Private** 🔒 (important — don't leave it Public!)
3. Leave everything else alone. Click the green **Create repository** button.
4. Done. You do NOT need to add a README or any files.

✅ Checkpoint: you should now see a page that says **Quick setup** with your repo name at the top.

---

## Step 2 — Create your access token 🔑

The token is like a temporary key that lets MemTrant write to **only this one repo** — nothing else in your GitHub.

### Easiest way (Classic token, pre-configured link)

1. Click this exact link: **[github.com/settings/tokens/new?scopes=repo&description=MemTrant%20Brain](https://github.com/settings/tokens/new?scopes=repo&description=MemTrant%20Brain)**
   - It opens GitHub's "New personal access token" page with the right **`repo`** box already checked and the note pre-filled as "MemTrant Brain".
2. Set **Expiration** to **90 days** (or No expiration if you never want to redo this).
3. Scroll down, click the green **Generate token** button.
4. You'll see a token starting with `ghp_…`. Click the **copy icon** 📋 next to it.

> ⚠️ **This is the only time you'll ever see the token.** Copy it now. If you lose it, just generate a new one — no harm done.

### Safer way (Fine-grained token, limits access to only your brain repo)

1. Click: **[github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)**
2. **Token name:** `MemTrant Brain`
3. **Expiration:** 90 days
4. Under **Repository access**, choose **"Only select repositories"** → pick `my-membox-brain` from the dropdown.
5. Scroll to **Permissions** → under **Repository permissions**, find **Contents** → set it to **Read and write**.
   - Everything else stays "No access". MemTrant only needs to read and write files.
6. Click **Generate token**, then copy the token (starts with `github_pat_…`).

---

## Step 3 — Pair it with MemTrant 🧠

1. Open MemTrant → **Settings**
2. Paste your token into the **GitHub Token** field
3. Type your repo name: `your-github-username/my-membox-brain`
4. Click **Connect** — you should see a green **🟢 Synced** badge

That's it! Every memory you save now lives in **your** repo, and you can watch the commits appear in real time on your repo's page: `https://github.com/YOUR-USERNAME/my-membox-brain/commits`

---

## ❓ Troubleshooting

| Problem | Fix |
|---|---|
| "Bad credentials" | Token was copied wrong or expired → generate a new one (Step 2) |
| "Not Found" on connect | Repo name must be `username/repo-name` — check spelling |
| "Resource not accessible" | Fine-grained token missing **Contents: Read and write** permission |
| I leaked my token somewhere | Don't panic — go to [github.com/settings/tokens](https://github.com/settings/tokens), click the token, **Revoke**, then make a new one |
