// main.js
import {
    fetchPokemonsBaseData,
    fetchPokemonsSpecies,
    fetchPokemonsMovesDetails,
    loadMorePokemons
} from './api.js';
import {
    renderAllPokemon
} from './render.js';
import {
    initModal
} from './modal.js';
import {
    fetchPokemonFullList
} from './data.js';

async function main() {
    try {
        const allPokemonData = await fetchPokemonsBaseData();

        for (const pokemon of allPokemonData) {
            await fetchPokemonsSpecies(pokemon);
            await fetchPokemonsMovesDetails(pokemon);
        }

        renderAllPokemon(allPokemonData);
        fetchPokemonFullList();
        initModal();
        console.log('Zugriff auf allPokemonData: ', allPokemonData);

    } catch (error) {
        console.error("Fehler beim Laden oder Rendern der Pokemon:", error);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Hauptfunktion aufrufen um den Prozess zu starten!
    main();

});

// Event-Handler für den "Load more" Button
document.getElementById('load-more-button').addEventListener('click', loadMorePokemons);

