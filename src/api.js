import { renderOverview } from './render.js';

export let allPokemonData = [];
export let renderedPokemonCount = 0; // Initialisieren Sie die Variable
export let isInitialLoad = true;

export const BASE_URL = 'https://pokeapi.co/api/v2/';
let limit = 20;
let offset = 0;

export function incrementRenderedPokemonCount() {
    renderedPokemonCount++;
    //console.log(`renderedPokemonCount nach Inkrement: ${renderedPokemonCount}`);
}

export function resetRenderedPokemonCount() {
    renderedPokemonCount = 0;
    //console.log(`renderedPokemonCount nach Reset: ${renderedPokemonCount}`);
}

export function getCurrentRenderedPokemonCount() {
    return renderedPokemonCount;
}

export async function resetAndLoadInitialPokemons() {
    offset = 0; // Setze den Offset zurück
    allPokemonData = []; // Leere das bestehende Pokémon-Array
    isInitialLoad = true;
    const pokemonContainer = document.getElementById('pokemon-container');
    if (pokemonContainer) {
        pokemonContainer.innerHTML = ''; // Leere den Container
    }
    await fetchPokemonsBaseData(); // Lade die initialen Pokémon

    for (const pokemon of allPokemonData) {
        await fetchPokemonsSpecies(pokemon);
        await fetchPokemonsMovesDetails(pokemon);
    }

    updateUIWithNewPokemons(allPokemonData); // Aktualisiere die UI
}


// Funktion, um den Ladeindikator anzuzeigen
export function showLoadingIndicator() {
    const loadingIndicator = document.querySelector('.spinner-border');
    loadingIndicator.style.display = 'block';
}

// Funktion, um den Ladeindikator zu verstecken
export function hideLoadingIndicator() {
    const loadingIndicator = document.querySelector('.spinner-border');
    loadingIndicator.style.display = 'none';
}

// Funktion zum Laden mehrerer Pokémon
export async function loadMorePokemons() {
    isInitialLoad = false;
    offset += limit; // Erhöhe den Offset um das Limit, um die nächsten Pokémon zu laden

    await fetchPokemonsBaseData(); // Lade Basisdaten für die nächsten Pokémon

    const startIndex = allPokemonData.length - limit; // Bestimme den Startindex der neu hinzugefügten Pokémon

    // Lade Detaildaten für alle Pokémon, optimiert, um nur für neue Pokémon zu laden
    await fetchPokemonsDetails();

    // Warten auf das Laden von Speziesdaten und Bewegungsdetails für jedes neu geladene Pokémon
    const newPokemonsPromises = allPokemonData.slice(startIndex).map(async pokemon => {
        // Hier könnte eine Bedingung hinzugefügt werden, um sicherzustellen, dass es nicht mehrmals aufgerufen wird
        // wenn diese Daten bereits vorhanden sind, ähnlich wie bei fetchPokemonsDetails
        await fetchPokemonsSpecies(pokemon);
        await fetchPokemonsMovesDetails(pokemon);
    });

    await Promise.all(newPokemonsPromises);

    // Überprüfe das gesamte Array nach den Aktualisierungen
    console.log("allPokemonData after updates", allPokemonData);

    // Die neuen Pokémon sind die letzten im Array
    const newPokemons = allPokemonData.slice(-limit);

    // Aktualisiere die UI mit den neuen Pokémon inklusive Details
    updateUIWithNewPokemons(newPokemons);

    hideLoadingIndicator(); // Verstecke den Ladeindikator
}


// Funktion zum Aktualisieren der UI mit neuen Pokémon-Daten
export async function updateUIWithNewPokemons(newPokemonData) {
    
    let localTotalPokemonCount = newPokemonData.length; // Lokale Gesamtanzahl für diese spezifische Ladung
    renderedPokemonCount = 0; // Rücksetzen des gerenderten Pokémon-Zählers
    
    console.log("newPokemonData", newPokemonData); // Gesamte Datenstruktur ausgeben

    const pokemonContainer = document.getElementById('pokemon-container');
    if (!pokemonContainer) {
        console.error('Das Element mit der ID "pokemon-container" wurde nicht gefunden.');
        return;
    }
    for (const pokemon of newPokemonData) {
        console.log("Einzelnes Pokémon-Objekt", pokemon); // Struktur eines einzelnen Pokémon-Objekts
        await renderOverview(pokemon, localTotalPokemonCount);
    }
}

