This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### 📄 `IMPORTANT : Instructions for collaborators`


# micSQL

Welcome to the micSQL project! 🎉

This repository follows a branch-based collaboration model. Each contributor works on their **own branch(your name)** and rebases their work onto `main` before merging.
You can find your branch name in the branch section of this github repo.

---

## 🚀 Getting Started

### 1. Clone the Repository

> Make sure your GitHub SSH key is set up and added to your GitHub account.

```bash
git clone git@github.com:Shishir-Hegde/micSQL.git
cd micSQL
```

---

### 2. Checkout Your Feature Branch

Each collaborator has a separate branch to work on.

```bash
git checkout <your-branch-name>
```

Replace `your-branch-name` with the branch assigned to you  
(e.g., `rahul`, `jayant`, `tejas`, `shishir` , etc.)

---

## 🔨 Working on Your Branch

### Make and Commit Your Changes

```bash
# Make changes to the code
git add .
git commit -m "Your meaningful commit message"
```

### Push Your Changes

```bash
git push -u origin <your-branch-name>
```

---

## 🔄 Rebasing with `main` (Before Merging)

To ensure your work is up to date with the latest `main`:

```bash
git checkout your-branch-name
git fetch origin
git rebase origin/main
```

If there are conflicts:

```bash
# Resolve conflicts manually
git add .
git rebase --continue
```

Then force push your updated branch:

```bash
git push --force-with-lease
```

---

## 🚀 Merging to Main

Once your feature is complete and rebased:

1. Go to the GitHub repo.
2. Create a **Pull Request** from `your-branch-name` → `main`.
3. Get a review and approval.
4. Merge once checks pass.

---

## ✅ Collaboration Rules

- Do **not** commit directly to `main`.
- Always work on your **assigned feature branch**.
- **Rebase** before opening a pull request.
- Use **clear, descriptive commit messages**.
