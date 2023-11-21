import { allPokemonData, fetchPokemonDetail, fetchPokemonsMovesDetails , fetchPokemonsSpecies, getEvolutionDataForPokemon, updateUIWithNewPokemons, resetAndLoadInitialPokemons, showLoadingIndicator, hideLoadingIndicator } from './api.js';
import { renderAllPokemon } from './render.js'; 
import { allPokemonsList } from './data.js';
import { initModal, applyFilters } from './modal.js';
import { getBackgroundColor } from './utils.js'


// Zustandsvariable für aktive Suche
export let isSearchActive = false;
// Globale Variable für die letzte Suchanfrage
let lastQuery = '';

// Eventhandling

document.addEventListener("DOMContentLoaded", function() {
    // Initialisierung von Elementen
    const searchInput = document.querySelector('.form-control');
    const searchButton = document.querySelector('.search-button');
    const loadMoreButton = document.querySelector('.load-more');
    
    // Funktionen zum Hinzufügen von Event-Listenern
    setupSearchInputEvents(searchInput, loadMoreButton);
    setupSearchButtonEvent(searchButton);
    setupCloseButtonEvents();
    setupClearSearchEvent();

    // Starten der initialen Suchfunktion
    searchPokemons();
});

function setupSearchInputEvents(searchInput, loadMoreButton) {
    // Event-Listener für die Eingabetaste im Suchfeld
    searchInput.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Verhindern des Standardverhaltens
            await performSearch(event);
        }
    });

    // Event-Listener für das Fokussieren und Verlassen des Suchfelds
    searchInput.addEventListener('focus', () => loadMoreButton.style.display = 'none');
    searchInput.addEventListener('blur', () => {
        if (!isSearchActive) {
            loadMoreButton.style.display = 'flex';
        }
    });

    // Event-Listener für Änderungen im Suchfeld
    searchInput.addEventListener('input', (event) => {
        if (event.target.value.trim() === '') {
            clearNoPokemons();
        }
    });

    // Debounced Event-Listener für das Suchfeld
    const debouncedSearch = searchDebounce(performSearch, 300);
    searchInput.addEventListener('input', debouncedSearch);
}


function setupSearchButtonEvent(searchButton) {
    // Event-Listener für den Such-Button
    searchButton.addEventListener('click', handleSearchButtonClick);
}

function setupCloseButtonEvents() {
    // Event-Listener für den Close-Button
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-close') || event.target.id === 'clearSearch') {
            clearNoPokemons();
        }
    });
}

function setupClearSearchEvent() {
    // Event-Listener für das Löschen der Suche
    document.getElementById('clearSearch').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
    });
}

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

function updateUIForNoResults() {
    const nothingFound = document.getElementById('info-message');
    nothingFound.innerHTML = `
        <div class="alert alert-info m-3 text-center alert-dismissible fade show" role="alert">
            Zu deiner Suche wurde leider kein Pokemon gefunden!
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
    document.getElementById("pokemon-container").innerHTML = '';
    hideLoadingIndicator();
}

function updateUIForSearchResults(searchResults) {
    allPokemonData.length = 0;
    allPokemonData.push(...searchResults);
    renderAllPokemon(allPokemonData);
    initModal();
    
    // Warte, bis alle movesDetails geladen sind, bevor die UI aktualisiert wird
    Promise.all(allPokemonData.map(pokemon => fetchPokemonsMovesDetails(pokemon)));
}


export async function performSearch() {
    showLoadingIndicator();
    const loadMoreButton = document.querySelector('.load-more');
    loadMoreButton.style.display = 'none';
    const searchInput = document.querySelector('.form-control');
    const searchQuery = searchInput.value.trim().toLowerCase();
    lastQuery = searchQuery;
    isSearchActive = true;

    if (searchQuery) {
        const searchResults = await searchPokemons(searchQuery);

        if (lastQuery === searchQuery) {
            hideLoadingIndicator();
            if (searchResults && searchResults.length > 0) {
                // Warten, bis alle movesDetails geladen sind, bevor die UI aktualisiert wird
                await Promise.all(searchResults.map(pokemon => fetchPokemonsMovesDetails(pokemon)));
                
                // Aktualisiere die UI mit den vollständig geladenen Pokémon-Daten
                updateUIForSearchResults(searchResults);
            } else {
                updateUIForNoResults();
            }
        }
    } else {
        resetAndLoadInitialPokemons();
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



