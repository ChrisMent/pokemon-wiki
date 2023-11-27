import {
    allPokemonData,
    fetchPokemonDetail,
    fetchPokemonsMovesDetails,
    fetchPokemonsSpecies,
    resetAndLoadInitialPokemons,
} from './api.js';
import {
    renderAllPokemon,
    updateArrowVisibility
} from './render.js';
import {
    allPokemonsList
} from './data.js';
import {
    initModal,
} from './modal.js';
import {
    showLoadingIndicator,
    hideLoadingIndicator
} from './utils.js'


// Zustandsvariable, um zu überprüfen, ob eine Suche aktiv ist
export let isSearchActive = false;

// Speichert die zuletzt ausgeführte Suchanfrage
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

function clearNoPokemons() {
    const searchInput = document.querySelector('.form-control');
    searchInput.value = '';
    isSearchActive = false; // Setze die Suche als nicht aktiv
    resetAndLoadInitialPokemons().then(() => {
        hideLoadingIndicator(); // Verstecke den Ladeindikator nach dem Neuladen der Pokémon
    });

    const nothingFound = document.getElementById('info-message');
    nothingFound.innerHTML = ''; // Leere die nothingFound-Nachricht

    const loadMoreButton = document.querySelector('.load-more');
    loadMoreButton.style.display = 'flex';

}

// Funktion: searchDebounce
// Zweck: Erstellt eine verzögerte ("debounced") Version einer Funktion, die erst nach einer angegebenen Wartezeit ausgeführt wird. Dies ist nützlich, um zu verhindern, dass eine Funktion zu oft in kurzer Zeit ausgeführt wird, wie z.B. bei der Eingabe in ein Suchfeld.
// Parameter:
//   - func: Die Funktion, die verzögert ausgeführt werden soll.
//   - wait: Die Wartezeit in Millisekunden, bevor die Funktion ausgeführt wird, nachdem die letzte Ausführung angefordert wurde.
// Rückgabewert: Eine neue Funktion, die die übergebene Funktion 'func' mit einer Verzögerung ausführt.

function searchDebounce(func, wait) {
    let timeout; // Variable zum Speichern des Timeout-Identifikators.

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout); // Löscht den vorherigen Timeout.
            func(...args); // Ruft die übergebene Funktion 'func' mit allen übergebenen Argumenten auf.
        };

        clearTimeout(timeout); // Setzt den Timeout zurück, wenn die Funktion erneut aufgerufen wird, bevor die Wartezeit abgelaufen ist.
        timeout = setTimeout(later, wait); // Setzt einen neuen Timeout, um die Funktion 'later' nach der Wartezeit 'wait' auszuführen.
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

// Funktion: performSearch
// Zweck: Führt eine Suche basierend auf dem Wert im Suchfeld aus und aktualisiert die Benutzeroberfläche entsprechend den Suchergebnissen.
// Suchlogik: Die Funktion ruft searchPokemons auf, um die Pokémon zu finden, die dem Suchbegriff entsprechen. Anschließend werden Details wie Bewegungen und Arten für jedes gefundene Pokémon geladen.

