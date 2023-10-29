// Hilfsfunktionen

// Ersten Buchstabe immer groß schreiben
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

function capitalizeEachWord(str) {
    return str.split('-').map(capitalizeFirstLetter).join('-');
}
  


const BASE_URL = 'https://pokeapi.co/api/v2/';
const LIMIT = 10

let allPokemonData = [];
let allPokemonMoves = [];
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
        console.error("Error fetching all Pokemon data:", error);
    }
    await fetchPokemonsDetails()
}


async function fetchPokemonsDetails() {
    for (let i = 0; i < allPokemonData.length; i++) {
        try {
            const response = await fetch(allPokemonData[i].url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // Stats Pokemon
            const hpStat = data.stats.find(stat => stat.stat.name === "hp").base_stat;
            const attackStat = data.stats.find(stat => stat.stat.name === "attack").base_stat;
            const defenseStat = data.stats.find(stat => stat.stat.name === "defense").base_stat;
            const specialAttackStat = data.stats.find(stat => stat.stat.name === "special-attack").base_stat;
            const specialDefenseStat = data.stats.find(stat => stat.stat.name === "special-defense").base_stat;
            const speedStat = data.stats.find(stat => stat.stat.name === "speed").base_stat;
            // Berechnungen Stats
            const totalStats = hpStat + attackStat + defenseStat + specialAttackStat + specialDefenseStat + speedStat;
            const totalStatProgress = totalStats / 6;

            const heightInInch = data.height * 3.937
            const weightInLbs = data.weight * 0.2204623
            const weightInKg = weightInLbs * 0.45359237
            // Ausgabe der Werte innerhal einer Konstanten!
            const details = {
                id: data.id,
                name: data.name,
                height: data.height / 10,
                heightInInch: heightInInch,
                weight: data.weight,
                weightInLbs: weightInLbs,
                weightInKg: weightInKg,
                types: data.types.map(type => type.type.name),
                abilities: data.abilities.map(ability => ability.ability.name),
                stats: {
                    hp: hpStat,
                    attack: attackStat,
                    defense: defenseStat,
                    special_attack: specialAttackStat,
                    special_defense: specialDefenseStat,
                    speed: speedStat,
                    total: totalStats,
                    totalProgress: totalStatProgress
                },
                sprites: data.sprites.other.home.front_default
            };
            // Daten zum Array hinzufügen
            allPokemonData[i] = { ...allPokemonData[i], ...details }; 




        } catch (error) {
            console.error("Error fetching Pokemon details:", error);
        }
    }
}
fetchPokemonsBaseData();

async function displayData() {
    await fetchPokemonsBaseData();
    await fetchPokemonsDetails();
    console.log('Zugriff auf allPokemonData: ', allPokemonData);
    allPokemonData.forEach(pokemon => {
        console.log(`Stats für ${pokemon.name}: `, pokemon.stats);
    });
}

displayData();
