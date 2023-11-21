// Importieren Sie benötigte Module und Funktionen
import { allPokemonData, getEvolutionDataForPokemon } from './api.js';
import { generateEvolutionHTML, renderMoves, updateTableHeader, renderPokemonStats,renderProgressBars, renderCardBackgroundColor , updateBaseDataAttributes, updateAboutDataAttributes } from './render.js';
import { lightenColor, getBackgroundColor, formatNumber, capitalizeFirstLetter, capitalizeEachWord } from './utils.js';
import { isSearchActive } from './search.js';

// Variable, um den Status des Modals zu verfolgen
let isModalOpen = false;
let currentGame = 'sun-moon'; // Standardwert
let currentLearnMethod = 'level-up'; // Standardwert

// Event-Handler, um das Modal zu schließen
function closeTheModal() {
    const modal = document.getElementById('pokemonModal');
    modal.style.display = "none";
    isModalOpen = false;

    // Anpassung des "Load More" Buttons beim Schließen des Modals
    const loadMoreButton = document.querySelector('.load-more');
    if (!isSearchActive) {
        loadMoreButton.style.display = 'flex';
    }
}

// Hauptfunktion zum Initialisieren des Modals

export async function initModal() {
    const pokemonListContainer = document.getElementById('overview-container');
    hideLoadMoreButtonIfSearchActive();

    pokemonListContainer.addEventListener('click', async function(e) {
        const link = e.target.closest('.pokemon-link');
        if (!link) return;

        e.preventDefault();
        const pokemonName = getPokemonNameFromLink(link);
        if (!pokemonName) return;

        const selectedPokemon = getSelectedPokemon(pokemonName);
        if (!selectedPokemon) {
            console.error(`Daten für ${pokemonName} nicht gefunden.`);
            return;
        }

        try {
            await loadModalContent(selectedPokemon);
            setUpEventListenersForModal(selectedPokemon);
        } catch (error) {
            console.error("Error loading modal content:", error);
        }
    });
}

async function loadModalContent(selectedPokemon) {
    const responseModal = await fetch('modal.html');
    if (!responseModal.ok) {
        throw new Error(`HTTP error! status: ${responseModal.status}`);
    }

    let textResponseModal = await responseModal.text();
    document.querySelector('.modal-content').innerHTML = textResponseModal;

    const modalContentElement = document.querySelector('.modal-content');
    
    // Event-Listener für das Modal einrichten
    setUpEventListenersForModal(selectedPokemon);

    updateBaseDataAttributes(modalContentElement, selectedPokemon);
    updateAboutDataAttributes(modalContentElement, selectedPokemon.details);
    renderCardBackgroundColor(modalContentElement, selectedPokemon.details.types[0]);

    // Erstellen der Daten für Fortschrittsbalken
    const progressBarsData = Array.from(modalContentElement.querySelectorAll('.progress-bar'))
    .map(progressBar => {
        const dataType = progressBar.getAttribute('data-width');
        const statValue = selectedPokemon.details.baseStats[dataType];
        return {
            dataType: dataType,
            width: statValue
        };
    });

    // Überprüfen, ob progressBarsData ein Array ist
    if (!Array.isArray(progressBarsData)) {
        console.error('progressBarsData ist kein Array:', progressBarsData);
        return;
    }

    renderProgressBars(progressBarsData, '.total');
    renderPokemonStats(modalContentElement, selectedPokemon);
    
    // Überprüfen, ob movesDetails vorhanden und korrekt ist
    if (!selectedPokemon.movesDetails || !Array.isArray(selectedPokemon.movesDetails)) {
        console.error('movesDetails nicht vorhanden oder nicht im erwarteten Format:', selectedPokemon.movesDetails);
        return; // Abbrechen, wenn movesDetails fehlen oder falsch sind
    }

    applyFilters(selectedPokemon.movesDetails, currentGame, currentLearnMethod);
    watchDropdown(selectedPokemon.movesDetails);
    watchNavigationMenu(selectedPokemon.movesDetails);

    const evolutionData = await getEvolutionDataForPokemon(selectedPokemon.name);
    const evolutionHTML = generateEvolutionHTML(evolutionData);
    document.getElementById('evolutionContent').innerHTML = evolutionHTML;
}


