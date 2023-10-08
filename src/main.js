// main.js
import { loadAllPokemon, getEvolutionChainData } from './api.js'; 
import { renderOverview, renderAllPokemon } from './render.js'; 
import { capitalizeFirstLetter, lightenColor, getBackgroundColor ,toggleDropdown, updateSelectedOption} from './utils.js';
import { searchPokemons } from './search.js'
import { initModal } from './modal.js';

async function main() {
    console.log("main function started");  // Hinzugefügt
    try {
        const allPokemonData = await loadAllPokemon();
        console.log("All Pokemon data loaded");  // Hinzugefügt
        renderAllPokemon(allPokemonData);
        console.log("All Pokemon rendered");  // Hinzugefügt
        initModal();
        console.log("initModal called");  // Hinzugefügt
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



