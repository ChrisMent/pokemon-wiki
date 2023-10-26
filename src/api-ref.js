//! Vorschläge für die Refakturierung

// Importieren Sie benötigte Funktionen und Module
import { capitalizeFirstLetter } from './utils.js';

const BASE_URL = 'https://pokeapi.co/api/v2/';

export let allPokemonData = [];
export let allPokemonMoves = [];

export async function fetchAllPokemonData() {
    try {
        const response = await fetch(`${BASE_URL}pokemon?limit=151`);
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
}

export async function fetchPokemonDetails(pokemonName) {
    try {
        const response = await fetch(`${BASE_URL}pokemon/${pokemonName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return {
            name: capitalizeFirstLetter(data.name),
            height: data.height,
            weight: data.weight,
            types: data.types.map(type => type.type.name),
            abilities: data.abilities.map(ability => ability.ability.name),
            stats: data.stats.map(stat => ({
                name: stat.stat.name,
                base_stat: stat.base_stat
            })),
            sprites: data.sprites
        };
    } catch (error) {
        console.error("Error fetching Pokemon details:", error);
    }
}

export async function fetchAllPokemonMoves(pokemonName) {
    try {
        const response = await fetch(`${BASE_URL}pokemon/${pokemonName}/moves`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allPokemonMoves = data.moves.map(move => {
            const moveDetails = move.version_group_details[0];
            return {
                pokemonName: pokemonName,
                moveName: move.move.name,
                movePower: moveDetails.power,
                moveType: moveDetails.type,
                moveDamageClass: moveDetails.damage_class,
                levelLearnedAt: moveDetails.level_learned_at,
                moveLearnMethod: moveDetails.move_learn_method.name,
                moveVersionsGroupe: moveDetails.version_group.name
            };
        });
    } catch (error) {
        console.error("Error fetching Pokemon moves:", error);
    }
}

export async function getEvolutionDataForPokemon(pokemonName) {
    try {
        const response = await fetch(`${BASE_URL}evolution-chain/${pokemonName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.chain;
    } catch (error) {
        console.error("Error fetching evolution data:", error);
    }
}
