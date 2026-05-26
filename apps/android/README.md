# Android app placeholder

The native Android client is scaffolded in **prompt 3** of the build plan.

When it lands, this directory will become a standalone Gradle project (Kotlin DSL, version catalog) with:

- Kotlin + Jetpack Compose + Material 3
- Hilt for DI
- Retrofit + OkHttp + kotlinx.serialization
- Room (local cache)
- DataStore (Preferences)
- EncryptedSharedPreferences (tokens)
- Media3 ExoPlayer (audio)
- Firebase Cloud Messaging (push)
- WorkManager (offline sync + local notifications)

`apps/android/` is intentionally **outside** the pnpm workspace (`pnpm-workspace.yaml` excludes it). Open it in Android Studio independently.

The `API_BASE_URL` for builds will be read from `apps/android/local.properties` (gitignored) and exposed via `BuildConfig.API_BASE_URL`. For the Android emulator, use `http://10.0.2.2:<API_PORT>`.
