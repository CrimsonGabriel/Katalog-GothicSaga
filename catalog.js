// Runtime model processor
const _0x1a = [0x52, 0x31, 0x4d, 0x7a, 0x58, 0x30, 0x31, 0x50, 0x52, 0x45, 0x56, 0x4d];
const _0x2b = (s) => atob(s).split('').map(c => c.charCodeAt(0));
const _0x3c = () => _0x2b(String.fromCharCode(..._0x1a));
let _k = null;
const _i = () => { if (!_k) _k = _0x3c(); return _k; };
const _d = (d) => { const a = new Uint8Array(d), k = _i(); for (let i = 0; i < a.length; i++) a[i] ^= k[i % k.length]; return a.buffer; };

document.addEventListener('DOMContentLoaded', () => {
    const modelGrid = document.querySelector('.model-grid');
    const modelViewer = document.getElementById('model-viewer');
    const closeViewer = document.getElementById('close-viewer');
    const modelViewerElement = modelViewer.querySelector('model-viewer');
    const spinner = document.getElementById('spinner');
    const categoryButtons = document.querySelectorAll('.button');

    const pageName = document.body.getAttribute('data-page');
    const jsonUrl = `../assets/dane/${pageName}.json`;
    const basePath = window.location.pathname.includes('/zawody/') ? '../' : '';

    let models = [];

    // === FUNKCJA BEZPIECZNEGO ŁADOWANIA (dekodowanie SGM -> GLB w pamięci) ===
    async function loadModelSecurely(url) {
        modelViewerElement.setAttribute('src', '');
        spinner.style.display = 'block';

        const sgmUrl = url.replace(/\.glb$/i, '.sgm');

        try {
            const response = await fetch(sgmUrl);

            if (response.status === 403) {
                window.location.href = basePath + 'forbidden.html';
                return;
            }

            if (!response.ok) throw new Error('Network response was not ok');

            const encodedData = await response.arrayBuffer();
            const decodedData = _d(encodedData);

            const blob = new Blob([decodedData], { type: 'model/gltf-binary' });
            const objectURL = URL.createObjectURL(blob);

            setTimeout(() => {
                modelViewerElement.setAttribute('src', objectURL);
            }, 50);

        } catch (error) {
            console.error('Błąd ładowania modelu:', error);
            spinner.style.display = 'none';
        }
    }

    async function fetchModels() {
        try {
            const response = await fetch(jsonUrl);
            models = await response.json();
            displayModels(models);
        } catch (error) {
            console.error('Błąd podczas pobierania danych:', error);
        }
    }

    function displayModels(modelsToDisplay) {
        modelGrid.innerHTML = '';
        modelsToDisplay.forEach(model => {
            const card = document.createElement('div');
            card.classList.add('model-card', 'main-card');

            const isNameAvailable = model.name && model.name.trim() !== "";
            const displayNameForSearch = (isNameAvailable ? model.name : model.title || '').toLowerCase();
            card.setAttribute('data-title', displayNameForSearch);
            card.setAttribute('data-display-source', isNameAvailable ? 'name' : 'title');

            const firstLetter = (isNameAvailable ? model.name : model.title || '').charAt(0).toUpperCase();
            card.setAttribute("data-letter", (firstLetter >= 'A' && firstLetter <= 'Z') ? firstLetter : "123");

            if (model.instance) card.setAttribute("data-instance", model.instance);

            // Logika atrybutów dla filtrów
            if (model.instancesaga3) {
                const i3 = model.instancesaga3.toUpperCase();
                if (i3.includes('2H')) card.setAttribute("data-hands", "2H");
                else if (i3.includes('1H')) card.setAttribute("data-hands", "1H");
            }
            
            const str = parseFloat(model.strength) || 0;
            const dex = parseFloat(model.dexterity) || 0;
            if (str > 0 || dex > 0) {
                if (str > dex) card.setAttribute("data-stat", "STR");
                else if (dex > str) card.setAttribute("data-stat", "DEX");
                else card.setAttribute("data-stat", "BOTH");
            }

            if (model.dmgType) {
                let dType = '';
                switch (model.dmgType) {
                    case 'DAMAGE_EDGE': dType = 'CUT'; break;
                    case 'DAMAGE_POINT': dType = 'PRC'; break;
                    case 'DAMAGE_BLUNT': dType = 'BLT'; break;
                    case 'DAMAGE_MAGIC': dType = 'MAG'; break;
                    case 'DAMAGE_FIRE': dType = 'FIRE'; break;
                }
                if (dType) card.setAttribute("data-dmg", dType);
            }

            // --- INTELIGENTNE WYCIĄGANIE NUMERU TIERU ---
            // Upewniamy się, że do filtra dataset trafi zawsze jednolity format, np. "1", "2", "3"
            let tierNum = "";
            let rawTier = model.tier;
            if (rawTier !== undefined && rawTier !== null && String(rawTier).trim() !== '' && String(rawTier).toUpperCase() !== 'BRAK') {
                tierNum = String(rawTier).trim().replace(/^T/i, ''); // Usuwa 'T' lub 't' z przodu, jeśli jest
            }

            if (tierNum) {
                // Do filtru zapisujemy np "T1" - założyłem że twoje guziki mają wpisane "T1" w data-tier
                card.setAttribute("data-tier", "T" + tierNum); 
            }
            if (model.hands) card.setAttribute("data-hands", model.hands);

            const img = document.createElement('img');
            img.src = basePath + (model.thumbnail.startsWith('TODO:') ? 'assets/card/default.webp' : model.thumbnail);
            img.alt = isNameAvailable ? model.name : model.title;
            img.loading = "lazy";
            img.onerror = function() { this.onerror=null; this.src = basePath + 'assets/card/default.webp'; };

            const title = document.createElement('h2');
            title.textContent = isNameAvailable ? model.name : model.title;
            
            // --- WYŚWIETLANIE TAGU TIERU NA KARTACH ---
            if (tierNum) {
                const tierTag = document.createElement('div');
                tierTag.classList.add('tier-tag', `tier-t${tierNum}`);
                tierTag.textContent = `T${tierNum}`;
                card.appendChild(tierTag);
            }

            if (model.instancesaga3) {
                const i3 = model.instancesaga3.toUpperCase();
                const handsTag = document.createElement('div');
                if (i3.includes('2H')) {
                    handsTag.classList.add('hands-tag', 'two-handed');
                    handsTag.textContent = '2H';
                    card.appendChild(handsTag);
                } else if (i3.includes('1H')) {
                    handsTag.classList.add('hands-tag', 'one-handed');
                    handsTag.textContent = '1H';
                    card.appendChild(handsTag);
                }
            }

            card.appendChild(img);
            card.appendChild(title);
            modelGrid.appendChild(card);

            card.addEventListener('click', () => {
                document.getElementById('model-title').textContent = isNameAvailable ? model.name : model.title;
                const descEl = document.getElementById('model-description');
                if (descEl) descEl.textContent = model.description || '';

                const detailsContainer = document.getElementById('model-details-container');
                if (!detailsContainer) {
                    console.error('Błąd: Nie znaleziono elementu <div id="model-details-container"></div> w HTML!');
                    return;
                }
                detailsContainer.innerHTML = ''; 

                const detailGroups = [
                    {
                        title: "Informacje Podstawowe",
                        items: [
                            { label: 'Opis', val: model.opis },
                            { label: 'Koszt', val: model.cost },
                            { label: 'Waga', val: model.weight },
                            { label: 'Tier', val: tierNum ? `T${tierNum}` : null },
                            { label: 'Profesja', val: model.profession },
                            { label: 'Kategoria', val: model.kategoria || model.category },
                            { label: 'Craftowalne', val: model.craftable },
                            { label: 'Zdobywalne', val: model.obtainable },
                            { label: 'Dla Gracza', val: model.forPlayer },
                            { label: 'Wytrzymałość', val: model.durability },
                            { label: 'Narzędzie do naprawy', val: model.repairItem },
                            { label: 'Liczba użyć', val: model.uses }
                        ]
                    },
                    {
                        title: "Walka i Obrażenia",
                        items: [
                            { label: 'Uchwyt', val: model.hands === "1H" ? "Jednoręczna" : (model.hands === "2H" ? "Dwuręczna" : "") },
                            { label: 'Rodzaj obrażeń', val: model.dmgType },
                            { label: 'DMG', val: model.dmg },
                            { label: 'Zasięg', val: model.range },
                            { label: 'Szybkość strzały', val: model.arrowSpeed }
                        ]
                    },
                    {
                        title: "Wymagania",
                        items: [
                            { label: 'Siła', val: model.strength },
                            { label: 'Zręczność', val: model.dexterity },
                            { label: 'Inteligencja', val: model.intelligence }
                        ]
                    },
                    {
                        title: "Magia i Efekty",
                        items: [
                            { label: 'Magiczny Krąg', val: model.magicCircle },
                            { label: 'Koszt Many', val: model.manaCost },
                            { label: 'Typ Runy', val: model.runeType },
                            { label: 'Efekt Czaru', val: model.spellEffect },
                            { label: 'Instancja Przemiany', val: model.transformationInstance },
                            { label: 'HP Przemiany', val: model.transformationHp },
                            { label: 'Leczenie (Tick)', val: model.healingTick }
                        ]
                    },
                    {
                        title: "Koszty / Zyski za uderzenie",
                        items: [
                            { label: 'Stamina (1 hit)', val: model.staminaPerHit },
                            { label: 'HP (1 hit)', val: model.hpPerHit },
                            { label: 'Mana (1 hit)', val: model.manaPerHit },
                            { label: 'Koszt Wytrzymałości', val: model.enduranceCost }
                        ]
                    },
                    {
                        title: "Konsumpcja / Bonusy",
                        items: [
                            { label: 'Typ Jedzenia', val: model.foodType },
                            { label: 'Stamina (Bonus)', val: model.stamina },
                            { label: 'HP (Bonus)', val: model.hp },
                            { label: 'Mana (Bonus)', val: model.mana }
                        ]
                    },
                    {
                        title: "Ochrona i Pancerz",
                        items: [
                            { label: 'Obrona Obuchowa', val: model.resistance_blunt },
                            { label: 'Obrona Pociski', val: model.resistance_projectile },
                            { label: 'Obrona Sieczna', val: model.resistance_slash },
                            { label: 'Obrona Magia', val: model.resistance_magic },
                            { label: 'Obrona Ogień', val: model.resistance_fire },
                            { label: 'Obrona Upadek', val: model.resistance_fall }
                        ]
                    },
                    {
                        title: "Dane Systemowe",
                        items: [
                            { label: 'Można okraść', val: model.canRob },
                            { label: 'Podatek Silden (%)', val: model.taxSilden },
                            { label: 'Podatek Geldern (%)', val: model.taxGeldern },
                            { label: 'Main Flaga', val: model.mainFlag },
                            { label: 'Flaga', val: model.flaga },
                            { label: 'Item Type', val: model.itemType },
                            { label: 'Item Group Type', val: model.itemGroupType },
                            { label: 'Stackowalne', val: model.stackable },
                            { label: 'Ukrywa Nick', val: model.hideNick },
                            { label: 'Czas Wygaśnięcia', val: model.expirationTime },
                            { label: 'Ranga Admina', val: model.adminRank },
                            { label: 'Instancja [OLD]', val: model.instance },
                            { label: 'Instancja [SAGA3]', val: model.instancesaga3 },
                            { label: 'Visual Instance', val: model.visualInstance }
                        ]
                    }
                ];

                detailGroups.forEach(group => {
                    const validItems = group.items.filter(item => {
                        const val = item.val;
                        if (val === undefined || val === null || val === '') return false;
                        const strVal = String(val).trim().toUpperCase();
                        if (strVal === '0' || strVal === '-' || strVal === 'BRAK') return false;
                        return true;
                    });

                    if (validItems.length > 0) {
                        const header = document.createElement('h4');
                        header.style.marginTop = '15px';
                        header.style.marginBottom = '5px';
                        header.style.paddingBottom = '3px';
                        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
                        header.style.color = '#ccc';
                        header.textContent = group.title;
                        detailsContainer.appendChild(header);

                        validItems.forEach(item => {
                            const row = document.createElement('div');
                            row.style.marginBottom = '4px';
                            row.style.fontSize = '0.95em';
                            row.innerHTML = `<strong style="color: #fff;">${item.label}:</strong> <span style="color: #ddd;">${item.val}</span>`;
                            detailsContainer.appendChild(row);
                        });
                    }
                });

                modelViewer.style.display = 'flex';
                document.body.classList.add('viewer-open');
                loadModelSecurely(basePath + model.model);
            });
        });

        applyAllFilters();
    }

    // --- FILTRY ---
    let activeTier = null;
    let activeHands = null;
    let activeStat = null;
    let activeDmg = null;
    let activeLetter = null;

    document.querySelectorAll('.filter-button').forEach(btn => {
        btn.addEventListener('click', function() {
            const filterType = Object.keys(this.dataset)[0];
            const group = this.parentElement;
            
            group.querySelectorAll('.filter-button').forEach(b => {
                if(b !== this) b.classList.remove('active');
            });

            this.classList.toggle('active');
            const isActive = this.classList.contains('active');
            const val = isActive ? this.dataset[filterType] : null;

            if (filterType === 'tier') activeTier = val;
            if (filterType === 'hands') activeHands = val;
            if (filterType === 'stat') activeStat = val;
            if (filterType === 'dmg') activeDmg = val;
            if (filterType === 'letter') activeLetter = val;
            
            applyAllFilters();
        });
    });

    function applyAllFilters() {
        const query = document.getElementById('search-bar') ? document.getElementById('search-bar').value.toLowerCase().trim() : '';
        const cards = document.querySelectorAll('.main-card');
        let visible = 0;

        cards.forEach(card => {
            const title = card.dataset.title || "";
            const matchSearch = title.includes(query) || (card.dataset.instance || "").toLowerCase().includes(query);
            
            // Logika sprawdzania tieru
            let matchTier = true;
            if (activeTier) {
                // Konwersja by upewnic się, że np 'T1' dopasuje się do 'T1'
                const filterVal = String(activeTier).toUpperCase().trim();
                const cardVal = String(card.dataset.tier || "").toUpperCase().trim();
                matchTier = (cardVal === filterVal);
            }

            const matchHands = !activeHands || card.dataset.hands === activeHands;
            const matchStat = !activeStat || card.dataset.stat === activeStat;
            const matchDmg = !activeDmg || card.dataset.dmg === activeDmg;
            const matchLetter = !activeLetter || card.dataset.letter === activeLetter;
            
            const match = matchSearch && matchTier && matchHands && matchStat && matchDmg && matchLetter;
            card.style.display = match ? "block" : "none";
            if (match) visible++;
        });

        const noResults = document.getElementById('no-results');
        if(noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
        
        const status = document.getElementById('search-status');
        if (status) status.textContent = query ? `Znaleziono: ${visible} / ${cards.length}` : '';
    }

    const searchInput = document.getElementById('search-bar');
    if (searchInput) searchInput.addEventListener('input', applyAllFilters);

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const cat = button.getAttribute('data-category');
            displayModels(cat === 'all' ? models : models.filter(m => m.kategoria === cat));
        });
    });

    closeViewer.addEventListener('click', () => {
        modelViewer.style.display = 'none';
        document.body.classList.remove('viewer-open');
        modelViewerElement.setAttribute('src', '');
        const detailsContainer = document.getElementById('model-details-container');
        if(detailsContainer) detailsContainer.innerHTML = '';
    });

    window.addEventListener('scroll', () => {
        if (document.body.classList.contains('viewer-open')) return;
        document.body.classList.add('scrolling-hide');
        clearTimeout(window.scrollT);
        window.scrollT = setTimeout(() => document.body.classList.remove('scrolling-hide'), 200);
    });

    modelViewerElement.addEventListener('load', () => {
        spinner.style.display = 'none';
        modelViewerElement.model?.materials.forEach(m => {
            m.pbrMetallicRoughness.setMetallicFactor(-2);
            m.pbrMetallicRoughness.setRoughnessFactor(1);
        });
    });

    fetchModels();
    
    const toggleTab = document.getElementById('filter-toggle-tab');
    const sideFilters = document.getElementById('side-filters');
    if(toggleTab) toggleTab.addEventListener('click', () => sideFilters.classList.toggle('open'));
});