// Importieren Sie benötigte Module und Funktionen
import {
    allPokemonData,
    getEvolutionDataForPokemon,
} from './api.js';
import {
    generateEvolutionHTML,
    renderMoves,
    updateTableHeader,
    renderPokemonStats,
    renderProgressBars,
    renderCardBackgroundColor,
    updateBaseDataAttributes,
    updateAboutDataAttributes,
    updateArrowVisibility 
} from './render.js';
import {
    isSearchActive
} from './search.js';


export let isModalOpen = false; // Variable, um den Status des Modals zu verfolgen
let currentGame = 'sun-moon'; // Standardwert für die das Pokemon Spiel im Bereich Moves
let currentLearnMethod = 'level-up'; // Standardwert für Lernmethode im Bereich Moves

// Hauptfunktion zum Initialisieren des Modals

// Initialisiert das Modal, indem Event-Listener für Klicks auf Pokémon-Links hinzugefügt werden.
export async function initModal() {
    // Zugriff auf den Container, der die Pokémon-Liste enthält.
    const pokemonListContainer = document.getElementById('overview-container');
    // Verbirgt den "Load More"-Button, wenn eine Suche aktiv ist.
    hideLoadMoreButtonIfSearchActive();

    // Fügt einen Klick-Event-Listener zum Container hinzu.
    pokemonListContainer.addEventListener('click', async function(e) {
        // Ermittelt den nächsten Pokémon-Link, der zum geklickten Element gehört.
        const link = e.target.closest('.pokemon-link');
        if (!link) return; // Beendet die Funktion, wenn kein Link gefunden wird.

        // Verhindert die Standardaktion des Links.
        e.preventDefault();
        // Holt den Pokémon-Namen aus dem Link.
        const pokemonName = getPokemonNameFromLink(link);
        if (!pokemonName) return; // Beendet die Funktion, wenn kein Name gefunden wird.

        // Ermittelt das ausgewählte Pokémon basierend auf dem Namen.
        const selectedPokemon = getSelectedPokemon(pokemonName);
        if (!selectedPokemon) {
            // Protokolliert einen Fehler und beendet die Funktion, wenn das Pokémon nicht gefunden wird.
            console.error(`Daten für ${pokemonName} nicht gefunden.`);
            return;
        }

        try {
            // Lädt den Inhalt des Modals und richtet Event-Listener ein.
            await loadModalContent(selectedPokemon);
            setUpEventListenersForModal(selectedPokemon);
            updateArrowVisibility();
        } catch (error) {
            // Protokolliert Fehler beim Laden des Modalinhalts.
            console.error("Error loading modal content:", error);
        }
    });
}


// Lädt den Inhalt des Modals für ein ausgewähltes Pokémon.
async function loadModalContent(selectedPokemon) {
    // Lädt die Modal-HTML-Datei.
    const responseModal = await fetch('modal.html');
    if (!responseModal.ok) {
        throw new Error(`HTTP error! status: ${responseModal.status}`);
    }

    // Setzt den Inhalt des Modals auf den geladenen HTML-Text.
    let textResponseModal = await responseModal.text();
    document.querySelector('.modal-content').innerHTML = textResponseModal;

    // Wählt das Element für den Modal-Inhalt aus.
    const modalContentElement = document.querySelector('.modal-content');

    // Aktualisiert verschiedene Teile des Modals basierend auf den Daten des ausgewählten Pokémon.
    updateBaseDataAttributes(modalContentElement, selectedPokemon);
    updateAboutDataAttributes(modalContentElement, selectedPokemon.details);
    renderCardBackgroundColor(modalContentElement, selectedPokemon.details.types[0]);

    // Erstellt Daten für Fortschrittsbalken basierend auf den Statistiken des Pokémon.
    const progressBarsData = Array.from(modalContentElement.querySelectorAll('.progress-bar'))
        .map(progressBar => {
            const dataType = progressBar.getAttribute('data-width');
            const statValue = selectedPokemon.details.baseStats[dataType];
            return {
                dataType: dataType,
                width: statValue
            };
        });

    // Überprüft, ob die Daten für die Fortschrittsbalken korrekt sind.
    if (!Array.isArray(progressBarsData)) {
        console.error('progressBarsData ist kein Array:', progressBarsData);
        return;
    }

    // Rendert die Fortschrittsbalken und Pokémon-Statistiken.
    renderProgressBars(progressBarsData, '.total');
    renderPokemonStats(modalContentElement, selectedPokemon);

    // Überprüft, ob die Bewegungsdaten vorhanden und korrekt sind.
    if (!selectedPokemon.movesDetails || !Array.isArray(selectedPokemon.movesDetails)) {
        console.error('movesDetails nicht vorhanden oder nicht im erwarteten Format:', selectedPokemon.movesDetails);
        return;
    }

    // Wendet Filter auf die Bewegungsdaten an und beobachtet Dropdown- und Navigationsmenüs.
    applyFilters(selectedPokemon.movesDetails, currentGame, currentLearnMethod);
    watchDropdown(selectedPokemon.movesDetails);
    watchNavigationMenu(selectedPokemon.movesDetails);

    // Lädt und rendert die Evolutionsdaten.
    const evolutionData = await getEvolutionDataForPokemon(selectedPokemon.name);
    const evolutionHTML = generateEvolutionHTML(evolutionData);
    document.getElementById('evolutionContent').innerHTML = evolutionHTML;
    updateArrowVisibility();
}


