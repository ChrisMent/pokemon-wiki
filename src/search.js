import { allPokemonData } from './api.js';
import { renderAllPokemon } from './render.js';

let isSearchMode = false;
let currentSearchQuery = '';

// Eventhandling

document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.querySelector('.form-control');
    const searchButton = document.querySelector('.search-button');
    
    searchInput.addEventListener('input', performSearch);  // input Event-Listener hinzufügen
    searchButton.addEventListener('click', handleSearchButtonClick);  // click Event-Listener hinzufügen
        
    // Event-Listener für den Close-Button dynamisch hinzufügen
    
    // Anstatt Event-Listener direkt an den btn-close-Button anzuhängen, wird er an das document-Objekt gebunden. Der Listener wird für jeden Klick im Dokument ausgelöst, unabhängig davon, auf welches Element geklickt wurde.

        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('btn-close')) {
                clearNoPokemons();
            }
            // Im Inneren des Event-Listeners wird geprüft, ob das Element, auf das geklickt wurde (event.target), die Klasse btn-close hat:
        });
    
    searchPokemons();
});

// Funktion, die bei Klick auf den Suchbutton aufgerufen wird
function handleSearchButtonClick(e) {
    e.preventDefault();
    performSearch();
}

// Funktion die die Suche zurücksetzt

function clearNoPokemons(){
    const searchInput = document.querySelector('.form-control');
    searchInput.value = ''
    renderAllPokemon(allPokemonData)
}

// Funktion, die die eigentliche Suche durchführt
export async function performSearch() {
    const searchInput = document.querySelector('.form-control');
    currentSearchQuery = searchInput.value.trim().toLowerCase();

    if (currentSearchQuery) {
        isSearchMode = true;
        const searchResults = await searchPokemons(currentSearchQuery);

        if (searchResults && searchResults.length > 0) {
            // Stellen Sie sicher, dass jedes Pokémon in searchResults die notwendigen Daten enthält
            const adaptedSearchResults = searchResults.map(pokemon => ({
                ...pokemon.details, 
                movesBaseData: pokemon.movesBaseData,
                evolutionData: pokemon.evolutionData
            }));

            renderAllPokemon(adaptedSearchResults);
        } else {
            // Behandlung von leeren Suchergebnissen
            // Möglicherweise möchten Sie eine Nachricht anzeigen, dass keine Pokémon gefunden wurden
        }
    } else {
        isSearchMode = false;
        renderAllPokemon(allPokemonData.slice(0, 20)); // Oder wie viele auch immer bisher geladen wurden
    }
}

export async function searchPokemons(query) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?search=${query}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const searchResults = data.results;

        const detailedPokemons = await Promise.all(
            searchResults.map(async (pokemon) => {
                const pokemonDetailsResponse = await fetch(pokemon.url);
                const pokemonDetails = await pokemonDetailsResponse.json();

                // Angenommen, die URLs für movesBaseData und evolutionData sind Teil der pokemonDetails
                const movesBaseDataURL = pokemonDetails.movesBaseDataURL; // Beispiel-URL für movesBaseData
                const evolutionDataURL = pokemonDetails.evolutionDataURL; // Beispiel-URL für evolutionData

                const [movesBaseDataResponse, evolutionDataResponse] = await Promise.all([
                    fetch(movesBaseDataURL),
                    fetch(evolutionDataURL)
                ]);

                const movesBaseData = await movesBaseDataResponse.json();
                const evolutionData = await evolutionDataResponse.json();

                return {
                    ...pokemonDetails,
                    movesBaseData: movesBaseData,
                    evolutionData: evolutionData
                };
            })
        );

        return detailedPokemons;
    } catch (error) {
        console.error("Fehler bei der Suche:", error);
        return [];
    }
}




