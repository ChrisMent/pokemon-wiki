const BASE_URL = 'https://pokeapi.co/api/v2/';
const LIMIT = 1

let allPokemonData = [];

// ehemals getPokemonData()
async function fetchPokemonsBaseData() {
    try {
        const response = await fetch(`${BASE_URL}pokemon?limit=${LIMIT}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allPokemonData = data.results.map(pokemon => {
            return {
                name: pokemon.name,
                url: pokemon.url
            };
        });
        
    } catch (error) {
        console.error("Error fetching pokemon base data:", error);
    }
    await fetchPokemonsDetails()
}


async function fetchPokemonsDetails() {
    for (let i = 0; i < allPokemonData.length; i++) {
        try {
            // Zugriff auf die Daten der URL: https://pokeapi.co/api/v2/pokemon/[i]/
            const response = await fetch(allPokemonData[i].url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Stats Data Pokemon
            const hpStat = data.stats.find(stat => stat.stat.name === "hp").base_stat;
            const attackStat = data.stats.find(stat => stat.stat.name === "attack").base_stat;
            const defenseStat = data.stats.find(stat => stat.stat.name === "defense").base_stat;
            const specialAttackStat = data.stats.find(stat => stat.stat.name === "special-attack").base_stat;
            const specialDefenseStat = data.stats.find(stat => stat.stat.name === "special-defense").base_stat;
            const speedStat = data.stats.find(stat => stat.stat.name === "speed").base_stat;
            
            // Caclulation with Stats
            const totalStats = hpStat + attackStat + defenseStat + specialAttackStat + specialDefenseStat + speedStat;
            const totalStatProgress = totalStats / 6;

            // Caclulation with height & weight
            const heightInInch = parseFloat((data.height * 3.937 / 10).toFixed(2));
            const weightInLbs = parseFloat((data.weight * 0.2204623).toFixed(2))
            const weightInKg = parseFloat((weightInLbs * 0.45359237).toFixed(2))
            
            // Urls for further requests
            const speciesUrl = data.species.url

            // Serveral pokemon data
            const types = data.types.map(type => type.type.name)
            const abilities = data.abilities.map(ability => ability.ability.name)

            const movesBaseData = data.moves.map(move => {
                // Extrahiere die grundlegenden Bewegungsdaten
                const baseData = {
                    name: move.move.name,
                    url: move.move.url
                };
            
                // Iteriere durch jedes version_group_detail und extrahiere die zusätzlichen Informationen
                const versionGroupDetails = move.version_group_details.map(detail => {
                    return {
                        levelLearnedAt: detail.level_learned_at,
                        moveLearnMethodName: detail.move_learn_method.name,
                        versionGroupName: detail.version_group.name,
                    };
                });
            
                // Füge die versionGroupDetails zum baseData-Objekt hinzu
                baseData.versionGroupDetails = versionGroupDetails;
            
                return baseData;
            });

            // Ausgabe der Werte innerhalt einer Konstanten!
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
                sprites: data.sprites.other.home.front_default,
                //movesBaseData: movesBaseData
            };
            // Daten zum Array hinzufügen
            allPokemonData[i] = { ...allPokemonData[i], ...pokemonsDetailsData }; 

        // Temporär hinzufügen von allPokemonData zu allPokemonData[i], um es in fetchPokemonsMovesDetails zu verwenden
        allPokemonData[i].tempMovesBaseData = movesBaseData;


        } catch (error) {
            console.error("Error fetching pokemon details data:", error);
        }
    }
    await fetchPokemonsSpecies()
}

async function fetchPokemonsSpecies(){
for (let i = 0; i < allPokemonData.length; i++) {
    try {
        
        // Zugriff auf die Daten https://pokeapi.co/api/v2/pokemon-species/[i]/
        // Diese sind zu finden unter [i] ---> data.species.url der Funktion fetchPokemonsDetails()

        const speciesUrl = allPokemonData[i].speciesUrl;
        const response = await fetch(speciesUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);       
        }

        const data = await response.json();
        
        // Species Data Pokemon
        const genusWithPokemon = data.genera.find(g => g.language.name === 'en').genus;
        const genusWithoutPokemon = genusWithPokemon.replace(" Pokémon", "");
        const captureRate = data.capture_rate
        const genderRateFemale = Math.floor(data.gender_rate / 8 * 100)
        const genderRateMale = 100 - genderRateFemale
        const eggGroups = data.egg_groups.map(typeObj => typeObj.name)
        
        // Daten zum Array hinzufügen
        const pokemonSpeciesData = {
            captureRate: captureRate,
            genderRateFemale: genderRateFemale,
            genderRateMale: genderRateMale,
            eggGroups: eggGroups,
            genusWithoutPokemon: genusWithoutPokemon
        }
        
        allPokemonData[i] = { ...allPokemonData[i], ...pokemonSpeciesData }; 


    } catch (error) {
            console.error("Error fetching species data:", error);
        }
    }
    await fetchPokemonsMovesDetails()
}

async function fetchPokemonsMovesDetails() {
    for (let i = 0; i < allPokemonData.length; i++) {
        const pokemonName = allPokemonData[i].name; // Name des Pokémon
        
        // Initialisiere movesDetails für das aktuelle Pokémon
        allPokemonData[i].movesDetails = [];

        for (const moveBaseData of allPokemonData[i].tempMovesBaseData) {
            try {
                const response = await fetch(moveBaseData.url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const moveDetails = await response.json();

                const moveName = moveBaseData.name
                const moveUrl = moveBaseData.url
                const moveType = moveDetails.type.name
                const movePower = moveDetails.power
                const moveDamageClass = moveDetails.damage_class.name
                const versionGroupDetails = moveBaseData.versionGroupDetails

                // Verarbeite die Bewegungsdetails
                const detailedMoveData = {
                    pokemonName: pokemonName,
                    moveName: moveName,
                    moveUrl: moveUrl,
                    moveType: moveType,
                    movePower: movePower,
                    moveDamageClass: moveDamageClass,
                    versionGroupDetails: versionGroupDetails

                    // ... füge hier weitere Details hinzu
                };

                // Hinzufügen der Bewegungsdetails, wenn nicht bereits vorhanden
                if (!allPokemonData[i].movesDetails.find(m => m.moveName === detailedMoveData.moveName)) {
                    allPokemonData[i].movesDetails.push(detailedMoveData);
                }

                
            } catch (error) {
                console.error("Error fetching move details for", moveBaseData.name, ":", error);
            }
        }
        delete allPokemonData[i].tempMovesBaseData;
    }

}




fetchPokemonsBaseData();

async function displayData() {
    await fetchPokemonsBaseData();
    await fetchPokemonsDetails();
    console.log('Zugriff auf allPokemonData: ', allPokemonData);
    //allPokemonData.forEach(pokemon => {
    //    console.log(`Stats für ${pokemon.name}: `, pokemon.stats);
    //}
    //);
}

displayData();

// Beispiel für den Aufruf der Funktion und Loggen der Daten
// getPokemonData().then(allPokemonData => {
//     console.log('AllPokemonData: ', allPokemonData[0]);
// }).catch(error => {
//     console.error("Error fetching Pokemon data:", error);
// });