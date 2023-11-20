import { allPokemonData, fetchPokemonDetail, fetchPokemonsMovesDetails , fetchPokemonsSpecies, getEvolutionDataForPokemon, updateUIWithNewPokemons, resetAndLoadInitialPokemons, showLoadingIndicator, hideLoadingIndicator } from './api.js';
import { renderAllPokemon } from './render.js'; 
import { allPokemonsList } from './data.js';
import { initModal, applyFilters } from './modal.js';
import { getBackgroundColor } from './utils.js'


// Zustandsvariable für aktive Suche
export let isSearchActive = false;

// Eventhandling

document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.querySelector('.form-control');
    const searchButton = document.querySelector('.search-button');
    const loadMoreButton = document.querySelector('.load-more')
    
    // Event-Listener für die Eingabetaste im Suchfeld
    searchInput.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            // Verhindern Sie, dass das Standardverhalten des Formulars das Neuladen der Seite verursacht
            event.preventDefault();
            // Führen Sie die Suche mit dem aktuellen Wert des Suchfelds aus
            await performSearch(event);
        }
    });

    // Event-Listener für das Fokussieren und Verlassen des Suchfelds
    searchInput.addEventListener('focus', function() {
    // "Load More" Button ausblenden, wenn das Suchfeld fokussiert wird
    loadMoreButton.style.display = 'none';
    });
    
    searchInput.addEventListener('blur', function() {
        if (!isSearchActive) {
            loadMoreButton.style.display = 'flex';
        }
    });

    // Event-Listener für den Such-Button
    searchButton.addEventListener('click', handleSearchButtonClick); // click Event-Listener hinzufügen
        
    // Event-Listener für den Close-Button dynamisch hinzufügen wenn kein Pokemon gefunden wurde! oder das löschen der Suche
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('btn-close') || event.target.id === 'clearSearch') {
            clearNoPokemons();
        }
    });

    document.getElementById('clearSearch').addEventListener('click', function() {
        document.getElementById('searchInput').value = '';
        // Führen Sie hier zusätzliche Aktionen aus, z.B. die Suchergebnisse zurücksetzen
    });

    // Event-Listener für Änderungen im Suchfeld
    searchInput.addEventListener('input', function(event) {
        if (event.target.value.trim() === '') {
            clearNoPokemons();
        }
    });

    searchPokemons();
});



// Funktion, die bei Klick auf den Suchbutton aufgerufen wird
function handleSearchButtonClick(e) {
    e.preventDefault();
    isSearchActive = true; // Setze die Suche als aktiv
    performSearch();
}

// Funktion die die Suche zurücksetzt

function clearNoPokemons(){
    const searchInput = document.querySelector('.form-control');
    searchInput.value = '';
    isSearchActive = false; // Setze die Suche als nicht aktiv
    resetAndLoadInitialPokemons();

    const nothingFound = document.getElementById('info-message');
    nothingFound.innerHTML = ''; // Leere die nothingFound-Nachricht
    
    const loadMoreButton = document.querySelector('.load-more');
    loadMoreButton.style.display = 'flex';
    
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
document.querySelector('.form-control').addEventListener('input', searchDebounce(performSearch, 300));

export async function performSearch() {
    showLoadingIndicator(); // Zeige den Spinner beim Start der Suche
    const loadMoreButton = document.querySelector('.load-more');
    loadMoreButton.style.display = 'none';
    const searchInput = document.querySelector('.form-control');
    const searchQuery = searchInput.value.trim().toLowerCase();
    const pokemonContainer = document.getElementById("pokemon-container");
    lastQuery = searchQuery;
    isSearchActive = true;

    const nothingFound = document.getElementById('info-message');
    nothingFound.innerHTML = '';

    if (searchQuery) {
        const searchPromise = new Promise(async (resolve, reject) => {
            const searchResults = await searchPokemons(searchQuery);
            resolve({ searchQuery, searchResults });
            console.log('Erhaltene Suchergebnisse:', searchResults);
        });

        currentSearchPromise = searchPromise;

        const { searchQuery: responseQuery, searchResults } = await searchPromise;

        hideLoadingIndicator();

        if (responseQuery === lastQuery && currentSearchPromise === searchPromise) {
            if (searchResults && searchResults.length > 0) {
                allPokemonData.length = 0;
                allPokemonData.push(...searchResults);

                renderAllPokemon(allPokemonData);
                await initModal(); // Warten, bis initModal abgeschlossen ist

                const tableHeaderExists = document.getElementById('pokemon-moves-header') !== null;
                const movesTableExists = document.getElementById('pokemon-moves') !== null;

                if (tableHeaderExists && movesTableExists) {
                    allPokemonData.forEach(pokemon => {
                        if (pokemon.movesDetails) { // Überprüfen Sie, ob movesDetails vorhanden sind
                            applyFilters(pokemon.movesDetails, 'sun-moon', 'level-up');
                        }
                    });
                } else {
                    console.error('Eines der erforderlichen Elemente für applyFilters fehlt im DOM.');
                }
            } else {
                nothingFound.innerHTML = `
                    <div class="alert alert-info m-3 text-center alert-dismissible fade show" role="alert">
                        Zu deiner Suche wurde leider kein Pokemon gefunden!
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>`;
                pokemonContainer.innerHTML = '';
                hideLoadingIndicator();
            }
        }
    } else {
        renderAllPokemon(allPokemonData.slice(0, 20));
        await initModal();
    }
}




export async function searchPokemons(query) {
    if (!query) return [];

    const filteredPokemons = allPokemonsList.filter(pokemon => 
        pokemon.name.toLowerCase().includes(query.toLowerCase())
    );

    let detailedPokemons = [];

    try {
        const detailedPokemonsPromises = filteredPokemons.map(pokemon => fetchPokemonDetail(pokemon.url));
        detailedPokemons = await Promise.all(detailedPokemonsPromises);

        // Zusätzliche Details für jedes Pokémon abrufen
        for (let i = 0; i < detailedPokemons.length; i++) {
            const pokemon = detailedPokemons[i];
            const originalPokemon = filteredPokemons[i];

            if (pokemon && pokemon.details && pokemon.details.speciesUrl) {
                // Bewegungen und Arten abrufen
                await fetchPokemonsMovesDetails(pokemon);
                await fetchPokemonsSpecies(pokemon);

                // Evolutionsdaten abrufen
                const speciesId = pokemon.details.speciesUrl.split('/').filter(part => part).pop();
                //console.log(`Abrufen der Evolutionsdaten für Species ID ${speciesId} für Pokémon ${originalPokemon.name}`);
                try {
                    const evolutionData = await getEvolutionDataForPokemon(speciesId);
                    //console.log(`Evolutionsdaten für ${originalPokemon.name}:`, evolutionData);
                    pokemon.evolutionData = evolutionData;
                } catch (evolutionError) {
                    console.error(`Fehler beim Abrufen der Evolutionsdaten für ${originalPokemon.name}:`, evolutionError);
                }

                // Hinzufügen von Name und URL
                pokemon.name = originalPokemon.name;
                pokemon.url = originalPokemon.url;
            }
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Detaildaten für Pokémon:', error);
    }

    return detailedPokemons;
}


