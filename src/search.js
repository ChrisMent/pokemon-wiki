import { allPokemonData, fetchPokemonDetail, fetchPokemonsMovesDetails , fetchPokemonsSpecies, getEvolutionDataForPokemon, updateUIWithNewPokemons, resetAndLoadInitialPokemons, showLoadingIndicator, hideLoadingIndicator } from './api.js';
import { renderAllPokemon } from './render.js'; 
import { allPokemonsList } from './data.js';
import { initModal, applyFilters } from './modal.js';
import { getBackgroundColor } from './utils.js'


// Zustandsvariable für aktive Suche
export let isSearchActive = false;
// Globale Variable für die letzte Suchanfrage
let lastQuery = '';
let currentSearchPromise = null;

// Eventhandling

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

    // Prüfen, ob die notwendigen Elemente für applyFilters im DOM vorhanden sind
    if (document.getElementById('pokemon-moves-header') && document.getElementById('pokemon-moves')) {
        allPokemonData.forEach(pokemon => {
            if (pokemon.movesDetails) {
                applyFilters(pokemon.movesDetails, 'sun-moon', 'level-up');
            }
        });
    } else {
        console.info('Some necessary elements for applyFilters are not yet in the DOM.');
    }
}

export async function performSearch() {
    showLoadingIndicator();
    const loadMoreButton = document.querySelector('.load-more');
    loadMoreButton.style.display = 'none';
    const searchInput = document.querySelector('.form-control');
    const searchQuery = searchInput.value.trim().toLowerCase();
    lastQuery = searchQuery;
    isSearchActive = true;

    const nothingFound = document.getElementById('info-message');
    nothingFound.innerHTML = '';

    if (searchQuery) {
        const searchPromise = new Promise(async (resolve, reject) => {
            const searchResults = await searchPokemons(searchQuery);
            resolve({ searchQuery, searchResults });
        });

        currentSearchPromise = searchPromise;
        const { searchQuery: responseQuery, searchResults } = await searchPromise;

        hideLoadingIndicator();

        if (responseQuery === lastQuery && currentSearchPromise === searchPromise) {
            if (searchResults && searchResults.length > 0) {
                updateUIForSearchResults(searchResults);
            } else {
                updateUIForNoResults();
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


