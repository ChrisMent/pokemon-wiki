import { allPokemonData } from './api.js';
import { renderAllPokemon } from './render.js';

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
export function performSearch() {
    // Überprüfen, ob allPokemonData definiert und nicht leer ist
    if (!allPokemonData || allPokemonData.length === 0) {
        console.error("allPokemonData ist nicht definiert oder leer.");
        return;
    }

    const searchInput = document.querySelector('.form-control');
    let searchValueLower = searchInput.value.toLowerCase();
    // console.log('Hier wird umgewandelt:' + searchValueLower);

    let searchResult = allPokemonData.filter(function(pokemon) {
        return pokemon.name.includes(searchValueLower);
    });

    let nothingFound = document.getElementById('info-message');
    let searchResultList = document.getElementById('pokemon-container');

    if (searchValueLower === ''){
        renderAllPokemon(allPokemonData);  // Alle Pokémon anzeigen, wenn die Suche leer ist
        nothingFound.innerHTML = ``;
    } else if (searchResult.length === 0) {
        nothingFound.innerHTML = `
        <div class="alert alert-info m-3 text-center alert-dismissible fade show" role="alert">Zu deiner Suche wurde leider kein Pokemon gefunden!
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
        searchResultList.innerHTML = '';
    } else {
        renderAllPokemon(searchResult);
    }
}

// Funktion, die den Suchbutton initialisiert
export function searchPokemons() {
    let searchButton = document.querySelector('.search-button');
    searchButton.addEventListener("click", (e) => {
        e.preventDefault();
        performSearch();  // Die gleiche Suchfunktion aufrufen, wenn der Suchbutton geklickt wird
    });
}