import { renderOverview } from './render.js';

export let allPokemonData = [];

const BASE_URL = 'https://pokeapi.co/api/v2/';
let limit = 20;
let offset = 0;

// Funktion zum Laden mehrerer Pokémon
export async function loadMorePokemons() {
    offset += limit; // Erhöhe den Offset um das Limit, um die nächsten Pokémon zu laden
    await fetchPokemonsBaseData();
    // Hier würden Sie die Funktion aufrufen, die die UI aktualisiert, z.B.:
    updateUIWithNewPokemons(allPokemonData.slice(-limit)); // Aktualisiere die UI mit den letzten 20 geladenen Pokémon
}

// Funktion zum Aktualisieren der UI mit neuen Pokémon-Daten
function updateUIWithNewPokemons(newPokemonData) {
    const pokemonContainer = document.getElementById('pokemon-container');
    if (!pokemonContainer) {
        console.error('Das Element mit der ID "pokemon-container" wurde nicht gefunden.');
        return;
    }
    newPokemonData.forEach(pokemon => {
        renderOverview(pokemon); // Verwenden Sie die bestehende Funktion, um die Karten zu rendern
    });
}


// Funktion zum Erstellen eines neuen Pokémon-Elements
function createPokemonElement(pokemon) {
    const pokemonElement = document.createElement('div');
    pokemonElement.className = 'pokemon'; // Fügen Sie hier Ihre eigenen Klassen hinzu
    pokemonElement.innerHTML = `
        <h3>${pokemon.name}</h3>
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <!-- Weitere Pokémon-Informationen hier einfügen -->
    `;
    return pokemonElement;
}

export async function fetchPokemonsBaseData() {
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
    const prefix = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/';
    if (url.startsWith(prefix)) {
      // Entferne das doppelte Vorkommen des Präfixes
      const correctedUrl = url.replace(new RegExp(`^(${prefix})+`), prefix);
      return correctedUrl;
    }
    return url;
  }

  export async function fetchPokemonsDetails() {
    // Parallele Anfragen für Pokemon Details
    const detailPromises = allPokemonData.map(pokemon =>
        fetchPokemonDetail(pokemon.url)
    );

    try {
        const details = await Promise.all(detailPromises);
        details.forEach((detail, i) => {
            if (detail) { // Stellen Sie sicher, dass die Details nicht null sind
                allPokemonData[i] = { ...allPokemonData[i], ...detail };
            }
        });

        // Parallele Anfragen für Evolutionsdaten
        const evolutionPromises = allPokemonData.map(pokemon =>
            getEvolutionDataForPokemon(pokemon.name).catch(error => {
                console.error("Error fetching evolution data for", pokemon.name, ":", error);
                return null; // Um zu vermeiden, dass das gesamte Promise.all scheitert
            })
        );

        const evolutionData = await Promise.all(evolutionPromises);
        evolutionData.forEach((evolution, i) => {
            if (evolution) {
                allPokemonData[i].evolutionData = evolution;
            }
        });

    } catch (error) {
        console.error("Error fetching pokemon details:", error);
    }
    // Sie brauchen keine Daten zurückzugeben, da allPokemonData global ist
}

async function fetchPokemonDetail(url) {
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
    const sprites = correctSpriteUrl(data.sprites.other.home.front_default);

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

export async function fetchPokemonsMovesDetails() {
    // Erstelle ein Array von Arrays mit Promises für jede Bewegung jedes Pokémon
    const movesPromises = allPokemonData.map(pokemon =>
        pokemon.tempMovesBaseData.map(moveBaseData =>
            fetchMoveDetails(moveBaseData).catch(error => {
                console.error("Error fetching move details for", moveBaseData.name, ":", error);
                return null; // Verhindere, dass ein einzelner Fehler das gesamte Promise.all scheitern lässt
            })
        )
    );

    try {
        // Verarbeite jedes Pokémon einzeln
        for (let i = 0; i < movesPromises.length; i++) {
            // Warte auf alle Bewegungsdetails des aktuellen Pokémon
            const movesDetails = await Promise.all(movesPromises[i]);
            // Füge nur gültige Bewegungsdetails hinzu
            allPokemonData[i].movesDetails = movesDetails.filter(move => move !== null);
            // Bereinige tempMovesBaseData
            delete allPokemonData[i].tempMovesBaseData;
        }
    } catch (error) {
        console.error("Error processing moves details:", error);
    }

    return allPokemonData;
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

export async function fetchPokemonsSpecies() {
    const speciesPromises = allPokemonData.map(pokemon =>
        fetchPokemonSpecies(pokemon.speciesUrl).catch(error => {
            console.error("Error fetching species data for", pokemon.name, ":", error);
            return null; // Um zu vermeiden, dass das gesamte Promise.all scheitert
        })
    );

    try {
        const speciesData = await Promise.all(speciesPromises);
        speciesData.forEach((species, i) => {
            
            if (species) {
                allPokemonData[i].details = { ...allPokemonData[i].details, ...species };
            }
        });
    } catch (error) {
        console.error("Error fetching species data:", error);
    }
}

async function fetchPokemonSpecies(speciesUrl) {
    console.log('SpeciesURl: ',speciesUrl)
    try {
        const response = await fetch(speciesUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const genusWithPokemon = data.genera.find(g => g.language.name === 'en').genus;
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
async function getPokemonThumbnail(pokemonName) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.sprites.front_default;
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
    }
}

// Rekursive Funktion, um die Evolutionskette zu extrahieren
function extractEvolutionChain(chain) {
    const result = {
        name: chain.species.name,
        thumbnail: null, // Dies wird später aktualisiert
        min_level: chain.evolution_details[0]?.min_level || null
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

export async function getEvolutionDataForPokemon(pokemonName) {
    try {
        // Zuerst die Pokémon-Spezies-URL abrufen, um die Evolutionskette-URL zu erhalten
        const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}/`);
        if (!speciesResponse.ok) {
            throw new Error(`HTTP error! status: ${speciesResponse.status}`);
        }
        const speciesData = await speciesResponse.json();
        const evolutionChainUrl = speciesData.evolution_chain.url;

        // Evolutionskette abrufen
        const evolutionResponse = await fetch(evolutionChainUrl);
        if (!evolutionResponse.ok) {
            throw new Error(`HTTP error! status: ${evolutionResponse.status}`);
        }
        const evolutionData = await evolutionResponse.json();
        const evolutionChain = extractEvolutionChain(evolutionData.chain);

        // Aktualisieren Sie die Thumbnail-URLs
        evolutionChain.thumbnail = await getPokemonThumbnail(evolutionChain.name);
        if (evolutionChain.next_evolution) {
            evolutionChain.next_evolution.thumbnail = await getPokemonThumbnail(evolutionChain.next_evolution.name);
            if (evolutionChain.next_evolution.next_evolution) {
                evolutionChain.next_evolution.next_evolution.thumbnail = await getPokemonThumbnail(evolutionChain.next_evolution.next_evolution.name);
            }
        }

        // Konvertiert die rekursive Evolutionskette in ein flaches Array
        const flatEvolutionArray = flattenEvolutionChain(evolutionChain);

        return flatEvolutionArray;

    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
    }}




