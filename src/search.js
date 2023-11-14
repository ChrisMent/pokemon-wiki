import { allPokemonData, fetchPokemonDetail, fetchPokemonsMovesDetails , fetchPokemonsSpecies, getEvolutionDataForPokemon } from './api.js';
import { renderAllPokemon } from './render.js'; 
import { allPokemonsList } from './data.js';
import { initModal } from './modal.js';

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

// Globale Variable für die letzte Suchanfrage
let lastQuery = '';
let currentSearchPromise = null;

function searchDebounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Event-Listener für das Suchfeld
document.querySelector('.form-control').addEventListener('input', searchDebounce(performSearch, 1200));

// Exportieren der Haupt-Suchfunktion
export async function performSearch() {
    const searchInput = document.querySelector('.form-control');
    const searchQuery = searchInput.value.trim().toLowerCase();
    lastQuery = searchQuery;

    const nothingFound = document.getElementById('info-message');
    nothingFound.innerHTML = '';

    if (searchQuery) {
        // Erstellen einer neuen Suchanfrage als Promise
        const searchPromise = new Promise(async (resolve, reject) => {
            // API-Anfrage durchführen, um Pokémon basierend auf dem Suchbegriff zu erhalten
            const searchResults = await searchPokemons(searchQuery);
            resolve({ searchQuery, searchResults });
            console.log('Erhaltene Suchergebnisse:', searchResults);
        });

        // Aktualisieren der aktuellen Suchanfrage
        currentSearchPromise = searchPromise;

        // Warten auf das Ergebnis der Suchanfrage
        const { searchQuery: responseQuery, searchResults } = await searchPromise;

        // Stellen Sie sicher, dass dies die aktuellste Suchanfrage ist
        if (responseQuery === lastQuery && currentSearchPromise === searchPromise) {
            if (searchResults && searchResults.length > 0) {
                renderAllPokemon(searchResults);
                initModal();
            } else {
                nothingFound.innerHTML = `
                <div class="alert alert-info m-3 text-center alert-dismissible fade show" role="alert">
                    Zu deiner Suche wurde leider kein Pokemon gefunden!
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>`;
                searchResultList.innerHTML = '';
            }
        }
    } else {
        // Standardmäßige Pokémon anzeigen, wenn die Suchleiste leer ist
        renderAllPokemon(allPokemonData.slice(0, 20));
        initModal();
    }
}


export async function searchPokemons(query) {
    if (!query) return [];

    const filteredPokemons = allPokemonsList.filter(pokemon => 
        pokemon.name.toLowerCase().includes(query.toLowerCase())
    );

    let detailedPokemons = [];

    try {
        // Abrufen der Detaildaten für jedes gefilterte Pokémon
        const detailedPokemonsPromises = filteredPokemons.map(pokemon => fetchPokemonDetail(pokemon.url));
        detailedPokemons = await Promise.all(detailedPokemonsPromises);

        // Zusätzliche Details für jedes Pokémon abrufen
        for (let pokemon of detailedPokemons) {
            if (pokemon && pokemon.details && pokemon.details.speciesUrl) {
                // Bewegungen und Arten abrufen
                await fetchPokemonsMovesDetails(pokemon);
                await fetchPokemonsSpecies(pokemon);

                // Evolutionsdaten abrufen
                const speciesId = pokemon.details.speciesUrl.split('/').filter(part => part).pop();
                try {
                    const evolutionData = await getEvolutionDataForPokemon(speciesId);
                    pokemon.evolutionData = evolutionData;
                } catch (evolutionError) {
                    console.error(`Fehler beim Abrufen der Evolutionsdaten für ${pokemon.name}:`, evolutionError);
                }
            }
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Detaildaten für Pokémon:', error);
        // Implementieren Sie eine geeignete Fehlerbehandlung
    }
    //console.log('Suchergebnisse:', detailedPokemons); // Neue Zeile
    return detailedPokemons;
}
