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
const SOURCES_DIR = path.join(__dirname, 'assets', 'models', 'sources');
const OUTPUT_DIR = path.join(__dirname, 'assets', 'models');
const OUTPUT_EXT = '.sgm';

function xorEncode(buffer) {
    const result = Buffer.alloc(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
        result[i] = buffer[i] ^ XOR_KEY[i % XOR_KEY.length];
    }
    return result;
}

function convertFile(file) {
    const inputPath = path.join(SOURCES_DIR, file);
    const outputName = file.replace(/\.glb$/i, OUTPUT_EXT);
    const outputPath = path.join(OUTPUT_DIR, outputName);

    if (!fs.existsSync(inputPath)) {
        console.log(`[ERR]  Nie znaleziono: sources/${file}`);
        return false;
    }

    // Sprawdź czy plik wymaga konwersji (źródło nowsze niż output)
    if (fs.existsSync(outputPath)) {
        const srcStat = fs.statSync(inputPath);
        const outStat = fs.statSync(outputPath);
        if (outStat.mtime >= srcStat.mtime) {
            return 'skip';
        }
    }

    try {
        const inputBuffer = fs.readFileSync(inputPath);
        const encodedBuffer = xorEncode(inputBuffer);
        fs.writeFileSync(outputPath, encodedBuffer);
        console.log(`[OK]   sources/${file} -> ${outputName} (${(inputBuffer.length / 1024).toFixed(1)} KB)`);
        return true;
    } catch (err) {
        console.error(`[ERR]  ${file}: ${err.message}`);
        return false;
    }
}

function convertAll(showSkipped = false) {
    if (!fs.existsSync(SOURCES_DIR)) {
        fs.mkdirSync(SOURCES_DIR, { recursive: true });
        console.log('Utworzono folder: assets/models/sources/');
        console.log('Wrzuć tam pliki .glb i uruchom ponownie.\n');
        return;
    }

    const files = fs.readdirSync(SOURCES_DIR);
    const glbFiles = files.filter(f => f.toLowerCase().endsWith('.glb'));

    if (glbFiles.length === 0) {
        console.log('Brak plików .glb w assets/models/sources/');
        return;
    }

    let converted = 0, skipped = 0;
    for (const file of glbFiles) {
        const result = convertFile(file);
        if (result === true) converted++;
        else if (result === 'skip') {
            skipped++;
            if (showSkipped) console.log(`[SKIP] ${file} (aktualny)`);
        }
    }

    console.log(`\nGotowe: ${converted} nowych, ${skipped} aktualnych`);
}

function watchMode() {
    console.log('=== Tryb nasłuchiwania ===');
    console.log(`Obserwuję: ${SOURCES_DIR}`);
    console.log('Wrzuć plik .glb - automatycznie się skonwertuje.');
    console.log('Ctrl+C aby zakończyć.\n');

    // Pierwsza konwersja
    convertAll();

    // Nasłuchuj zmian
    fs.watch(SOURCES_DIR, (eventType, filename) => {
        if (filename && filename.toLowerCase().endsWith('.glb')) {
            console.log(`\n[ZMIANA] ${filename}`);
            setTimeout(() => convertFile(filename), 100); // małe opóźnienie dla zapisu
        }
    });
}

function main() {
    const args = process.argv.slice(2);

    console.log('=== Konwersja GLB -> SGM ===\n');

    if (args.includes('--watch') || args.includes('-w')) {
        watchMode();
    } else if (args.find(a => a.endsWith('.glb'))) {
        const file = args.find(a => a.endsWith('.glb'));
        convertFile(file);
    } else {
        convertAll(args.includes('-v'));
    }
}

main();
