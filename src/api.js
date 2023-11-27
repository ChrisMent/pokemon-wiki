import {
    renderOverview,
    updateArrowVisibility
} from './render.js';
import {
    applyFilters
} from './modal.js';
import {
    showLoadingIndicator,
    hideLoadingIndicator,
    correctSpriteUrl,
    flattenEvolutionChain,
    extractEvolutionChain,
    updateEvolutionThumbnails,
    getPokemonThumbnail
} from './utils.js';

// Definieren der globalen Variablen
export let allPokemonData = []; // Array mit allen Pokemon Daten
export let isInitialLoad = true; // Feststellung Zustand (Initiales Laden / Suche / Mehr Laden)
let renderedPokemonCount = 0; // Zählen wie viele Pokemons gerendert wurden

// Basis URL der API für den Datenabruf
export const BASE_URL = 'https://pokeapi.co/api/v2/';
let limit = 1; // Festlegen wie viele Pokémon-Einträge pro Anfrage abgerufen werden.
let offset = 0; // Ist der Startpunkt der Daten, beim API-Abruf: 0 die Datenabfrage beginnt von der ersten verfügbaren Ressource.

//! Abruf der Basisdaten von der API
export async function fetchPokemonsBaseData() {
    showLoadingIndicator(); // Zeige den Ladeindikator an
    try {
        const response = await fetch(`${BASE_URL}pokemon?limit=${limit}&offset=${offset}`); // Abrufen der Daten
        if (!response.ok) { // Wenn der Abruf scheitert, dann werfe eine Fehlermeldung
            throw new Error(`HTTP error! status: ${response.status}`); // Die Antwort mit dem dazugehörigen Status
        }
        const data = await response.json(); // Abrufen von Daten: count, next, Array --> results und des response headers. Antwort wird als JSON verarbeitet
        //console.log ('Data structure: ', data)
        // Speichern der relevanten Daten in einer Konstanten mit einer Datenstruktur (pokemon: name, url) je Pokemon die in der Abrufliste waren.
        const newPokemonData = data.results.map(pokemon => {
            return {
                name: pokemon.name,
                url: pokemon.url
            };
        });
        // Hinzufügen newPokemonData zum Array allPokemonData mit einem Spread Operator (...)
        allPokemonData = [...allPokemonData, ...newPokemonData]; 
    
    //Im catch-Teil der Funktion wird der Fehlerbehandlungsmechanismus von JavaScript verwendet, um auf Fehler zu reagieren, die während der Ausführung des try-Blocks auftreten können
    } catch (error) {
        console.error("Error fetching pokemon base data:", error);
    }
    // Der Code führt fetchPokemonsDetails() aus und wartet, bis diese Funktion abgeschlossen ist. Erst danach wird das allPokemonData Array zurückgegeben. 
    await fetchPokemonsDetails(); 
    /* anschließend werden die Daten an das Array: allPokemonData zurückgegeben.
       1. Zunächst einmal alle "details" & "moveBaseData" Daten abgearbeitet
       2. Dann folgen die Evolutionsdaten. ERster try block in fetchPokemonsDetails
       */
    return allPokemonData; 
}