function setUpEventListenersForModal(selectedPokemon) {
    const modal = document.getElementById('pokemonModal');
    modal.style.display = "block";
    isModalOpen = true;

    const closeModalButton = document.getElementById('closeModal');
    closeModalButton.addEventListener('click', closeTheModal);

    const currentIndex = allPokemonData.findIndex(pokemon => pokemon.name === selectedPokemon.name);

    const arrowLeft = document.querySelector('.arrow-back');
    const arrowRight = document.querySelector('.arrow-forward');

    arrowLeft.addEventListener('click', () => changePokemon(currentIndex, 'previous'));
    arrowRight.addEventListener('click', () => changePokemon(currentIndex, 'next'));

    // Hier können weitere Event-Listener oder Interaktionslogiken hinzugefügt werden
}

// Funktion zum Wechseln des angezeigten Pokémons
async function changePokemon(currentIndex, direction) {
    let newIndex;
    if (direction === 'next') {
        newIndex = (currentIndex + 1) % allPokemonData.length;
    } else if (direction === 'previous') {
        newIndex = currentIndex - 1;
        if (newIndex < 0) {
            newIndex = allPokemonData.length - 1;
        }
    } else {
        console.error('Unbekannte Richtung:', direction);
        return;
    }

    await updateModalContent(newIndex);
}

// Funktion zum Aktualisieren des Inhalts des Modals
async function updateModalContent(pokemonIndex) {
    const newPokemonData = allPokemonData[pokemonIndex];

    if (!newPokemonData) {
        console.error("Keine Daten für den Index gefunden:", pokemonIndex);
        return;
    }

    try {
        const responseModal = await fetch('modal.html');
        if (!responseModal.ok) {
            throw new Error(`HTTP error! status: ${responseModal.status}`);
        }
        let textResponseModal = await responseModal.text();
        document.querySelector('.modal-content').innerHTML = textResponseModal;

        const modalContentElement = document.querySelector('.modal-content');

        
        updateBaseDataAttributes(modalContentElement, newPokemonData);
        updateAboutDataAttributes(modalContentElement, newPokemonData.details);
        renderCardBackgroundColor(modalContentElement, newPokemonData.details.types[0]);
        renderPokemonStats(modalContentElement, newPokemonData);

        // Erstellen der Daten für Fortschrittsbalken
        const progressBars = modalContentElement.querySelectorAll('.progress-bar');
        const progressBarsData = Array.from(progressBars).map(progressBar => {
            const dataType = progressBar.getAttribute('data-width');
            const statValue = newPokemonData.details.baseStats[dataType];
            return {
                dataType: dataType,
                width: statValue
            };
        });

        // Überprüfen, ob progressBarsData ein Array ist
        if (!Array.isArray(progressBarsData)) {
            console.error('progressBarsData ist kein Array:', progressBarsData);
            return;
        }

        // Aufruf von renderProgressBars
        renderProgressBars(progressBarsData, '.total');

        const evolutionData = await getEvolutionDataForPokemon(newPokemonData.name);
        const evolutionHTML = generateEvolutionHTML(evolutionData);
        document.getElementById('evolutionContent').innerHTML = evolutionHTML;


        applyFilters(newPokemonData.movesDetails, currentGame, currentLearnMethod);
        watchDropdown(newPokemonData.movesDetails);
        watchNavigationMenu(newPokemonData.movesDetails);
   
        setUpEventListenersForModal(newPokemonData);

    } catch (error) {
        console.error("Fehler beim Aktualisieren des Modalinhalts:", error);
    }
}

