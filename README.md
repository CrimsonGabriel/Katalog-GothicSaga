# Katalog Grinderski

Katalog przedmiotów dla serwera Gothic Saga 3.

## Struktura plików

```
katalog/
├── assets/
│   ├── models/
│   │   ├── sources/     <- oryginalne .glb (NIE WRZUCAĆ NA SERWER)
│   │   └── *.sgm        <- zakodowane modele (TYLKO TE NA SERWER)
│   ├── card/            <- miniatury
│   └── dane/            <- JSON z danymi itemów
├── catalog.js           <- główny skrypt
├── convert-models.cjs   <- UWAGA: NIE WRZUCAĆ NA SERWER!
└── zawody/              <- podstrony zawodów
```

## Dodawanie nowych modeli

1. Wrzuć plik `.glb` do `assets/models/sources/`
2. Uruchom: `node convert-models.cjs`
3. Dodaj wpis do odpowiedniego JSON w `assets/dane/`

## WAŻNE - Bezpieczeństwo

**NIE WRZUCAJ na serwer produkcyjny:**
- `convert-models.cjs` - zawiera klucz enkodowania
- `assets/models/sources/` - oryginalne modele GLB

Te pliki służą tylko do lokalnej pracy. Na serwer wrzucaj tylko pliki `.sgm`.

## Tryb watch (auto-konwersja)

```bash
node convert-models.cjs --watch
```

Skrypt będzie nasłuchiwał i automatycznie konwertować nowe pliki.
