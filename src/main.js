// main.js
import { getPokemonData } from './api.js'; 
import { renderOverview, renderAllPokemon } from './render.js'; 
import { capitalizeFirstLetter, lightenColor, getBackgroundColor ,toggleDropdown, updateSelectedOption} from './utils.js';
import { searchPokemons } from './search.js'
import { initModal } from './modal.js';

async function main() {
    try {
        const allPokemonData = await getPokemonData();  
        renderAllPokemon(allPokemonData);  
        initModal();
    } catch (error) {
        console.error("Fehler beim Laden oder Rendern der Pokemon:", error);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Hauptfunktion aufrufen
    main();
    // Event-Listener für das Dropdown hinzufügen
    const dropdownButton = document.getElementById('dropdownMenuButton');
    if (dropdownButton) {
        dropdownButton.addEventListener('click', toggleDropdown);
    }

    // Event-Listener für die Radio-Buttons hinzufügen
    const radioButtons = document.querySelectorAll('input[name="gameOption"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            updateSelectedOption(this);
        });
    });
});