//! Abruf der Detaildaten der Pokemons
export async function fetchPokemonsDetails() {
    // Die Callback Funktion map nimmt zwei Parameter entgegen: pokemon und index.
    // - pokemon repräsentiert das aktuelle Element aus dem Array allPokemonData
    // - index ist der Index des aktuellen Elements im Array. 
    const detailPromises = allPokemonData.map((pokemon, index) =>      
    
    // Jetzt mit pokemon eine Variable zur Verfügung die (name, url) enthält. Anhand der Url können die Detaildaten aufgerufen werden.
    
    // Übergabe der url an die Funktion
    fetchPokemonDetail(pokemon.url) 
        // Wenn die ganzen detail, move - Daten generiert wurden dann füge sie allPokemonData hinzu.
        .then(detail => {
            // Der Operator "in" prüft, ob ein Objekt "details" enthält Falls diese Eigenschaft tatsächlich nicht vorhanden ist, wird sie dem Objekt hinzugefügt. 
            if (!('details' in allPokemonData[index])) // prüft ob "true"
            
            {
                // Hinzufügen mit Spread Operator an der  Stelle [index] für das spezifische Pokemon, welches gerade iteriert bzw. genriert wird.
                allPokemonData[index] = {
                    ...allPokemonData[index],
                    ...detail
                };
            }
        })
        .catch(error => {
            console.error(`Error fetching pokemon detail for: ${pokemon.name}`, error);
        })
    );

    // Zweiter Teil der Funktion wird erst gestartet nachdem "details" und "moveBaseData" erstellt wurden.

    try {
        // Wartet mit await auf den Abschluss aller Detailanfragen ("details" & "moves"), ohne Daten zurückzugeben.
        
        await Promise.all(detailPromises);

        // Filtere Pokémon ohne Evolutionsdaten heraus.
        const pokemonsWithoutEvolutions = allPokemonData.filter(pokemon => !pokemon.evolutionData);
        
        // Nach dem diePokemon ohne Evolutionsdaten bekannt sind. Wird hier jetzt ein Array in einer Konstanten erstellt, um Evolutionsdaten für die gefilterten Pokémon zu laden.
        const evolutionPromises = pokemonsWithoutEvolutions.map(pokemon =>
            // Der Pokemon "name" wird dann der Funktion getEvolutionDataForPokemon übergeben.
            getEvolutionDataForPokemon(pokemon.name)
            .catch(error => {
                console.error(`Error fetching evolution data for: ${pokemon.name}`, error);
                return null; // Um zu vermeiden, dass das gesamte Promise.all scheitert
            })
        );
        // Warte auf die Evolutionsdaten-Promises und verarbeite die Ergebnisse.
        const evolutionData = await Promise.all(evolutionPromises);
        evolutionData.forEach((evolution, i) => {
            if (evolution) {
                // Finde den Index des Pokémon im allPokemonData Array und füge die Evolutionsdaten hinzu.
                const pokemonIndex = allPokemonData.findIndex(pokemon => pokemon.name === pokemonsWithoutEvolutions[i].name);
                if (pokemonIndex !== -1) {
                    allPokemonData[pokemonIndex].evolutionData = evolution;
                }
            }
        });

    } catch (error) {
        // Logge Fehler, die während der Verarbeitung der Evolutionsdaten auftreten.
        console.error("Error fetching pokemon details:", error);
    }

}

// Abrufen der Detaildaten von der API für jedes Pokemon das generiert werden soll: url = "https://pokeapi.co/api/v2/pokemon/1/"