function getPokemonNameFromLink(link) {
    const hrefAttribute = link.getAttribute('href');
    if (!hrefAttribute) {
        console.error('Link has no href attribute');
        return null;
    }
    return hrefAttribute.split('/').pop().toLowerCase();
}

function getSelectedPokemon(pokemonName) {
    return allPokemonData.find(pokemon => pokemon.name && pokemon.name.toLowerCase() === pokemonName.toLowerCase());
}

function hideLoadMoreButtonIfSearchActive() {
    const loadMoreButton = document.querySelector('.load-more');
    if (isSearchActive) {
        loadMoreButton.style.display = 'none';
    }
}

function watchDropdown(selectedPokemonMoves) {
    // Event-Listener für alle Radio-Buttons im Dropdown hinzufügen
    document.querySelectorAll('#gameOptions input[type="radio"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            // Überprüfen, ob der Radio-Button tatsächlich geändert wurde
            if (this.checked) {
                // Den Wert des ausgewählten Radio-Buttons abrufen
                let selectedGame = this.getAttribute('data-customValue');

                // Den Text des ausgewählten Spiels abrufen
                let selectedGameOption = this.value;

                // Den Text des Elements mit der ID "selectedOption" ändern
                document.getElementById('selectedOption').textContent = selectedGameOption;

                // Dropdown schließen (optional)
                let dropdownMenu = document.querySelector('.dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.classList.remove('show');
                }

                // Moves basierend auf den ausgewählten Optionen aktualisieren
                applyFilters(selectedPokemonMoves, selectedGame);
            }
        });
    });
}

export function watchNavigationMenu(selectedPokemonMoves) {
    const navOptions = document.querySelectorAll('.nav-option');
    navOptions.forEach(navLink => {
        navLink.addEventListener('click', function() {
            const selectedLearnMethod = this.getAttribute('data-customValue');

            // Entfernen Sie 'active' von allen Links
            navOptions.forEach(function (innerNavLink) {
                innerNavLink.classList.remove('active');
            });
            // Fügen Sie 'active' zum angeklickten Link hinzu
            navLink.classList.add('active');

            applyFilters(selectedPokemonMoves, null, selectedLearnMethod);
        });
    });
}

export function applyFilters(selectedPokemon, game = currentGame, learnMethod = currentLearnMethod) {
    console.log('hier stehen die Moves: ', selectedPokemon)
    if (!Array.isArray(selectedPokemon)) {
        console.error("selectedPokemon is not an array:", selectedPokemon);
        return; // Verlasse die Funktion frühzeitig, da wir nicht weitermachen können
    }

    // Aktualisiere die aktuellen Werte, wenn sie übergeben werden
    if (game) currentGame = game;
    if (learnMethod) currentLearnMethod = learnMethod;

    const filteredMoves = selectedPokemon.map(move => {
        
        // Stelle sicher, dass move.versionGroupDetails existiert und ein Array ist
        if (!move.versionGroupDetails || !Array.isArray(move.versionGroupDetails)) {
            console.error("move.versionGroupDetails is not available or not an array:", move.versionGroupDetails);
            return null;
        }
        
        // Finden Sie den Index des versionGroupName, der currentGame entspricht
        const gameIndex = move.versionGroupDetails.findIndex(detail => detail.versionGroupName === currentGame);
        if (gameIndex !== -1 && move.versionGroupDetails[gameIndex].moveLearnMethodName === currentLearnMethod) {
            return {
                moveName: move.moveName,
                movePower: move.movePower,
                moveType: move.moveType,
                moveDamageClass: move.moveDamageClass,
                levelLearnedAt: move.versionGroupDetails[gameIndex].levelLearnedAt,
                moveLearnMethod: move.versionGroupDetails[gameIndex].moveLearnMethodName
            };
        }
        return null;
    }).filter(move => move !== null);
    
    updateTableHeader(currentLearnMethod);
    renderMoves(filteredMoves, currentLearnMethod);
}



