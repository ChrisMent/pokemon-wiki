import { capitalizeFirstLetter , formatNumber} from './utils.js';

// Test API

export let moves = [];
export let allMoves = []


export async function getPokemonMoves() {
    let url = 'https://pokeapi.co/api/v2/pokemon/1';

    try {
        const responsePokemonMoves = await fetch(url);

        if (!responsePokemonMoves.ok) {
            throw new Error(`HTTP error! status: ${responsePokemonMoves.status}`);
        }

        let jsonResponsePokemonMoves = await responsePokemonMoves.json();
        const viewAllMoveData = jsonResponsePokemonMoves.moves;

        for (let resultMoveData of viewAllMoveData) {
            const moveName = capitalizeFirstLetter(resultMoveData.move.name);
            const moveDetailUrl = resultMoveData.move.url;

            // Neuer Fetch für Move - Datails
            const moveDetailsResponse = await fetch(moveDetailUrl);
            if (!moveDetailsResponse.ok) {
                throw new Error(`HTTP error! status: ${moveDetailsResponse.status}`);
            }
            const moveDetailsAll = await moveDetailsResponse.json();
            const movePower = moveDetailsAll.power;
            const moveType = moveDetailsAll.type.name;
            const moveDamageClass = moveDetailsAll.damage_class.name;

            const allMoves = {
                moveName: moveName,
                movePower: movePower,
                moveType: moveType,
                moveDamageClass: moveDamageClass,
                moveDatailUrl: moveDetailUrl,
                moveLearnMethod: [],  // Array für moveType
                moveVersionsGroupe: []  // Array für moveVersion
            };

            for (let type of resultMoveData.version_group_details) {
                const moveType = capitalizeFirstLetter(type.move_learn_method.name);
                const moveVersion = capitalizeFirstLetter(type.version_group.name);

                allMoves.moveLearnMethod.push(moveType);  // Fügt moveType zum Array hinzu
                allMoves.moveVersionsGroupe.push(moveVersion);  // Fügt moveVersion zum Array hinzu
            }

            moves.push(allMoves);
            //console.log(allMoves);
        }

        //console.log(viewAllMoveData);
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
    }
}



// *** API - Abruf für die Übersichtsseite *** //

// Aufbereitete Daten aus Fetch - Funktionen im Array gespeichert
export const allPokemonData = []; 
console.log(allPokemonData)

export async function getPokemonData() {
    // API URL für den Start
    let url = 'https://pokeapi.co/api/v2/pokemon/';
      
    // Versuchen einen Response von der Schnittstelle zu bekommen
    try {
        // Asynchrones Abrufen der URL via Fetch
        const responseAllPokemons = await fetch(url); // https://pokeapi.co/api/v2/pokemon/
        
        // Wenn der Respone nicht "OK" ist dann gebe einen Fehler aus.
        if (!responseAllPokemons.ok) {
            throw new Error(`HTTP error! status: ${responseAllPokemons.status}`);
        }

        // Umwandeln des Response in ein JSON
        let jsonResponseAllPokemons = await responseAllPokemons.json(); 
        // Startpunkt zum Abrufen der Datensätze aus dem JSON: resulls ist die Ebene mit den Daten zu "Name" und der "Detail-URL"
        
        const allData = jsonResponseAllPokemons.results;

        // Durch alle Datensätze aus AllData mit der Gruppe: "results" durchiterieren um alle Pokemons zu bekommen
        for (let resultAllPokemons of allData) {
            
            // Die URL aus AllData auslesen results[x].url z.B.: https://pokeapi.co/api/v2/pokemon/1/
            const pokemonResponse = await fetch(resultAllPokemons.url);
            
            if (!pokemonResponse.ok) {
                throw new Error(`HTTP error! status: ${pokemonResponse.status}`);
            }

            //! Ab hier Zugriff aus alle Daten aus https://pokeapi.co/api/v2/pokemon/x/

            // Umwandeln des Response in ein JSON
            const pokemonJson = await pokemonResponse.json();
            
            //** Datenpunkte aus pokemonJson START */ 
            const id = pokemonJson.id;
            const name = pokemonJson.name;
            const types = pokemonJson.types.map(typeObj => capitalizeFirstLetter(typeObj.type.name));
            const image = pokemonJson.sprites.other.home.front_default;
            const height = pokemonJson.height / 10
            const heightInInch = height * 3.937
            const weightInLbs = pokemonJson.weight * 0.2204623
            const weightInKg = weightInLbs * 0.45359237
            const abilities = pokemonJson.abilities.map(typeObj => capitalizeFirstLetter(typeObj.ability.name))
            // ... weitere Schlüssel-Wert-Paare hier hinzufügen
            const baseStats =  {
                hp: pokemonJson.stats[0].base_stat,
                attack: pokemonJson.stats[1].base_stat,
                defense: pokemonJson.stats[2].base_stat,
                specialAttack: pokemonJson.stats[3].base_stat,
                specialDefense: pokemonJson.stats[4].base_stat,
                speed: pokemonJson.stats[5].base_stat,
                // ... weitere Schlüssel-Wert-Paare hier hinzufügen
            };
            const allMoveData = {
                moveName: pokemonJson.moves.map(move => move.move.name),
                //movePower: movePower
            }
            

            // Berechnungen
            baseStats.total = baseStats.hp + baseStats.attack + baseStats.defense + baseStats.specialAttack + baseStats.specialDefense + baseStats.speed;
            
            let totalStatProgress = baseStats.total / 6

            // console.log(moveNames)

            //** Datenpunkte aus pokemonJson ENDE */ 


            // Startpunkt zum Abrufen der Datensätze aus dem JSON: moves ist die Ebene die durchiteriert werden  muss um dan die "Move - Detail-URL" zu kommen

            const allMovesData = pokemonJson.moves

            // Durch alle Datensätze aus AllData mit der Gruppe: "results" durchiterieren um alle Pokemons zu bekommen

            for (let resultMoveData of allMovesData) {
                
                // Extrahieren der URL für die Moves für jedes Pokemon damit die Daten aus den MoveDetails abgerufen werden können. 
                const moveDetailUrl = resultMoveData.move.url; // Move url https://pokeapi.co/api/v2/move/x/
                
                // Neuer Fetch für Move - Datails
                const moveDetailsResponse = await fetch(moveDetailUrl);

                if (!moveDetailsResponse.ok) {
                    throw new Error(`HTTP error! status: ${moveDetailsResponse.status}`);
                }

                // Zugriff auf alle Werte aus den Move Details
                const moveDetailsAll = await moveDetailsResponse.json();
                
                const movePower = moveDetailsAll.power;
                const moveType = moveDetailsAll.type.name;
                const moveDamageClass = moveDetailsAll.damage_class.name;
                //console.log(moveDamageClass)

                const moveData = {
                    movePower: movePower,
                    moveType: moveType,
                    moveDamageClass: moveDamageClass
                }
                console.log(moveData)

                // Hinzufügen der Bewegungsdaten zum allMoves-Array
                allMoves.push(moveData);

 

            }

            // console.log('Das sind die Move-Names für', resultAllPokemons.name, ':', moveNames);
           

  
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
                totalStatProgress: totalStatProgress,
                
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

            //! Hinzufügen des allMoves-Arrays zum pokemonData-Objekt
            pokemonData.moves = allMoves;
                        
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
    }
}