export async function fetchPokemonDetail(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Erhalten der Detaildaten und speichern in data. In data stehen jetzt alle detaildaten der Pokemons drin
        const data = await response.json();
        //--> return processPokemonDetail(data): Nachdem die Daten erfolgreich empfangen und in JSON umgewandelt wurden, werden sie an die Funktion processPokemonDetail weitergeleitet und verarbeitet.
        return processPokemonDetail(data);
        // Das "data" Objekt enthält die Detaildaten des Pokémon
    } catch (error) {
        console.error("Error fetching pokemon detail:", error);
    }
}
// Finden der benötigten Stats Data der Pokemons und zurodnen zum speichern in der Konstanten.
function processPokemonDetail(data) {
    // Basis Daten
    const id =  data.id;
    const name = data.name;
    
    // Sucht den Ausdruck data.stats.find(stat => stat.stat.name === "xxx").base_stat in einem Array data.stats nach dem ersten Objekt, dessen stat.name gleich "xxx" ist, und gibt dann den Wert der Eigenschaft base_stat dieses spezifischen Objekts zurück.
    // Generierung der Stats Data
    const hpStat = data.stats.find(stat => stat.stat.name === "hp").base_stat;
    const attackStat = data.stats.find(stat => stat.stat.name === "attack").base_stat;
    const defenseStat = data.stats.find(stat => stat.stat.name === "defense").base_stat;
    const specialAttackStat = data.stats.find(stat => stat.stat.name === "special-attack").base_stat;
    const specialDefenseStat = data.stats.find(stat => stat.stat.name === "special-defense").base_stat;
    const speedStat = data.stats.find(stat => stat.stat.name === "speed").base_stat;

    // Berechnungen für die Stats
    const totalStats = hpStat + attackStat + defenseStat + specialAttackStat + specialDefenseStat + speedStat;
    const totalStatProgress = parseFloat((totalStats / 6).toFixed(0));

    // Berechnungen für height & weight
    const height = data.height;
    const weight = data.weight;
    const heightInInch = parseFloat((height * 3.937 / 10).toFixed(2));
    const weightInLbs = parseFloat((weight * 0.2204623).toFixed(2));
    const weightInKg = parseFloat((weightInLbs * 0.45359237).toFixed(2));

    // Urls für die Species - Daten
    const speciesUrl = data.species.url;

    // Type Namen
    const types = data.types.map(type => type.type.name);

    // Abilitiy Namen
    const abilities = data.abilities.map(ability => ability.ability.name);

    // Pokemon Bild
    let spriteUrl = data.sprites.other.home.front_default;

    // Wenn das Hauptbild nicht verfügbar ist, verwende ein alternatives Bild
    if (!spriteUrl) {
        spriteUrl = data.sprites.other['official-artwork'].front_default;
    }

    // Springe in die Funktion: correctSpriteUrl und korrigiere die URL, falls notwendig
    const sprites = correctSpriteUrl(spriteUrl);

    // Erstelle das pokemonsDetailsData Objekt
    const pokemonsDetailsData = {
        id: id,
        name: name,
        height: height,
        heightInInch: heightInInch,
        weight: weight,
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
      
    // Generieren der Basisdaten für die Moves immer noch aus data Datenfeed, der pokemon Details. Basierend auf den Kategorie Moves
    const movesBaseData = data.moves.map(move => {
        // Gebe den Namen und die URL für die Detail Moves in einem Variablen mit Namen "move" zurück.
        return {
            name: move.move.name,
            url: move.move.url,
            versionGroupDetails: move.version_group_details.map(detail => {
                // Da versionGroupDetails weiter Unterinformationen enthält werden diese weiter gemappt gemappt und unter "detail" gespeichert
                return {
                    levelLearnedAt: detail.level_learned_at,
                    moveLearnMethodName: detail.move_learn_method.name,
                    versionGroupName: detail.version_group.name,
                };
            })
        };
    });
    
    /* Die Funktion gibt ein Objekt zurück, das aus zwei Teilen besteht:
    details: Enthält die Daten aus pokemonsDetailsData.
    movesBaseData: Enthält die Daten aus movesBaseData, die zuvor durch die Verarbeitung eines anderen Arrays generiert wurden.*/ 
    return {
        details: pokemonsDetailsData,
        movesBaseData: movesBaseData 
    };
}

//! Abruf der Evolutionsdaten der Pokemons

export async function getEvolutionDataForPokemon(pokemonName) {
    try {
        // Aufrufen der Pokémon-Spezies-URL abrufen, um die Evolutionskette-URL zu erhalten. 
        const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}/`);
        if (!speciesResponse.ok) {
            throw new Error(`HTTP error! status: ${speciesResponse.status}`);
        }
        // Erhalten der Species Daten als JSON
        const speciesData = await speciesResponse.json();
              
        // Extrahieren der URL aus speciesData für die Evolutionskette
        const evolutionChainUrl = speciesData.evolution_chain.url;

        /* Komplette Evolutionskette abrufen aus der extrahierten Kette:
        --> "https://pokeapi.co/api/v2/evolution-chain/1/" */
        const evolutionResponse = await fetch(evolutionChainUrl);
        if (!evolutionResponse.ok) {
            throw new Error(`HTTP error! status: ${evolutionResponse.status}`);
        }
        // Extrahiere ALLE Daten aus der Evolution Kette
        const evolutionData = await evolutionResponse.json();
        
        // Extrahieren Sie die NUR die Evolutionskette "chain" und rufe die Funktion extractEvolutionChain. Übergebe dabei die Evolutionskette "chain"
        const evolutionChain = extractEvolutionChain(evolutionData.chain);

        // Rekursiv die Thumbnails aufrufen und für die gesamte Evolutionskette speichern/ aktualisieren
        await updateEvolutionThumbnails(evolutionChain);

        // Konvertieren Sie die rekursive Evolutionskette in ein flaches Array
        const flatEvolutionArray = flattenEvolutionChain(evolutionChain);

        return flatEvolutionArray;

    } catch (error) {
        console.error("Fehler bei der Fetch-Operation:", error);
    }
}

//! Abruf der Move - Daten der Pokemons
export async function fetchPokemonsMovesDetails(pokemon) {
    // Überprüfen, ob das Pokémon-Objekt und notwendige Informationen vorhanden sind.
    if (!pokemon || !pokemon.details || !allPokemonData.some(p => p.name === pokemon.name)) {
        console.info(`Pokemon ${pokemon.name} not found in allPokemonData for moves details.`);
        return;
    }

    // Erstelle ein Array von Promises, eines für jede Bewegung (Move) des Pokémon.
    const movesPromises = pokemon.movesBaseData.map(moveBaseData =>
        fetchMoveDetails(moveBaseData).catch(error => {
            // Fehlerbehandlung für den Fall, dass das Abrufen der Bewegungsdetails fehlschlägt.
            console.error("Error fetching move details for", moveBaseData.name, ":", error);
            return null; // Verhindere, dass der Fehler das gesamte Promise.all scheitern lässt.
        })
    );

    try {
        // Warten auf das Ergebnis aller Promises, die die Bewegungsdetails laden.
        const movesDetails = await Promise.all(movesPromises);

        // Filtern, um sicherzustellen, dass nur gültige Bewegungsdetails behalten werden.
        pokemon.movesDetails = movesDetails.filter(move => move !== null);

        // Entferne die vorläufigen movesBaseData, da jetzt detailliertere Informationen vorliegen.
        delete pokemon.movesBaseData;

        // Finde das Pokémon im allPokemonData-Array und aktualisiere es mit den neuen Bewegungsdetails.
        let pokemonIndex = allPokemonData.findIndex(p => p.name === pokemon.name);
        if (pokemonIndex !== -1) {
            allPokemonData[pokemonIndex] = {
                ...allPokemonData[pokemonIndex],
                movesDetails: pokemon.movesDetails
            };
            // Optional: Aktualisiere die Benutzeroberfläche, um die neuen Daten anzuzeigen.
            updateUIAfterDataFetch(pokemonIndex);
        } else {
            console.error("Pokemon not found in allPokemonData:", pokemon.name);
        }
    } catch (error) {
        // Allgemeine Fehlerbehandlung für den Prozess der Bewegungsdatenabfrage.
        console.error("Error processing moves details:", error);
    }
}

// Funktion zum Abrufen der detaillierten Daten einer Pokémon-Bewegung.
async function fetchMoveDetails(moveBaseData) {
    try {
        // Netzwerkanfrage zur Abfrage detaillierter Informationen zu einer spezifischen Bewegung.
        const response = await fetch(moveBaseData.url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Umwandlung der Antwort in ein JSON-Objekt.
        const moveDetails = await response.json();

        // Erstellung und Rückgabe eines Objekts mit detaillierten Informationen zur Bewegung.
        return {
            moveName: moveBaseData.name,
            moveUrl: moveBaseData.url,
            moveType: moveDetails.type.name,
            movePower: moveDetails.power,
            moveDamageClass: moveDetails.damage_class.name,
            versionGroupDetails: moveBaseData.versionGroupDetails
        };
    } catch (error) {
        // Fehlerbehandlung, falls das Abrufen der Bewegungsdetails fehlschlägt.
        console.error("Error fetching move details for", moveBaseData.name, ":", error);
        throw error; // Weiterleitung des Fehlers zur oberen Fehlerbehandlung.
    }
}

//! Abruf der Species - Daten der Pokemons

export async function fetchPokemonsSpecies(pokemon) {
    // Überprüfen, ob das übergebene Pokémon-Objekt gültig ist und eine URL für Artendaten (speciesUrl) enthält.
    if (!pokemon || !pokemon.details || !allPokemonData.some(p => p.name === pokemon.name)) {
        console.info(`Pokemon ${pokemon.name} not found in allPokemonData for species.`);
        return;
    }

    try {
        // Asynchrones Abrufen der Artendaten (Species) des Pokémon anhand der in den Details gespeicherten URL.
        const species = await fetchPokemonSpecies(pokemon.details.speciesUrl);

        // Überprüfen, ob Artendaten erfolgreich abgerufen wurden.
        if (species) {
            // Konsolenlog zur Bestätigung der erfolgreichen Abfrage der Artendaten.
            //console.log("Species data fetched for", pokemon.name, species);

            // Aktualisieren des übergebenen Pokémon-Objekts mit den neuen Artendaten.
            // Dies geschieht durch Zusammenführen der bestehenden Details mit den neu abgerufenen Artendaten.
            pokemon.details = {
                ...pokemon.details,
                ...species
            };

            // Suche im allPokemonData-Array nach dem entsprechenden Pokémon und aktualisiere seine Daten.
            let pokemonIndex = allPokemonData.findIndex(p => p.name === pokemon.name);
            if (pokemonIndex !== -1) {
                // Aktualisieren des Eintrags im allPokemonData-Array mit den neuen, kombinierten Daten.
                allPokemonData[pokemonIndex] = {
                    ...allPokemonData[pokemonIndex],
                    ...pokemon
                };
            } else {
                // Fehlermeldung, wenn das Pokémon im allPokemonData-Array nicht gefunden wird.
                console.error("Pokemon not found in allPokemonData:", pokemon.name);
            }
        }
    } catch (error) {
        // Fehlerbehandlung, falls beim Abrufen der Artendaten ein Fehler auftritt.
        console.error("Error fetching species data for", pokemon.name, ":", error);
    }
}

// Funktion zum Abrufen der Artendaten eines Pokémon.
async function fetchPokemonSpecies(speciesUrl) {
    try {
        // Netzwerkanfrage zur Abfrage der Artendaten.
        const response = await fetch(speciesUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Umwandlung der Antwort in ein JSON-Objekt.
        const data = await response.json();

        // Extraktion und Verarbeitung spezifischer Informationen aus den Artendaten.
        const genusEntry = data.genera.find(g => g.language.name === 'en');
        const genusWithPokemon = genusEntry ? genusEntry.genus : "Unknown";
        const genusWithoutPokemon = genusWithPokemon.replace(" Pokémon", "");
        const captureRate = data.capture_rate;
        const genderRate = data.gender_rate;
        const genderRateFemale = genderRate >= 0 ? Math.floor(genderRate / 8 * 100) : null;
        const genderRateMale = genderRate >= 0 ? 100 - genderRateFemale : null;
        const eggGroups = data.egg_groups.map(eggGroup => eggGroup.name);

        // Rückgabe der verarbeiteten Artendaten.
        return {
            captureRate: captureRate,
            genderRateFemale: genderRateFemale,
            genderRateMale: genderRateMale,
            eggGroups: eggGroups,
            genusWithoutPokemon: genusWithoutPokemon
        };
    } catch (error) {
        // Fehlerbehandlung, falls das Abrufen der Artendaten fehlschlägt.
        console.error("Error fetching species data for URL:", speciesUrl, ":", error);
        throw error; // Weiterleitung des Fehlers zur oberen Fehlerbehandlung.
    }
}

//! Hilfsfunktionen

// Funktion: resetAndLoadInitialPokemons
// Zweck: Initialisiert die Anwendung neu und lädt die Basisdaten der Pokémon.
export async function resetAndLoadInitialPokemons() {
    // Setze den Offset für die API-Anfragen zurück. 
    // Dies ist nützlich, wenn Paginierung in der API verwendet wird.
    offset = 0;

    // Leere das Array, das alle Pokémon-Daten speichert.
    // Dies stellt sicher, dass bei einer Neuinitialisierung keine alten Daten vorhanden sind.
    allPokemonData = [];

    // Setze einen Flag, um den Zustand der Initialisierung der Anwendung zu markieren.
    isInitialLoad = true;

    // Suche nach dem Container-Element in der Benutzeroberfläche, 
    // in dem Pokémon-Daten angezeigt werden.
    const pokemonContainer = document.getElementById('pokemon-container');

    // Überprüfe, ob das Container-Element existiert und leere seinen Inhalt.
    // Dies ist nötig, um sicherzustellen, dass keine alten Daten angezeigt werden.
    if (pokemonContainer) {
        pokemonContainer.innerHTML = '';
    }

    // Rufe die Funktion auf, um die Basisdaten der Pokémon zu laden.
    await fetchPokemonsBaseData();

    // Durchlaufe alle geladenen Pokémon und lade zusätzliche Details für jedes Pokémon.
    // Dazu gehören Arten- (Species) und Bewegungs- (Moves) Informationen.
    for (const pokemon of allPokemonData) {
        await fetchPokemonsSpecies(pokemon);
        await fetchPokemonsMovesDetails(pokemon);
    }

    // Aktualisiere die Benutzeroberfläche mit den neu geladenen Pokémon-Daten.
    updateUIWithNewPokemons(allPokemonData);
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
    //console.log("allPokemonData after updates", allPokemonData);

    // Die neuen Pokémon sind die letzten im Array
    const newPokemons = allPokemonData.slice(-limit);

    // Aktualisiere die UI mit den neuen Pokémon inklusive Details
    updateUIWithNewPokemons(newPokemons);
    hideLoadingIndicator(); // Verstecke den Ladeindikator
    updateArrowVisibility();
    //console.log("Nach dem Laden - renderedPokemonCount: ", getRenderedPokemonCount());
}

// Funktion zum Aktualisieren der UI mit neuen Pokémon-Daten
export async function updateUIWithNewPokemons(newPokemonData) {

    let localTotalPokemonCount = newPokemonData.length; // Lokale Gesamtanzahl für diese spezifische Ladung
    //renderedPokemonCount = 0; // Rücksetzen des gerenderten Pokémon-Zählers

    //console.log("newPokemonData", newPokemonData); // Gesamte Datenstruktur ausgeben

    const pokemonContainer = document.getElementById('pokemon-container');
    if (!pokemonContainer) {
        console.error('Das Element mit der ID "pokemon-container" wurde nicht gefunden.');
        return;
    }
    for (const pokemon of newPokemonData) {
        //console.log("Einzelnes Pokémon-Objekt", pokemon); // Struktur eines einzelnen Pokémon-Objekts
        await renderOverview(pokemon, localTotalPokemonCount);
    }
}

// Funktion: getRenderedPokemonCount
// Zweck: Gibt den aktuellen Wert der gerenderten Pokémon zurück.
// Rückgabe: Die Anzahl der bisher gerenderten Pokémon.

export function getRenderedPokemonCount() {
    return renderedPokemonCount;
}
// Funktion: incrementRenderedPokemonCount
// Zweck: Erhöht den Zähler für gerenderte Pokémon um eins.
// Anwendung: Sollte aufgerufen werden, nachdem ein Pokémon erfolgreich gerendert wurde.

export function incrementRenderedPokemonCount() {
    renderedPokemonCount++;
}

// Funktion: resetRenderedPokemonCount
// Zweck: Setzt den Zähler für gerenderte Pokémon zurück auf null.
// Anwendung: Sollte aufgerufen werden, wenn eine neue Liste von Pokémon geladen wird,
// um den Zähler für die neue Liste zu initialisieren.

export function resetRenderedPokemonCount() {
    renderedPokemonCount = 0;
}


// Funktion: updateUIAfterDataFetch
// Zweck: Diese Funktion aktualisiert die Benutzeroberfläche, speziell den Bereich der Pokémon-Bewegungen,
// nachdem die Daten erfolgreich abgerufen wurden.
function updateUIAfterDataFetch(pokemonIndex) {
    // Überprüfen, ob bestimmte Elemente im DOM vorhanden sind.
    // Diese Elemente sind für die Anzeige von Pokémon-Bewegungen vorgesehen.
    if (document.getElementById('pokemon-moves-header') && document.getElementById('pokemon-moves')) {
        // Zugriff auf das spezifische Pokémon-Objekt aus dem allPokemonData-Array mit dem übergebenen Index.
        const pokemon = allPokemonData[pokemonIndex];

        // Überprüfen, ob das Pokémon-Objekt Bewegungsdetails (movesDetails) enthält.
        if (pokemon.movesDetails) {
            // Anwenden von Filtern auf die Bewegungsdetails des Pokémon.
            // 'sun-moon' und 'level-up' könnten spezifische Filterkriterien oder Kategorien sein,
            // die bestimmen, welche Bewegungen angezeigt werden sollen.
            applyFilters(pokemon.movesDetails, 'sun-moon', 'level-up');
        }
    }
}


