# Fonts

The four TTF files in this folder are NOT committed (and could not be downloaded during scaffold).

Before running `pnpm android` you must place these files here:

- `Amiri-Regular.ttf`
- `Amiri-Bold.ttf`
- `Inter-Regular.ttf`
- `Inter-SemiBold.ttf`

## Quick download

Run from the repo root in PowerShell:

```powershell
pwsh apps/mobile/scripts/download-fonts.ps1
```

Or grab them manually:

- Amiri: https://github.com/aliftype/amiri/tree/master/fonts/ttf (Regular + Bold)
- Inter: https://rsms.me/inter/ → download TTF set, copy `Inter-Regular.ttf` and `Inter-SemiBold.ttf`

After placing the files here, link them into the Android assets folder:

```bash
cd apps/mobile
npx react-native-asset
```

This copies the files into `android/app/src/main/assets/fonts/`. Then `pnpm android` will see them.
