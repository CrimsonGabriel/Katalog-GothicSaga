const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const csvFilePath = 'Itemki.csv';
const jsonFilePath = './assets/dane/tymczasowy.json'; 

// ZAKTUALIZOWANE: Dodano 'Zdobywalne' i 'Dla Gracza' na końcu tablicy
const CSV_HEADERS = [
    'Nazwa', 'KOSZT', 'Opis', 'Main Flaga', 'Flaga', 'ItemCategory', 'ItemType', 'ItemGroupType',
    'PLIK', 'Stackowanie', 'Instancja[OLD]', 'visualInstance', 'Instancja [SAGA3]', 'Waga',
    'Tier', 'adminRank', 'hideNick', 'Liczba użyć', 'Stamina 1 Hit', 'HP 1 hit', 'Mana 1 Hit',
    'Stamina', 'HP', 'MANA', 'Rodzaj Obrażeń', 'DMG', 'Zasięg', 'W: Siła', 'W: Zręczność',
    'W: Inteligencja', 'healing_tick', 'efekt czaru', 'Instancja przemiany', 'HP przemiany',
    'W: Krąg', 'W: Mana', 'runeType', 'Przedmiot do naprawy', 'Wytrzymałość', 'canRob',
    'Podatek Silden %', 'Podatek Geldern %', 'expirationTime', 'foodType', 'enduranceCost',
    'arrowSpeed', 'Obuchowa', 'Pociski', 'Sieczna', 'Magia', 'Ogień', 'Upadek', 'Profesja',
    'Kategoria', 'model nazwa', 'Craftowalne', 'Zdobywalne', 'Dla Gracza'
];

function cleanValue(value) {
    if (value && typeof value === 'string') {
        return value.trim().replace(/^"|"$/g, '');
    }
    return value;
}

function removeExtension(filename) {
    return filename.replace(/\.(3ds|asc|obj|fbx|gltf|mms|MMS|glb|GLB)$/i, '');
}

async function processData() {
    console.log("--- Rozpoczynam przetwarzanie danych z CSV ---");

    if (!fs.existsSync(csvFilePath)) {
        console.error(`Błąd: Plik CSV nie znaleziono pod ścieżką: ${csvFilePath}`);
        return;
    }

    let jsonData = [];
    if (fs.existsSync(jsonFilePath)) {
        try {
            jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
        } catch (error) {
            console.error(`Błąd podczas odczytu pliku JSON. Zaczynam od nowa.`, error);
        }
    } else {
        console.log(`Plik ${jsonFilePath} nie istnieje - zostanie utworzony jako nowy.`);
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
        // ZAKTUALIZOWANE: Dodano 'Zdobywalne' i 'Dla Gracza' do obiektu mapującego
        const mappings = {
            'Nazwa': 'name', 'KOSZT': 'cost', 'Opis': 'opis', 'Main Flaga': 'mainFlag',
            'Flaga': 'flaga', 'ItemCategory': 'category', 'ItemType': 'itemType',
            'ItemGroupType': 'itemGroupType', 'PLIK': 'plik', 'Stackowanie': 'stackable',
            'Instancja[OLD]': 'instance', 'visualInstance': 'visualInstance',
            'Instancja [SAGA3]': 'instancesaga3', 'Waga': 'weight', 'Tier': 'tier',
            'adminRank': 'adminRank', 'hideNick': 'hideNick', 'Liczba użyć': 'uses',
            'Stamina 1 Hit': 'staminaPerHit', 'HP 1 hit': 'hpPerHit', 'Mana 1 Hit': 'manaPerHit',
            'Stamina': 'stamina', 'HP': 'hp', 'MANA': 'mana', 'Rodzaj Obrażeń': 'dmgType',
            'DMG': 'dmg', 'Zasięg': 'range', 'W: Siła': 'strength', 'W: Zręczność': 'dexterity',
            'W: Inteligencja': 'intelligence', 'healing_tick': 'healingTick', 'efekt czaru': 'spellEffect',
            'Instancja przemiany': 'transformationInstance', 'HP przemiany': 'transformationHp',
            'W: Krąg': 'magicCircle', 'W: Mana': 'manaCost', 'runeType': 'runeType',
            'Przedmiot do naprawy': 'repairItem', 'Wytrzymałość': 'durability', 'canRob': 'canRob',
            'Podatek Silden %': 'taxSilden', 'Podatek Geldern %': 'taxGeldern', 'expirationTime': 'expirationTime',
            'foodType': 'foodType', 'enduranceCost': 'enduranceCost', 'arrowSpeed': 'arrowSpeed',
            'Obuchowa': 'resistance_blunt', 'Pociski': 'resistance_projectile', 'Sieczna': 'resistance_slash',
            'Magia': 'resistance_magic', 'Ogień': 'resistance_fire', 'Upadek': 'resistance_fall',
            'Profesja': 'profession', 'Kategoria': 'kategoria', 'model nazwa': 'modelNazwa', 
            'Craftowalne': 'craftable', 'Zdobywalne': 'obtainable', 'Dla Gracza': 'forPlayer'
        };
        
        for (const csvKey in mappings) {
            const jsonKey = mappings[csvKey];
            const value = cleanValue(row[csvKey]);
            if (value !== undefined && value !== '') {
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
        const dir = path.dirname(jsonFilePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
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