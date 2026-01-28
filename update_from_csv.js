const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const csvFilePath = 'Itemki.csv';
const jsonFilePath = './assets/dane/jubiler.json';

const CSV_HEADERS = [
    'Nazwa', 'Opis', 'Main Flaga', 'Flaga', 'ItemCategory', 'ItemType', 'ItemGroupType',
    'PLIK', 'Stackowanie', 'Instancja[OLD]', 'Instancja [SAGA3]', 'model nazwa', 'Waga', 'hideNick',
    'Liczba użyć', 'Stamina 1 Hit', 'HP 1 hit', 'Mana 1 Hit', 'Stamina', 'HP', 'MANA',
    'Rodzaj Obrażeń', 'DMG', 'Zasięg', 'W: Siła', 'W: Zręczność', 'W: Inteligencja',
    'W: Krąg', 'W: Mana', 'Wytrzymałość', 'expirationTime', 'Obuchowa', 'Pociski', 'Sieczna',
    'Magia', 'Ogień', 'Upadek', 'Tier', 'Profesja', 'Kategoria'
];

function cleanValue(value) {
    if (value && typeof value === 'string') {
        return value.trim().replace(/^"|"$/g, '');
    }
    return value;
}

// Funkcja do usuwania rozszerzenia pliku, włącznie z .mms i .MMS
function removeExtension(filename) {
    return filename.replace(/\.(3ds|asc|obj|fbx|gltf|mms|MMS|glb|GLB)$/i, '');
}

async function processData() {
    console.log("--- Rozpoczynam przetwarzanie danych z CSV ---");

    if (!fs.existsSync(csvFilePath)) {
        console.error(`Błąd: Plik CSV nie znaleziono pod ścieżką: ${csvFilePath}`);
        return;
    }

    if (!fs.existsSync(jsonFilePath)) {
        console.error(`Błąd: Plik JSON nie znaleziono pod ścieżką: ${jsonFilePath}`);
        return;
    }

    let jsonData;
    try {
        jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    } catch (error) {
        console.error(`Błąd podczas odczytu lub parsowania pliku JSON:`, error);
        return;
    }

    const jsonMapByInstance = new Map();
    const jsonMapByInstancesaga3 = new Map();

    jsonData.forEach(item => {
        if (item.instance) {
            jsonMapByInstance.set(item.instance.toUpperCase(), item);
        }
        if (item.instancesaga3) {
            jsonMapByInstancesaga3.set(item.instancesaga3.toUpperCase(), item);
        }
        item.matchedInCsv = false;
    });

    const csvData = [];
    await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(csvFilePath)
            .pipe(parse({
                delimiter: ';',
                columns: CSV_HEADERS,
                skip_empty_lines: true,
                from_line: 2
            }));

        stream.on('data', (row) => csvData.push(row));
        stream.on('end', () => resolve());
        stream.on('error', (err) => reject(err));
    });

    let updatedCount = 0;
    let addedCount = 0;

    for (const row of csvData) {
        const instanceOld = cleanValue(row['Instancja[OLD]'])?.toUpperCase();
        const instanceSaga3 = cleanValue(row['Instancja [SAGA3]'])?.toUpperCase();
        
        let existingItem = null;
        if (instanceOld && jsonMapByInstance.has(instanceOld)) {
            existingItem = jsonMapByInstance.get(instanceOld);
        } else if (instanceSaga3 && jsonMapByInstancesaga3.has(instanceSaga3)) {
            existingItem = jsonMapByInstancesaga3.get(instanceSaga3);
        }

        const itemData = {};
        const mappings = {
            'Nazwa': 'name',
            'Opis': 'opis',
            'Main Flaga': 'mainFlag',
            'Instancja[OLD]': 'instance',
            'Instancja [SAGA3]': 'instancesaga3',
            'ItemCategory': 'category',
            'Waga': 'weight',
            'Wytrzymałość': 'durability',
            'Liczba użyć': 'uses',
            'Stamina 1 Hit': 'staminaPerHit',
            'HP 1 hit': 'hpPerHit',
            'Mana 1 Hit': 'manaPerHit',
            'Stamina': 'stamina',
            'HP': 'hp',
            'MANA': 'mana',
            'Rodzaj Obrażeń': 'dmgType',
            'DMG': 'dmg',
            'Zasięg': 'range',
            'W: Siła': 'strength',
            'W: Zręczność': 'dexterity',
            'W: Inteligencja': 'intelligence',
            'W: Krąg': 'magicCircle',
            'W: Mana': 'manaCost',
            'Obuchowa': 'resistance_blunt',
            'Pociski': 'resistance_projectile',
            'Sieczna': 'resistance_slash',
            'Magia': 'resistance_magic',
            'Ogień': 'resistance_fire',
            'Upadek': 'resistance_fall',
            'model nazwa': 'modelNazwa',
            'Tier': 'tier',
            'expirationTime': 'expirationTime',
            'PLIK': 'plik',
            'Profesja': 'profession',
            'Kategoria': 'kategoria'
        };
        
        for (const csvKey in mappings) {
            const jsonKey = mappings[csvKey];
            const value = cleanValue(row[csvKey]);
            if (value !== undefined) {
                itemData[jsonKey] = value;
            }
        }
        
        const modelNazwa = itemData.modelNazwa;
        if (modelNazwa) {
            const baseName = removeExtension(modelNazwa).toUpperCase();
            itemData.model = `assets/models/${baseName}.glb`;
            itemData.thumbnail = `assets/card/${baseName}.webp`;
            itemData.title = baseName.toUpperCase();
        } else {
            itemData.model = 'TODO: "Brak modelu"';
            itemData.thumbnail = 'TODO: "Brak miniaturki"';
        }

        if (existingItem) {
            Object.assign(existingItem, itemData);
            existingItem.matchedInCsv = true;
            updatedCount++;
        } else {
            const newItem = {
                title: itemData.model?.replace('assets/models/', '').replace('.glb', '').toUpperCase() || 'NEW_ITEM',
                ...itemData,
                matchedInCsv: true
            };
            jsonData.push(newItem);
            addedCount++;
        }
    }

    let notInCsvCount = 0;
    jsonData.forEach(item => {
        if (!item.matchedInCsv) {
            item.instance = 'TODO: "Nie ma w excel"';
            notInCsvCount++;
        }
        delete item.matchedInCsv;
    });

    try {
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 4), 'utf8');
        console.log(`\nProces zakończony pomyślnie.`);
        console.log(`Zaktualizowano ${updatedCount} istniejących wpisów.`);
        console.log(`Dodano ${addedCount} nowych wpisów.`);
        console.log(`${notInCsvCount} wpisów zostało oznaczonych jako 'TODO: "Nie ma w excel"'.`);
    } catch (error) {
        console.error(`\nBłąd podczas zapisu pliku JSON:`, error);
    }
}

processData();