import { capitalizeFirstLetter , formatNumber} from './utils.js';

// *** API - Abruf für die Übersichtsseite *** //

// Aufbereitete Daten aus Fetch - Funktionen im Array gespeichert
export let allPokemonData = []; 
console.log(allPokemonData)
export async function getPokemonData() {
    // API URL für den Start
    let url = 'https://pokeapi.co/api/v2/pokemon/';
      
    // Alle Fehler, die während der Fetch-Aufrufe auftreten könnten, werden vom bestehenden catch-Block am Ende des Codes abgefangen. Daher den try-Block nur einmal.
      try {
        const responseAllPokemons = await fetch(url);
  
        if (!responseAllPokemons.ok) { // Überprüft, ob die Anfrage erfolgreich war
            throw new Error(`HTTP error! status: ${response.status}`);
        }
         // Wandelt die Antwort in ein JSON-Objekt um und speichert es
        let jsonResponseAllPokemons = await responseAllPokemons.json(); 
        
        // Zugriff auf das auf den in Json umformatierten Text der API
        let results = jsonResponseAllPokemons.results;
 

        // Durch iterieren durch alle Pokemons und Rückgabe von URL für die weitere Fetch-Anfrage
        for (let resultAllPokemons of results) {
            
            // API URL zu den Detailinformationen der Pokemons
            const pokemonUrl = resultAllPokemons.url;

            // Zweite Fetch-Anfrage und speichert die Antwort in pokemonResponse.
            const pokemonResponse = await fetch(pokemonUrl);  
  
            if (!pokemonResponse.ok) {
                throw new Error(`HTTP error! status: ${pokemonResponse.status}`);
            }
  
            // Wandelt die Antwort in ein JSON-Objekt um und speichert es
            // Daten aus: https://pokeapi.co/api/v2/pokemon/{id}
            const pokemonJson = await pokemonResponse.json();
            const id = pokemonJson.id;
            const name = pokemonJson.name;
            const types = pokemonJson.types.map(typeObj => capitalizeFirstLetter(typeObj.type.name));
            const image = pokemonJson.sprites.other.home.front_default;
            const height = pokemonJson.height / 10
            const heightInInch = height * 3.937
            const weightInLbs = pokemonJson.weight * 0.2204623
            const weightInKg = weightInLbs * 0.45359237
            const abilities = pokemonJson.abilities.map(typeObj => capitalizeFirstLetter(typeObj.ability.name))
            const baseStats =  {
                hp: pokemonJson.stats[0].base_stat,
                attack: pokemonJson.stats[1].base_stat,
                defense: pokemonJson.stats[2].base_stat,
                specialAttack: pokemonJson.stats[3].base_stat,
                specialDefense: pokemonJson.stats[4].base_stat,
                speed: pokemonJson.stats[5].base_stat,
                // ... füge weitere Schlüssel-Wert-Paare hier hinzu
            };

            baseStats.total = baseStats.hp + baseStats.attack + baseStats.defense + baseStats.specialAttack + baseStats.specialDefense + baseStats.speed;
            
            let totalStatProgress = baseStats.total / 6
  
            // Erstellung eine Objektes mit mehreren Variabeln
            const pokemonData = {
                id: formatNumber(id),
                name: name,
                types: types,
                image: image,
                height: height.toFixed(2),
                heightInInch: heightInInch.toFixed(2),
                weightInLbs: weightInLbs.toFixed(2),
                weightInKg: weightInKg.toFixed(2),
                abilities: abilities,
                baseStats: baseStats, // Objekt kombinieren, mit dem Spread-Operator (...baseStats) oder als vollständiges Objekt mit baseStats: baseStats
                totalStatProgress: totalStatProgress
            };


            // Zusätzlicher Fetch-Aufruf für die 'species'-URL des Pokémon
            // Daten aus: https://pokeapi.co/api/v2/pokemon-species/{id}/

            const speciesResponse = await fetch(pokemonJson.species.url);
            if (!speciesResponse.ok) {
                throw new Error(`HTTP error! status: ${speciesResponse.status}`);
            }
            const speciesJson = await speciesResponse.json();

            // Extrahieren des 'genus' aus dem 'species'-JSON
            // Hier wird davon ausgegangen, dass der 'genus' immer in Englisch (en) vorliegt.
            const genusWithPokemon = speciesJson.genera.find(g => g.language.name === 'en').genus;
            const genusWithoutPokemon = genusWithPokemon.replace(" Pokémon", "");
            const genderRateFemale = Math.floor(speciesJson.gender_rate / 8 * 100)
            const genderRateMale = 100 - genderRateFemale
            const eggGroups = speciesJson.egg_groups.map(typeObj => capitalizeFirstLetter(typeObj.name))
            const captureRate = speciesJson.capture_rate

            // Hinzufügen des 'genus' zum 'pokemonData'-Objekt
            pokemonData.genus = genusWithoutPokemon;
            pokemonData.genderRateFemale = genderRateFemale
            pokemonData.genderRateMale = genderRateMale
            pokemonData.eggGroups = eggGroups
            pokemonData.captureRate = captureRate

            
            // Speichern der Daten in einem Array.

            // Mit allPokemonData.push(pokemonData) werden die Daten zu einem Array hinzugefügt, aber dieses Array ist nur innerhalb der Funktion sichtbar. Wenn die gesammelten Daten in einem anderen Teil Ihres Programms verwenden werden sollen, müssen diese mit return zurückgeben.
            allPokemonData.push(pokemonData);
        }
  
        // Der return-Befehl gibt das Array allPokemonData zurück, das alle gesammelten Pokémon-Daten enthält. Damit diese die Funktion an anderer Stelle im Code genutzt werden kann z.B. die Daten im DOM darzustellen.
        return allPokemonData;
  
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
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

// Hauptfunktion, um die Daten zu erhalten und die Evolutionskette zu extrahieren
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

        return evolutionChain;

    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
    }
}






