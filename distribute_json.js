const fs = require('fs');
const path = require('path');

const jsonFilePath = './assets/dane/tymczasowy.json';
const outputDir = './assets/dane/';

const professionToFileMap = {
    'Alchemik': 'alchemik.json',
	'Crafting polowy': 'crafting polowy.json',
    'Drwal': 'drwal.json',
    'Górnik': 'gornik.json',
    'Hutnik': 'hutnik.json',
    'Kaletnik': 'kaletnik.json',
    'Kucharz': 'kucharz.json',
    'Kuśnierz': 'kusnierz.json',
    'Łuczarz': 'luczarz.json',
    'Myśliwy': 'mysliwy.json',
    'Płatnerz': 'platnerz.json',
    'Rolnik': 'rolnik.json',
    'Krawiec': 'ubrania.json',
    'Zaklinacz': 'zaklinacz.json',
    'Zbieracz': 'zbieracz.json',
    'Kowal': 'kowal.json'
};

async function distributeData() {
    console.log("--- Rozpoczynam dystrybucję danych do plików profesji ---");

    if (!fs.existsSync(jsonFilePath)) {
        console.error(`Błąd: Plik źródłowy (tymczasowy) JSON nie został znaleziony pod ścieżką: ${jsonFilePath}`);
        console.log(`Najpierw uruchom skrypt aktualizujący dane z CSV!`);
        return;
    }

    let jsonData;
    try {
        jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    } catch (error) {
        console.error(`Błąd podczas odczytu pliku tymczasowego:`, error);
        return;
    }

    if (!fs.existsSync(outputDir)) {
        console.log(`Katalog docelowy ${outputDir} nie istnieje. Tworzę...`);
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log("Czyszczenie istniejących plików JSON...");
    for (const key in professionToFileMap) {
        const filePath = path.join(outputDir, professionToFileMap[key]);
        try {
            fs.writeFileSync(filePath, '[]', 'utf8');
        } catch (error) {
            console.error(`Nie udało się wyczyścić pliku ${filePath}:`, error);
        }
    }

    const distributedData = {};
    for (const key in professionToFileMap) {
        distributedData[key] = [];
    }
    
    let processedRecordsCount = 0;
    let unassignedRecordsCount = 0;

    jsonData.forEach(item => {
        const professionStr = item.profession ? item.profession.trim() : null;
        
        if (professionStr) {
            // Rozdzielamy profesje po znaku '/' i usuwamy białe znaki na brzegach
            const professionsArray = professionStr.split('/').map(p => p.trim());
            let assignedToAtLeastOne = false;

            professionsArray.forEach(prof => {
                // Znajdujemy odpowiedni klucz w mapie (ignorując wielkość liter)
                // Uchroni nas to przed błędami typu "Crafting Polowy" vs "Crafting polowy"
                const matchedKey = Object.keys(professionToFileMap).find(
                    key => key.toLowerCase() === prof.toLowerCase()
                );

                if (matchedKey) {
                    distributedData[matchedKey].push(item);
                    assignedToAtLeastOne = true;
                }
            });

            if (assignedToAtLeastOne) {
                processedRecordsCount++;
            } else {
                unassignedRecordsCount++;
            }
        } else {
            unassignedRecordsCount++;
        }
    });

    for (const profession in distributedData) {
        const records = distributedData[profession];
        if (records.length > 0) {
            const fileName = professionToFileMap[profession];
            const filePath = path.join(outputDir, fileName);
            try {
                fs.writeFileSync(filePath, JSON.stringify(records, null, 4), 'utf8');
                console.log(`Zapisano ${records.length} rekordów do pliku ${fileName}.`);
            } catch (error) {
                console.error(`Błąd podczas zapisu pliku ${filePath}:`, error);
            }
        }
    }

    console.log(`\nProces dystrybucji zakończony pomyślnie.`);
    console.log(`Przetworzono łącznie ${processedRecordsCount} rekordów (niektóre mogły trafić do wielu plików).`);
    if (unassignedRecordsCount > 0) {
        console.log(`Pominięto ${unassignedRecordsCount} rekordów bez przypisanej profesji lub z nieznaną profesją.`);
    }

    // Usuwanie pliku tymczasowego po zakończeniu
    try {
        if (fs.existsSync(jsonFilePath)) {
            fs.unlinkSync(jsonFilePath);
            console.log(`\nPlik tymczasowy (${jsonFilePath}) został pomyślnie posprzątany.`);
        }
    } catch (error) {
        console.error(`\nNie udało się usunąć pliku tymczasowego:`, error);
    }
}

distributeData();