// main.js
import { getPokemonData } from './api.js'; 
import { getPokemonData1 } from './api-ref.js'; 
import { renderOverview, renderAllPokemon } from './render.js'; 
import { capitalizeFirstLetter, lightenColor, getBackgroundColor ,toggleDropdown, updateSelectedOption} from './utils.js';
import { searchPokemons } from './search.js'
import { initModal } from './modal.js';

async function main() {
    try {
        const allPokemonData = await getPokemonData();  
        renderAllPokemon(allPokemonData);  
        initModal();
        //getPokemonData1();
    } catch (error) {
        console.error("Fehler beim Laden oder Rendern der Pokemon:", error);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Hauptfunktion aufrufen
    main();

});



