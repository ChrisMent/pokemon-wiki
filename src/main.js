// main.js
import {
    fetchPokemonsBaseData,
    fetchPokemonsDetails,
    fetchPokemonsSpecies,
    fetchPokemonsMovesDetails,
    loadMorePokemons
  } from './api.js';
  import { renderOverview, renderAllPokemon } from './render.js';
  import { capitalizeFirstLetter, lightenColor, getBackgroundColor } from './utils.js';
  import { searchPokemons } from './search.js'
  import { initModal } from './modal.js';
  
  async function main() {
      try {
          await fetchPokemonsBaseData(); // Lädt die Basisdaten
          await fetchPokemonsDetails(); // Lädt die Detaildaten
          await fetchPokemonsSpecies(); // Lädt die Speziesdaten
          await fetchPokemonsMovesDetails(); // Lädt die Bewegungsdetails, falls benötigt
          renderAllPokemon(allPokemonData); // Verwenden Sie die Daten, um die UI zu rendern
          initModal();
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
  