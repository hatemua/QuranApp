# Quranic Immersion

A calm, native-Android Quranic Arabic vocabulary learning app.

This repository is a hybrid monorepo:

- **Node side** (managed by pnpm workspaces): the Fastify API, shared TypeScript types, and the data seed pipeline.
- **Android side** (standalone Gradle project): the Kotlin + Jetpack Compose mobile client. Lives in `apps/android/` and is intentionally outside the pnpm workspace.

## Layout

```
quranic-immersion/
  apps/
    api/        Fastify + TypeScript + Mongoose
    android/    Kotlin + Jetpack Compose (standalone Gradle root, fleshed out in prompt 3)
  packages/
    shared/     TypeScript types shared between api and seed scripts
  scripts/      Data seed pipeline (Tanzil, QAC, translations -> MongoDB)
  data/
    raw/        Downloaded source files (gitignored)
    processed/  Cleaned JSON ready for Mongo import (gitignored)
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- MongoDB >= 6 running locally (or a connection string)
- Android Studio (only for `apps/android/`, from prompt 3 onwards)

## Setup

```bash
pnpm install
cp .env.example .env       # fill in MONGODB_URI, JWT_SECRET, etc.
```

## Seeding the data

The seed pipeline downloads three source files, parses them into normalized JSON, and imports the result into MongoDB. Everything is idempotent.

```bash
pnpm seed:all
```

This runs, in order:

1. `seed:quran` — downloads Tanzil Uthmani XML, parses to `data/processed/quran.json` (6 236 ayahs).
2. `seed:corpus` — downloads the Quranic Arabic Corpus morphology file, aggregates segments into whole words, writes `data/processed/words.json` (~77 000) and `data/processed/roots.json` (~1 800).
3. `seed:translations` — downloads Sahih International (en), Kemenag (id), and Jalandhry (ur) translations from Tanzil, writes `data/processed/translations.json`.
4. `seed:import` — imports the four JSON files into MongoDB collections `quran_ayahs`, `quran_words`, `quran_roots`, `translations` with proper indexes.

You can also run each step individually: `pnpm seed:quran`, `pnpm seed:corpus`, `pnpm seed:translations`, `pnpm seed:import`.

## Running the API

```bash
pnpm dev:api
```

API endpoints will be implemented in prompt 2. Right now the server boots an empty Fastify instance.

## Android app

Open `apps/android/` in Android Studio. The app is scaffolded in prompt 3.

## Data sources & licenses

| Source | License | Used for |
| --- | --- | --- |
| [Tanzil.net](https://tanzil.net) Quran Uthmani XML | Free under [Tanzil terms](https://tanzil.net/docs/license) | Quran Arabic text |
| [Quranic Arabic Corpus](https://corpus.quran.com) (Leeds) v0.4 | Free for **non-commercial** use ([license](https://corpus.quran.com/download/)) | Word morphology, roots, lemmas, POS |
| [Sahih International](https://tanzil.net) (en) | Free | English translation |
| [Kemenag](https://tanzil.net) (id.indonesian) | Free | Indonesian translation |
| [Fateh Jalandhry](https://tanzil.net) (ur.jalandhry) | Free | Urdu translation |
| [EveryAyah.com](https://everyayah.com) (Alafasy 128 kbps) | Free | Ayah audio |

> **License note:** the QAC morphology data is licensed for non-commercial use only. Plan accordingly if this project ever goes commercial — you may need to swap in an alternative morphology source or contact Leeds for a commercial license.

## Type shape

Shared TypeScript types are exported from `@quranic-immersion/shared` (see [packages/shared/src/types.ts](packages/shared/src/types.ts)). The Android app deliberately does not reuse these — it mirrors the API DTOs as Kotlin data classes by hand for MVP; OpenAPI-driven codegen can be added later if drift becomes painful.
