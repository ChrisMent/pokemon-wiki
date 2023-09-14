// main.js
import { loadAllPokemon } from './api.js'; 
import { renderOverview, renderAllPokemon } from './render.js'; 
import { capitalizeFirstLetter, lightenColor, getBackgroundColor } from './utils.js';

async function main() {
    try {
        const allPokemonData = await loadAllPokemon();  // Daten für alle Pokémon laden
        renderAllPokemon(allPokemonData);  // Alle Pokémon im HTML darstellen
    } catch (error) {
        console.error("Fehler beim Laden oder Rendern der Pokemon:", error);
    }

}

document.addEventListener("DOMContentLoaded", function() {
  main();  // Hauptfunktion aufrufen
});
