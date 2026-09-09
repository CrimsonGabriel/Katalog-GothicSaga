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