export async function performSearch() {
    // Zeigt den Ladeindikator an
    showLoadingIndicator();

    // Verbirgt den "Load More"-Button während der Suche
    const loadMoreButton = document.querySelector('.load-more');
    loadMoreButton.style.display = 'none';

    // Ermittelt den aktuellen Suchbegriff aus dem Eingabefeld
    const searchInput = document.querySelector('.form-control');
    const searchQuery = searchInput.value.trim().toLowerCase();

    // Speichert den aktuellen Suchbegriff global, um doppelte Suchanfragen zu verhindern
    lastQuery = searchQuery;
    isSearchActive = true; // Setzt den Status der Suche auf aktiv

    if (searchQuery) {
        // Führt die Suche aus und wartet auf die Ergebnisse
        const searchResults = await searchPokemons(searchQuery);

        // Überprüft, ob der Suchbegriff noch aktuell ist (um Doppelanfragen bei schnellen Eingaben zu verhindern)
        if (lastQuery === searchQuery) {
            hideLoadingIndicator(); // Verbirgt den Ladeindikator nach der Suche

            // Überprüft, ob Suchergebnisse vorhanden sind
            if (searchResults && searchResults.length > 0) {
                allPokemonData.length = 0; // Leert das vorhandene Pokémon-Array
                allPokemonData.push(...searchResults); // Fügt die Suchergebnisse zum Array hinzu

                // Lädt Zusatzdaten für jedes gefundene Pokémon
                for (const pokemon of allPokemonData) {
                    await fetchPokemonsMovesDetails(pokemon);
                    await fetchPokemonsSpecies(pokemon);
                }

                // Aktualisiert die Benutzeroberfläche mit den Suchergebnissen
                renderAllPokemon(allPokemonData);
                await initModal(); // Initialisiert das Modal für die angezeigten Pokémon
                updateArrowVisibility(); // Aktualisiert die Sichtbarkeit der Pfeile
            } else {
                // Aktualisiert die UI, falls keine Ergebnisse gefunden wurden
                updateUIForNoResults();
            }
        }
    } else {
        // Setzt die Suche zurück und lädt die anfänglichen Pokémon-Daten, wenn das Suchfeld leer ist
        resetAndLoadInitialPokemons();
    }
}


// Funktion: searchPokemons
// Zweck: Durchsucht die Liste aller Pokémon nach Pokémon, die den übergebenen Suchbegriff enthalten.
// Parameter: 
//   - query: Der Suchbegriff, der zum Filtern der Pokémon verwendet wird.
// Rückgabewert: Ein Promise, das eine Liste von detaillierten Pokémon-Objekten zurückgibt.

export async function searchPokemons(query) {
    // Wenn kein Suchbegriff übergeben wird, gibt die Funktion ein leeres Array zurück.
    if (!query) return [];

    // Filtert die Liste aller Pokémon basierend auf dem eingegebenen Suchbegriff. 
    // Es wird überprüft, ob der Name eines Pokémon den Suchbegriff enthält.
    const filteredPokemons = allPokemonsList.filter(pokemon =>
        pokemon.name.toLowerCase().includes(query.toLowerCase())
    );

    // Initialisiert ein leeres Array für die detaillierten Pokémon-Daten.
    let detailedPokemons = [];

    try {
        // Erstellt ein Array von Promises, um die Detailinformationen für jedes gefilterte Pokémon abzurufen.
        const detailedPokemonsPromises = filteredPokemons.map(pokemon => fetchPokemonDetail(pokemon.url));
        // Wartet auf die Erfüllung aller Promises und speichert die Ergebnisse in `detailedPokemons`.
        detailedPokemons = await Promise.all(detailedPokemonsPromises);

        // Läuft durch jedes Detail-Pokémon und ruft zusätzliche Informationen ab.
        for (let i = 0; i < detailedPokemons.length; i++) {
            const pokemon = detailedPokemons[i];
            const originalPokemon = filteredPokemons[i];

            // Überprüft, ob das Pokémon existiert und ob es zusätzliche Detailinformationen hat.
            if (pokemon && pokemon.details && pokemon.details.speciesUrl) {
                // Ruft Bewegungs- und Artendaten für das Pokémon ab.
                await fetchPokemonsMovesDetails(pokemon);
                await fetchPokemonsSpecies(pokemon);

                // Ergänzt das Pokémon-Objekt mit Name und URL aus der ursprünglichen Liste.
                pokemon.name = originalPokemon.name;
                pokemon.url = originalPokemon.url;
            }
        }
    } catch (error) {
        // Protokolliert einen Fehler, falls beim Abrufen der Detaildaten ein Problem auftritt.
        console.error('Fehler beim Abrufen der Detaildaten für Pokémon:', error);
    }

    // Gibt die Liste der detaillierten Pokémon zurück.
    return detailedPokemons;
}
