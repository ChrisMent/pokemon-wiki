import { allPokemonData, fetchPokemonDetail, fetchPokemonsMovesDetails , fetchPokemonsSpecies } from './api.js';
import { renderAllPokemon } from './render.js'; 
import { allPokemonsList } from './data.js';

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
    const searchQuery = searchInput.value.trim().toLowerCase();
    const nothingFound = document.getElementById('info-message');
    nothingFound.innerHTML = ``;
    if (searchQuery) {
        // Hier führen Sie eine API-Anfrage durch, um Pokémon basierend auf dem Suchbegriff zu erhalten
        const searchResults = await searchPokemons(searchQuery);
        if (searchResults && searchResults.length > 0) {
            renderAllPokemon(searchResults);
        } else {
            nothingFound.innerHTML = `
            <div class="alert alert-info m-3 text-center alert-dismissible fade show" role="alert">Zu deiner Suche wurde leider kein Pokemon gefunden!
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
            searchResultList.innerHTML = '';
        }
    } else {
        // Wenn die Suchleiste leer ist, zeigen Sie die standardmäßigen Pokémon an
        renderAllPokemon(allPokemonData.slice(0, 20)); // Oder wie viele auch immer bisher geladen wurden
    }
}

export async function searchPokemons(query) {
    if (!query) return [];

    const filteredPokemons = allPokemonsList.filter(pokemon => 
        pokemon.name.toLowerCase().includes(query.toLowerCase())
    );

    const detailedPokemonsPromises = filteredPokemons.map(pokemon => fetchPokemonDetail(pokemon.url));
    let detailedPokemons = await Promise.all(detailedPokemonsPromises);

    // Zusätzliche Details für jedes Pokémon abrufen
    for (let pokemon of detailedPokemons) {
        if (pokemon) {
            // Stellen Sie sicher, dass movesBaseData vorhanden sind
            if (!pokemon.movesBaseData) {
                //console.log(`movesBaseData fehlen für Pokémon: ${pokemon.name}`);
                continue; // Zum nächsten Pokémon übergehen, wenn keine movesBaseData vorhanden sind
            }

            // Bewegungen und Arten abrufen
            await fetchPokemonsMovesDetails(pokemon); // Stellen Sie sicher, dass diese Funktion korrekt implementiert ist
            await fetchPokemonsSpecies(pokemon); // Stellen Sie sicher, dass diese Funktion korrekt implementiert ist
            // Hier können Sie zusätzliche Funktionen hinzufügen, um Evolutionsdaten etc. zu erhalten
        }
    }

    return detailedPokemons;
}






