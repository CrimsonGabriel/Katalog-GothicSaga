/**
 * Konwersja modeli GLB -> SGM (zakodowane XOR)
 *
 * Struktura:
 *   assets/models/sources/  <- tutaj wrzucasz oryginalne .glb (zablokowane .htaccess)
 *   assets/models/          <- tutaj trafiają .sgm (dostępne publicznie)
 *
 * Użycie:
 *   node convert-models.cjs              - konwertuj wszystkie nowe/zmienione
 *   node convert-models.cjs --watch      - tryb nasłuchiwania (auto-konwersja)
 *   node convert-models.cjs NAZWA.glb    - konwertuj pojedynczy plik
 */

const fs = require('fs');
const path = require('path');

const XOR_KEY = [0x47, 0x53, 0x33, 0x5F, 0x4D, 0x4F, 0x44, 0x45, 0x4C];
const OUTPUT_DIR = path.join(__dirname, 'assets', 'models');
const SOURCES_DIR = path.join(OUTPUT_DIR, 'sources');
const OUTPUT_EXT = '.sgm';

function xorEncode(buffer) {
    const result = Buffer.alloc(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
        result[i] = buffer[i] ^ XOR_KEY[i % XOR_KEY.length];
    }
    return result;
}

// 1. FUNKCJA SPRZĄTAJĄCA: Przenosi oryginalne .glb do folderu sources
function organizeFiles() {
    console.log('--- KROK 1: Porządkowanie plików ---');
    
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    if (!fs.existsSync(SOURCES_DIR)) fs.mkdirSync(SOURCES_DIR, { recursive: true });

    const items = fs.readdirSync(OUTPUT_DIR);
    let movedCount = 0;

    items.forEach(item => {
        const itemPath = path.join(OUTPUT_DIR, item);
        
        // Ignorujemy foldery (aby nie ruszać folderu 'sources')
        if (fs.statSync(itemPath).isDirectory()) return;

        // Łapiemy pliki .glb porzucone w głównym folderze i przenosimy do sources
        if (item.toLowerCase().endsWith('.glb')) {
            const destPath = path.join(SOURCES_DIR, item);
            
            // Przenosimy plik
            fs.renameSync(itemPath, destPath);
            console.log(`[PRZENIESIONO] ${item} -> sources/`);
            movedCount++;
        }
    });

    if (movedCount > 0) {
        console.log(`Sukces: Przeniesiono ${movedCount} surowych plików do ukrytego folderu sources.\\n`);
    } else {
        console.log('Brak nowych plików w głównym folderze. Wszystko posprzątane.\\n');
    }
}

// Funkcja do szukania plików .glb (działa też w podfolderach)
function getAllGlbFiles(dirPath, arrayOfFiles) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles || [];
    
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllGlbFiles(fullPath, arrayOfFiles);
        } else {
            if (file.toLowerCase().endsWith('.glb')) {
                arrayOfFiles.push(fullPath);
            }
        }
    });
    return arrayOfFiles;
}

// 2. FUNKCJA KONWERTUJĄCA: Szyfruje .glb i zapisuje jako .sgm
function convertFile(inputPath) {
    try {
        const fileName = path.basename(inputPath, path.extname(inputPath));
        const outputPath = path.join(OUTPUT_DIR, fileName + OUTPUT_EXT);

        // Jeśli plik już istnieje i jest nowszy/taki sam, pomiń konwersję (oszczędność czasu)
        if (fs.existsSync(outputPath)) {
            const inStat = fs.statSync(inputPath);
            const outStat = fs.statSync(outputPath);
            if (outStat.mtime >= inStat.mtime) {
                return 'skip';
            }
        }

        const buffer = fs.readFileSync(inputPath);
        const encoded = xorEncode(buffer);
        fs.writeFileSync(outputPath, encoded);
        
        const displayPath = inputPath.replace(SOURCES_DIR, '').replace(/^\\|^\//, '');
        console.log(`[OK]   ${displayPath} -> ${fileName}${OUTPUT_EXT} (${(encoded.length / 1024).toFixed(1)} KB)`);
        return true;
    } catch (err) {
        console.error(`[BŁĄD] ${inputPath}:`, err.message);
        return false;
    }
}

function convertAll() {
    console.log('--- KROK 2: Konwersja i szyfrowanie ---');
    const glbFiles = getAllGlbFiles(SOURCES_DIR);

    if (glbFiles.length === 0) {
        console.log('Brak plików .glb w folderze sources do konwersji.');
        return;
    }

    let converted = 0, skipped = 0;
    for (const file of glbFiles) {
        const result = convertFile(file);
        if (result === true) converted++;
        else if (result === 'skip') {
            skipped++;
        }
    }

    console.log(`\\nPodsumowanie: Utworzono/Zaktualizowano ${converted} modeli. Pominięto ${skipped} (już aktualne). Łącznie przetworzono ${glbFiles.length} plików.`);
}

function main() {
    console.log('=== AUTO-ORGANIZACJA I KONWERSJA MODELI ===\\n');
    organizeFiles();
    convertAll();
}

main();