export async function fetchPokemonsBaseData() {
    showLoadingIndicator(); // Zeige den Ladeindikator an
    try {
        const response = await fetch(`${BASE_URL}pokemon?limit=${limit}&offset=${offset}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const newPokemonData = data.results.map(pokemon => {
            return {
                name: pokemon.name,
                url: pokemon.url
            };
        });
        allPokemonData = [...allPokemonData, ...newPokemonData]; // Hinzufügen neuer Daten zum bestehenden Array
    } catch (error) {
        console.error("Error fetching pokemon base data:", error);
    }
    await fetchPokemonsDetails(); // Sie müssen sicherstellen, dass dies korrekt mit den neuen Daten umgeht
    return allPokemonData; // Dies ist möglicherweise nicht notwendig, da allPokemonData bereits aktualisiert wurde
}

function correctSpriteUrl(url) {
    if (!url) {
        // Hier können Sie eine Standard-URL zurückgeben oder einfach `null` beibehalten,
        // abhängig davon, wie Sie mit fehlenden Bildern umgehen möchten.
        return null;
    }

    const prefix = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/';
    if (url.startsWith(prefix)) {
        // Ersetze das Präfix nur, wenn es mehr als einmal vorkommt.
        const correctedUrl = url.replace(new RegExp(`(${prefix})+`), prefix);
        return correctedUrl;
    }
    return url;
}



export async function fetchPokemonsDetails() {
    // Parallele Anfragen für Pokemon Details
    const detailPromises = allPokemonData.map((pokemon, index) =>
        fetchPokemonDetail(pokemon.url)
        .then(detail => {
            // Nur wenn das Pokémon noch keine ausführlichen Details hat, füge sie hinzu
            if (!('details' in allPokemonData[index])) {
                allPokemonData[index] = {...allPokemonData[index], ...detail};
            }
        })
        .catch(error => {
            console.error(`Error fetching pokemon detail for: ${pokemon.name}`, error);
        })
    );

    try {
        // Warte auf den Abschluss aller Detailanfragen, ohne Daten zurückzugeben,
        // da allPokemonData bereits aktualisiert wurde.
        await Promise.all(detailPromises);

        // Parallele Anfragen für Evolutionsdaten nur für Pokémon ohne Evolutionsdaten,
        // Filter Pokemon heraus die bereits Evolutionsdaten haben
        const pokemonsWithoutEvolutions = allPokemonData.filter(pokemon => !pokemon.evolutionData);

        const evolutionPromises = pokemonsWithoutEvolutions.map(pokemon =>
            getEvolutionDataForPokemon(pokemon.name)
            .catch(error => {
                console.error(`Error fetching evolution data for: ${pokemon.name}`, error);
                return null; // Um zu vermeiden, dass das gesamte Promise.all scheitert
            })
        );

        const evolutionData = await Promise.all(evolutionPromises);
        evolutionData.forEach((evolution, i) => {
            if (evolution) {
                const pokemonIndex = allPokemonData.findIndex(pokemon => pokemon.name === pokemonsWithoutEvolutions[i].name);
                if (pokemonIndex !== -1) {
                    allPokemonData[pokemonIndex].evolutionData = evolution;
                }
            }
        });

    } catch (error) {
        console.error("Error fetching pokemon details:", error);
    }
    // Sie brauchen keine Daten zurückzugeben, da allPokemonData global ist und bereits aktualisiert wurde
}

export async function fetchPokemonDetail(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Verarbeiten Sie die Antwort und geben Sie das Detail-Objekt zurück
        return processPokemonDetail(data);
    } catch (error) {
        console.error("Error fetching pokemon detail:", error);
    }
}

function processPokemonDetail(data) {
    // Stats Data Pokemon
    const hpStat = data.stats.find(stat => stat.stat.name === "hp").base_stat;
    const attackStat = data.stats.find(stat => stat.stat.name === "attack").base_stat;
    const defenseStat = data.stats.find(stat => stat.stat.name === "defense").base_stat;
    const specialAttackStat = data.stats.find(stat => stat.stat.name === "special-attack").base_stat;
    const specialDefenseStat = data.stats.find(stat => stat.stat.name === "special-defense").base_stat;
    const speedStat = data.stats.find(stat => stat.stat.name === "speed").base_stat;

    // Calculation with Stats
    const totalStats = hpStat + attackStat + defenseStat + specialAttackStat + specialDefenseStat + speedStat;
    const totalStatProgress = parseFloat((totalStats / 6).toFixed(0));

    // Calculation with height & weight
    const heightInInch = parseFloat((data.height * 3.937 / 10).toFixed(2));
    const weightInLbs = parseFloat((data.weight * 0.2204623).toFixed(2));
    const weightInKg = parseFloat((weightInLbs * 0.45359237).toFixed(2));

    // Urls for further requests
    const speciesUrl = data.species.url;

    // Several pokemon data
    const types = data.types.map(type => type.type.name);
    const abilities = data.abilities.map(ability => ability.ability.name);

    // Pokemon image
    // Versuche, das Sprite aus dem Hauptpfad zu erhalten
    let spriteUrl = data.sprites.other.home.front_default;

    // Wenn das Haupt-Sprite nicht verfügbar ist, verwende das alternative Sprite
    if (!spriteUrl) {
        spriteUrl = data.sprites.other['official-artwork'].front_default;
    }

    // Korrigiere die URL, falls notwendig
    const sprites = correctSpriteUrl(spriteUrl);

    const movesBaseData = data.moves.map(move => {
        return {
            name: move.move.name,
            url: move.move.url,
            versionGroupDetails: move.version_group_details.map(detail => {
                return {
                    levelLearnedAt: detail.level_learned_at,
                    moveLearnMethodName: detail.move_learn_method.name,
                    versionGroupName: detail.version_group.name,
                };
            })
        };
    });

    // Erstelle das pokemonsDetailsData Objekt
    const pokemonsDetailsData = {
        id: data.id,
        name: data.name,
        height: data.height,
        heightInInch: heightInInch,
        weight: data.weight,
        weightInLbs: weightInLbs,
        weightInKg: weightInKg,
        types: types,
        speciesUrl: speciesUrl,
        abilities: abilities,
        baseStats: {
            hp: hpStat,
            attack: attackStat,
            defense: defenseStat,
            specialAttack: specialAttackStat,
            specialDefense: specialDefenseStat,
            speed: speedStat,
            total: totalStats,
            totalProgress: totalStatProgress
        },
        sprites: sprites
    };

    return {
        details: pokemonsDetailsData,
        movesBaseData: movesBaseData // Füge die movesBaseData zum Rückgabeobjekt hinzu
    };
}

export async function fetchPokemonsMovesDetails(pokemon) {
    // Stellen Sie sicher, dass das Pokémon-Objekt existiert und die movesBaseData enthält
    if (!pokemon || !pokemon.movesBaseData) {
        return; // Keine Daten vorhanden, also frühzeitig beenden
    }

    // Erstelle ein Array von Promises für jede Bewegung des Pokémon
    const movesPromises = pokemon.movesBaseData.map(moveBaseData =>
        fetchMoveDetails(moveBaseData).catch(error => {
            console.error("Error fetching move details for", moveBaseData.name, ":", error);
            return null; // Verhindere, dass ein einzelner Fehler das gesamte Promise.all scheitern lässt
        })
    );

    try {
        // Warte auf alle Bewegungsdetails des Pokémon
        const movesDetails = await Promise.all(movesPromises);

        // Füge nur gültige Bewegungsdetails hinzu
        pokemon.movesDetails = movesDetails.filter(move => move !== null);

        // Bereinige movesBaseData
        delete pokemon.movesBaseData;

        // Aktualisieren Sie das allPokemonData-Array
        let pokemonIndex = allPokemonData.findIndex(p => p.name === pokemon.name);
        if (pokemonIndex !== -1) {
            allPokemonData[pokemonIndex] = { ...allPokemonData[pokemonIndex], ...pokemon };
        } else {
            console.error("Pokemon not found in allPokemonData:", pokemon.name);
        }

    } catch (error) {
        console.error("Error processing moves details:", error);
    }
}




async function fetchMoveDetails(moveBaseData) {
    try {
        const response = await fetch(moveBaseData.url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const moveDetails = await response.json();
        
        return {
            moveName: moveBaseData.name,
            moveUrl: moveBaseData.url,
            moveType: moveDetails.type.name,
            movePower: moveDetails.power,
            moveDamageClass: moveDetails.damage_class.name,
            versionGroupDetails: moveBaseData.versionGroupDetails
        };
    } catch (error) {
        console.error("Error fetching move details for", moveBaseData.name, ":", error);
        throw error; // Wirft den Fehler weiter, damit das catch oben ihn behandeln kann
    }
}

export async function fetchPokemonsSpecies(pokemon) {
    console.log("fetchPokemonsSpecies called for", pokemon.name); // Hinzugefügt
    // Stellen Sie sicher, dass das Pokémon-Objekt existiert und die speciesUrl enthält
    if (!pokemon || !pokemon.details || !pokemon.details.speciesUrl) {
        return; // Keine Daten vorhanden, also frühzeitig beenden
    }

    try {
        // Rufen Sie die Artendaten für das einzelne Pokémon ab
        const species = await fetchPokemonSpecies(pokemon.details.speciesUrl);
        
        if (species) {
            console.log("Species data fetched for", pokemon.name, species); // Hinzugefügt
            // Aktualisieren Sie das übergebene Pokémon-Objekt mit den neuen Speziesdaten
            pokemon.details = { ...pokemon.details, ...species };

            // Aktualisieren Sie das allPokemonData-Array
            let pokemonIndex = allPokemonData.findIndex(p => p.name === pokemon.name);
            if (pokemonIndex !== -1) {
                allPokemonData[pokemonIndex] = { ...allPokemonData[pokemonIndex], ...pokemon };
            } else {
                console.error("Pokemon not found in allPokemonData:", pokemon.name);
            }
        }
    } catch (error) {
        console.error("Error fetching species data for", pokemon.name, ":", error);
    }
}


async function fetchPokemonSpecies(speciesUrl) {

    try {
        const response = await fetch(speciesUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Überprüfen Sie, ob die genera-Daten vorhanden sind und ob es eine englische Bezeichnung gibt
        const genusEntry = data.genera.find(g => g.language.name === 'en');
        // Setzen Sie den genus-Wert, verwenden Sie "Unknown" als Fallback
        const genusWithPokemon = genusEntry ? genusEntry.genus : "Unknown";
        const genusWithoutPokemon = genusWithPokemon.replace(" Pokémon", "");
        const captureRate = data.capture_rate;
        const genderRate = data.gender_rate;
        const genderRateFemale = genderRate >= 0 ? Math.floor(genderRate / 8 * 100) : null;
        const genderRateMale = genderRate >= 0 ? 100 - genderRateFemale : null;
        const eggGroups = data.egg_groups.map(eggGroup => eggGroup.name);

        return {
            captureRate: captureRate,
            genderRateFemale: genderRateFemale,
            genderRateMale: genderRateMale,
            eggGroups: eggGroups,
            genusWithoutPokemon: genusWithoutPokemon
        };
    } catch (error) {
        console.error("Error fetching species data for URL:", speciesUrl, ":", error);
        throw error; // Werfe den Fehler weiter, damit das catch in fetchPokemonsSpecies ihn handhaben kann
    }
}

// Funktion, um die Pokemon-Thumbnail-URL zu erhalten
async function getPokemonThumbnail(pokemonId) {
    if (typeof pokemonId === 'undefined') {
        console.error('Keine gültige Pokemon-ID übergeben');
        return null; // oder URL eines Standard-Thumbnails
    }
    
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    let thumbnailUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`;

    // Korrigiere die URL, bevor du sie zurückgibst
    return correctSpriteUrl(thumbnailUrl);
}

// Rekursive Funktion, um die Evolutionskette zu extrahieren
function extractEvolutionChain(chain) {
    const pokemonName = chain.species.name;
    const pokemonSpeciesUrl = chain.species.url;
    const pokemonId = pokemonSpeciesUrl.split("/").filter(Boolean).pop(); // Extrahiert die ID aus der URL

    let min_level = null;
    if (chain.evolution_details.length > 0) {
        // Extrahieren des min_level aus den Evolutionsdetails, falls vorhanden
        min_level = chain.evolution_details[0].min_level;
    }

    const result = {
        id: parseInt(pokemonId),
        name: pokemonName,
        thumbnail: null, // Dies wird später aktualisiert
        min_level: min_level
    };

    // Wenn es eine weitere Evolution gibt, fügen Sie sie hinzu
    if (chain.evolves_to.length > 0) {
        result.next_evolution = extractEvolutionChain(chain.evolves_to[0]);
    }

    return result;
}




// Hilfsfunktion, um die rekursive Evolutionskette in ein flaches Array zu konvertieren
function flattenEvolutionChain(chain) {
    const result = [];
    let current = chain;
    while (current) {
        result.push(current);
        current = current.next_evolution;
    }
    return result;
}

// Diese Funktion aktualisiert die Thumbnails rekursiv für jedes Element der Evolutionskette.
async function updateEvolutionThumbnails(evolution) {
    if (evolution) {
        // Prüfen, ob eine gültige ID vorhanden ist
        if (evolution.id) {
            try {
                evolution.thumbnail = await getPokemonThumbnail(evolution.id);
            } catch (error) {
                console.error("Fehler beim Laden des Thumbnails für", evolution.name, ":", error);
                evolution.thumbnail = null; // Setze ein Standard-Thumbnail oder belasse es bei null
            }
        }

        // Rekursiver Aufruf für die nächste Evolution
        if (evolution.next_evolution) {
            await updateEvolutionThumbnails(evolution.next_evolution);
        }
    }
}

export async function getEvolutionDataForPokemon(pokemonId) {
    try {
        //console.log('Abrufen der Evolutionsdaten für Species ID', pokemonId);

        // Zuerst die Pokémon-Spezies-URL abrufen, um die Evolutionskette-URL zu erhalten
        const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}/`);
        if (!speciesResponse.ok) {
            throw new Error(`HTTP error! status: ${speciesResponse.status}`);
        }
        const speciesData = await speciesResponse.json();
        //console.log('Species-Daten:', speciesData);
        const evolutionChainUrl = speciesData.evolution_chain.url;

        // Evolutionskette abrufen
        const evolutionResponse = await fetch(evolutionChainUrl);
        if (!evolutionResponse.ok) {
            throw new Error(`HTTP error! status: ${evolutionResponse.status}`);
        }
        const evolutionData = await evolutionResponse.json();
        //console.log('Evolutionskettendaten:', evolutionData);

        // Extrahieren Sie die Evolutionskette
        const evolutionChain = extractEvolutionChain(evolutionData.chain);
        //console.log('Extrahierte Evolutionskette:', evolutionChain);

        // Rekursiv die Thumbnails für die gesamte Evolutionskette aktualisieren
        await updateEvolutionThumbnails(evolutionChain);
        //console.log('Aktualisierte Evolutionskette mit Thumbnails:', evolutionChain);

        // Konvertieren Sie die rekursive Evolutionskette in ein flaches Array
        const flatEvolutionArray = flattenEvolutionChain(evolutionChain);
        //console.log('Flache Evolutionskette:', flatEvolutionArray);

        return flatEvolutionArray;

    } catch (error) {
        console.error("Fehler bei der Fetch-Operation:", error);
    }
}



