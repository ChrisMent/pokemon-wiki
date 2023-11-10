// main.js
import { fetchPokemonsBaseData, fetchPokemonsDetails, fetchPokemonsSpecies, fetchPokemonsMovesDetails, loadMorePokemons } from './api.js'; 
import { renderOverview, renderAllPokemon } from './render.js'; 
import { capitalizeFirstLetter, lightenColor, getBackgroundColor } from './utils.js';
import { searchPokemons } from './search.js'
import { initModal } from './modal.js';

async function main() {
    try {
        const allPokemonData = await fetchPokemonsBaseData();  
        // Jetzt müssen Sie die Artendaten zu den Pokémon-Daten hinzufügen
        await fetchPokemonsSpecies(allPokemonData);
        await fetchPokemonsMovesDetails(allPokemonData); // Aufruf der Funktion, um Bewegungsdetails zu holen

        renderAllPokemon(allPokemonData);  
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