// Richtet Event-Listener für das Modal ein.
function setUpEventListenersForModal(selectedPokemon) {
    // Wählt das Modal-Element aus und zeigt es an.
    const modal = document.getElementById('pokemonModal');
    modal.style.display = "block";
    isModalOpen = true;

    // Fügt Event-Listener zum Schließen-Button hinzu.
    const closeModalButton = document.getElementById('closeModal');
    closeModalButton.addEventListener('click', closeTheModal);

    // Ermittelt den aktuellen Index des ausgewählten Pokémon im Datenarray.
    const currentIndex = allPokemonData.findIndex(pokemon => pokemon.name === selectedPokemon.name);

    // Wählt die Pfeil-Elemente für das Blättern durch Pokémon aus.
    const arrowLeft = document.querySelector('.arrow-back');
    const arrowRight = document.querySelector('.arrow-forward');

    // Fügt Event-Listener zu den Pfeilen hinzu, um das Pokémon zu wechseln.
    arrowLeft.addEventListener('click', () => changePokemon(currentIndex, 'previous'));
    arrowRight.addEventListener('click', () => changePokemon(currentIndex, 'next'));
}


// Ändert das aktuell im Modal angezeigte Pokémon.
async function changePokemon(currentIndex, direction) {
    let newIndex;
    // Bestimmt den neuen Index basierend auf der gewählten Richtung ('next' oder 'previous').
    if (direction === 'next') {
        // Für 'next', erhöht den Index und wendet einen Modulo an, um am Ende der Liste wieder von vorne zu beginnen.
        newIndex = (currentIndex + 1) % allPokemonData.length;
    } else if (direction === 'previous') {
        // Für 'previous', verringert den Index und geht zum letzten Element, wenn der Anfang erreicht ist.
        newIndex = currentIndex - 1;
        if (newIndex < 0) {
            newIndex = allPokemonData.length - 1;
        }
    } else {
        // Gibt einen Fehler aus, wenn eine unbekannte Richtung angegeben wurde.
        console.error('Unbekannte Richtung:', direction);
        return;
    }

    // Ruft die Funktion zum Aktualisieren des Inhalts des Modals auf, basierend auf dem neuen Index.
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
        updateArrowVisibility();

    } catch (error) {
        console.error("Fehler beim Aktualisieren des Modalinhalts:", error);
    }
}

export function closeTheModal() {
    const modal = document.getElementById('pokemonModal');
    modal.style.display = "none";
    isModalOpen = false;

    // Anpassung des "Load More" Buttons beim Schließen des Modals
    const loadMoreButton = document.querySelector('.load-more');
    if (!isSearchActive) {
        loadMoreButton.style.display = 'flex';
    }
    updateArrowVisibility();
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
            navOptions.forEach(function(innerNavLink) {
                innerNavLink.classList.remove('active');
            });
            // Fügen Sie 'active' zum angeklickten Link hinzu
            navLink.classList.add('active');

            applyFilters(selectedPokemonMoves, null, selectedLearnMethod);
        });
    });
}

export function applyFilters(selectedPokemon, game = currentGame, learnMethod = currentLearnMethod) {
    //console.log('hier stehen die Moves: ', selectedPokemon)
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