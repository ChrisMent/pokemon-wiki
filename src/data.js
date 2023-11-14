import { BASE_URL } from './api.js';

export let allPokemonsList = [];

export async function fetchPokemonFullList() {
    try {
        const response = await fetch(`${BASE_URL}pokemon?limit=1017`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const allPokemons = data.results.map(pokemon => {
            return {
                name: pokemon.name,
                url: pokemon.url
            };
        });

        allPokemonsList = allPokemons;
        console.log("All Pokémon List:", allPokemonsList);
    } catch (error) {
        console.error("Error fetching pokemon base data:", error);
    } 

}