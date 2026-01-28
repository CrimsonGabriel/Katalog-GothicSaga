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

    // Elementy do wyświetlania w podglądzie detali
    const detailsContainer = document.getElementById('model-info');
    const createDetail = (id, cls) => {
        const p = document.createElement('p');
        p.id = id;
        p.className = cls;
        detailsContainer.appendChild(p);
        return p;
    };

    const modelOpis = createDetail('model-opis', 'model-detail-opis');
    const modelWeight = createDetail('model-weight', 'model-detail-weight');
    const modelRange = createDetail('model-range', 'model-detail-range');
    const modelMagicCircle = createDetail('model-magic_circle', 'model-detail-magic_circle');
    const modelManaCost = createDetail('model-mana_cost', 'model-detail-mana_cost');
    const modelDurability = createDetail('model-durability', 'model-detail-durability');
    const modelHands = createDetail('model-hands', 'model-detail-hands');
    const modelUses = createDetail('model-uses', 'model-detail-uses');
    const modelStaminaPerHit = createDetail('model-staminaPerHit', 'model-detail-staminaPerHit');
    const modelHpPerHit = createDetail('model-hpPerHit', 'model-detail-hpPerHit');
    const modelManaPerHit = createDetail('model-manaPerHit', 'model-detail-manaPerHit');
    const modelStamina = createDetail('model-stamina', 'model-detail-stamina');
    const modelHp = createDetail('model-hp', 'model-detail-hp');
    const modelMana = createDetail('model-mana', 'model-detail-mana');
    const modelDmgType = createDetail('model-dmgType', 'model-detail-dmgType');
    const modelDmg = createDetail('model-dmg', 'model-detail-dmg');
    const modelStrength = createDetail('model-strength', 'model-detail-strength');
    const modelDexterity = createDetail('model-dexterity', 'model-detail-dexterity');
    const modelIntelligence = createDetail('model-intelligence', 'model-detail-intelligence');
    const modelResistanceBlunt = createDetail('model-resistance_blunt', 'model-detail-resistance_blunt');
    const modelResistanceProjectile = createDetail('model-resistance_projectile', 'model-detail-resistance_projectile');
    const modelResistanceSlash = createDetail('model-resistance_slash', 'model-detail-resistance_slash');
    const modelResistanceMagic = createDetail('model-resistance_magic', 'model-detail-resistance_magic');
    const modelResistanceFire = createDetail('model-resistance_fire', 'model-detail-resistance_fire');
    const modelResistanceFall = createDetail('model-resistance_fall', 'model-detail-resistance_fall');
    
    const pageName = document.body.getAttribute('data-page');
    const jsonUrl = `../assets/dane/${pageName}.json`;
    const basePath = window.location.pathname.includes('/zawody/') ? '../' : '';

    let models = [];

    // === FUNKCJA BEZPIECZNEGO ŁADOWANIA (dekodowanie SGM -> GLB w pamięci) ===
    async function loadModelSecurely(url) {
        modelViewerElement.setAttribute('src', '');
        spinner.style.display = 'block';

        // Zamień rozszerzenie .glb na .sgm (zakodowany model)
        const sgmUrl = url.replace(/\.glb$/i, '.sgm');

        try {
            const response = await fetch(sgmUrl);

            // Przekierowanie na stronę forbidden, jeśli serwer zwróci 403 (np. blokada Cloudflare)
            if (response.status === 403) {
                window.location.href = basePath + 'forbidden.html';
                return;
            }

            if (!response.ok) throw new Error('Network response was not ok');

            // Pobierz zakodowane dane i zdekoduj XOR
            const encodedData = await response.arrayBuffer();
            const decodedData = _d(encodedData);

            // Stwórz Blob z odkodowanych danych GLB
            const blob = new Blob([decodedData], { type: 'model/gltf-binary' });
            const objectURL = URL.createObjectURL(blob);

            setTimeout(() => {
                modelViewerElement.setAttribute('src', objectURL);
                // Spinner zostanie ukryty przez zdarzenie 'load' model-viewera
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

    function setDetailText(element, label, value) {
        if (value !== null && value !== undefined && value !== 'BRAK' && value !== '' && value !== '0' && value !== '?') {
            element.textContent = `${label}: ${value}`;
            element.style.display = 'block';
        } else {
            element.textContent = '';
            element.style.display = 'none';
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

            if (model.tier) card.setAttribute("data-tier", model.tier);
            if (model.hands) card.setAttribute("data-hands", model.hands);

            const img = document.createElement('img');
            img.src = basePath + model.thumbnail;
            img.alt = isNameAvailable ? model.name : model.title;
            img.loading = "lazy";

            const title = document.createElement('h2');
            title.textContent = isNameAvailable ? model.name : model.title;
            
            if (model.tier && model.tier !== 'BRAK') {
                const tierTag = document.createElement('div');
                tierTag.classList.add('tier-tag', `tier-${model.tier.toLowerCase()}`);
                tierTag.textContent = model.tier;
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
                document.getElementById('model-description').textContent = model.description;

                setDetailText(modelOpis, 'Opis Przedmiotu', model.opis);
                setDetailText(modelWeight, 'Waga', model.weight);
                setDetailText(modelRange, 'Zasięg', model.range);
                setDetailText(modelMagicCircle, 'Magiczny Krąg', model.magicCircle);
                setDetailText(modelManaCost, 'Koszt Many', model.manaCost);
                setDetailText(modelDurability, 'Wytrzymałość', model.durability);
                setDetailText(modelHands, 'Uchwyt', model.hands === "1H" ? "Jednoręczna" : (model.hands === "2H" ? "Dwuręczna" : ""));
                setDetailText(modelUses, 'Liczba użyć', model.uses);
                setDetailText(modelStaminaPerHit, 'Stamina za 1 hit', model.staminaPerHit);
                setDetailText(modelHpPerHit, 'HP za 1 hit', model.hpPerHit);
                setDetailText(modelManaPerHit, 'Mana za 1 hit', model.manaPerHit);
                setDetailText(modelStamina, 'Stamina', model.stamina);
                setDetailText(modelHp, 'HP', model.hp);
                setDetailText(modelMana, 'Mana', model.mana);
                setDetailText(modelDmgType, 'Rodzaj obrażeń', model.dmgType);
                setDetailText(modelDmg, 'DMG', model.dmg);
                setDetailText(modelStrength, 'Wymagana Siła', model.strength);
                setDetailText(modelDexterity, 'Wymagana Zręczność', model.dexterity);
                setDetailText(modelIntelligence, 'Wymagana Inteligencja', model.intelligence);
                setDetailText(modelResistanceBlunt, 'Obrona Obuchowa', model.resistance_blunt);
                setDetailText(modelResistanceProjectile, 'Obrona Pociski', model.resistance_projectile);
                setDetailText(modelResistanceSlash, 'Obrona Sieczna', model.resistance_slash);
                setDetailText(modelResistanceMagic, 'Obrona Magia', model.resistance_magic);
                setDetailText(modelResistanceFire, 'Obrona Ogień', model.resistance_fire);
                setDetailText(modelResistanceFall, 'Obrona Upadek', model.resistance_fall);
                
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
        const query = document.getElementById('search-bar').value.toLowerCase().trim();
        const cards = document.querySelectorAll('.main-card');
        let visible = 0;

        cards.forEach(card => {
            const title = card.dataset.title || "";
            const matchSearch = title.includes(query) || (card.dataset.instance || "").toLowerCase().includes(query);
            const matchTier = !activeTier || card.dataset.tier === activeTier;
            const matchHands = !activeHands || card.dataset.hands === activeHands;
            const matchStat = !activeStat || card.dataset.stat === activeStat;
            const matchDmg = !activeDmg || card.dataset.dmg === activeDmg;
            const matchLetter = !activeLetter || card.dataset.letter === activeLetter;
            
            const match = matchSearch && matchTier && matchHands && matchStat && matchDmg && matchLetter;
            card.style.display = match ? "block" : "none";
            if (match) visible++;
        });

        document.getElementById('no-results').style.display = visible === 0 ? 'block' : 'none';
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
        document.querySelectorAll('#model-info p').forEach(p => { p.textContent = ''; p.style.display = 'none'; });
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