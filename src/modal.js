// modal.js  

// Importieren Sie benötigte Module und Funktionen
import { allPokemonData, getEvolutionDataForPokemon } from './api.js';
import { generateEvolutionHTML, renderMoves, updateTableHeader, renderPokemonStats,renderProgressBars, renderCardBackgroundColor , updateBaseDataAttributes, updateAboutDataAttributes } from './render.js';
import { lightenColor, getBackgroundColor, formatNumber } from './utils.js';
import { capitalizeFirstLetter, capitalizeEachWord } from './utils.js';
import { isSearchActive } from './search.js';

// Variable, um den Status des Modals zu verfolgen
let isModalOpen = false;

// Event-Handler für Klicks außerhalb des Modals
function handleOutsideClick(event) {
    const modal = document.getElementById('pokemonModal');
    if (event.target === modal) {
        closeTheModal();
    }
}

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

    // "Load More" Button ausblenden, wenn eine Suche aktiv ist
    const loadMoreButton = document.querySelector('.load-more');
    if (isSearchActive) {
        loadMoreButton.style.display = 'none';
    }

    pokemonListContainer.addEventListener('click', async function(e) {
        const link = e.target.closest('.pokemon-link');
        if (!link) return;
        e.preventDefault();
        const hrefAttribute = link.getAttribute('href');
        if (!hrefAttribute) {
            console.error('Link has no href attribute');
            return;
        }

        const pokemonName = hrefAttribute.split('/').pop().toLowerCase();
        //console.log('Klick auf Pokémon:', pokemonName);
        
       
        const selectedPokemon = allPokemonData.find(pokemon => pokemon.name && pokemon.name.toLowerCase() === pokemonName.toLowerCase());

        //console.log('selectedPokemon:', selectedPokemon);

        if (!selectedPokemon) {
            console.error(`Daten für ${pokemonName} nicht gefunden.`);
            return;
        }

        try {
            const file = 'modal.html';
            const responseModal = await fetch(file);

            if (!responseModal.ok) {
                throw new Error(`HTTP error! status: ${responseModal.status}`);
            }

            let textResponseModal = await responseModal.text();
            //textResponseModal = replaceValues(textResponseModal, selectedPokemon);
            document.querySelector('.modal-content').innerHTML = textResponseModal;

            // Aufruf der renderPokemonStats Funktion
            const modalContentElement = document.querySelector('.modal-content');
            updateBaseDataAttributes(modalContentElement, selectedPokemon);
            updateAboutDataAttributes(modalContentElement, selectedPokemon.details);
            renderPokemonStats(modalContentElement, selectedPokemon);

            // Sammeln der Daten für Fortschrittsbalken nach dem Ersetzen der Platzhalter
            const progressBarsData = Array.from(document.querySelectorAll('.progress-bar'))
            .map(progressBar => {
                const dataType = progressBar.getAttribute('data-width');
                // Zugriff auf die Werte im Unterobjekt 'baseStats'
                const statValue = selectedPokemon.details.baseStats[dataType];
                return {
                    dataType: dataType,
                    width: statValue
                };
            });
        
            //console.log("progressBarsData nach Laden und Ersetzen:", progressBarsData);

            // Aufruf von renderProgressBars
            renderProgressBars(progressBarsData, '.total');

            // Ermitteln des Index des ausgewählten Pokémon
            const selectedIndex = allPokemonData.findIndex(pokemon => pokemon.name.toLowerCase() === pokemonName.toLowerCase());
            //console.log('Index des ausgewählten Pokémon:', selectedIndex);

            // Event-Listener für die Pfeile hinzufügen
            const arrowLeft = document.querySelector('.arrow-back');
            const arrowRight = document.querySelector('.arrow-forward');

            arrowLeft.addEventListener('click', () => changePokemon(selectedIndex, 'previous'));
            arrowRight.addEventListener('click', () => changePokemon(selectedIndex, 'next'));

            // Hintergrundfarbe für das erste Kartenelement setzen
            const cardFirstSec = document.getElementById('card-first-sec');
            
            //console.log('Selected Pokemon Details:', selectedPokemon.details);

            if (selectedPokemon.details && selectedPokemon.details.types && selectedPokemon.details.types[0]) {
                const cardFirstSec = document.getElementById('card-first-sec'); // Stellen Sie sicher, dass diese ID korrekt ist
                renderCardBackgroundColor(cardFirstSec, selectedPokemon.details.types[0]);
                //console.log('Background color:', bgColor);
            }

            // Evolutionsdaten abrufen und HTML generieren
            const evolutionData = await getEvolutionDataForPokemon(pokemonName);
            const evolutionHTML = generateEvolutionHTML(evolutionData);
            document.getElementById('evolutionContent').innerHTML = evolutionHTML;

            // Dropdown- und Navigationsereignisse überwachen
            watchDropdown(selectedPokemon.movesDetails);
            watchNavigationMenu(selectedPokemon.movesDetails);
            applyFilters(selectedPokemon.movesDetails);

            // Zeigt das Modal an und setzt den Zustand auf offen
            const modal = document.getElementById('pokemonModal');
            modal.style.display = "block";
            isModalOpen = true;

            // Event-Listener für das Schließen des Modals hinzufügen
            const closeModalButton = document.getElementById('closeModal');
            closeModalButton.addEventListener('click', closeTheModal);
            

        } catch (error) {
            console.error("Error loading modal content:", error);
        }
    });

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
    

    async function updateModalContent(pokemonIndex) {
        // Ermitteln der neuen Pokémon-Daten
        const newPokemonData = allPokemonData[pokemonIndex];
    
        if (!newPokemonData) {
            console.error("Keine Daten für den Index gefunden:", pokemonIndex);
            return;
        }
    
        try {
            // Ersetzen des Inhalts im Modal mit neuen Daten
            const responseModal = await fetch('modal.html');
            if (!responseModal.ok) {
                throw new Error(`HTTP error! status: ${responseModal.status}`);
            }
            let textResponseModal = await responseModal.text();
            textResponseModal = replaceValues(textResponseModal, newPokemonData);
            document.querySelector('.modal-content').innerHTML = textResponseModal;
    
            // Setzen der Breite und Farbe der Fortschrittsbalken
            const progressBars = document.querySelectorAll('.progress-bar');
            progressBars.forEach(progressBar => {
                const widthValue = parseFloat(progressBar.dataset.width);
                progressBar.style.width = widthValue + '%';
                if (widthValue > 50) {
                    progressBar.style.backgroundColor = '#6DCD95';
                } else {
                    progressBar.style.backgroundColor = '#FDA2A2';
                }
            });
    
            // Hintergrundfarbe für das erste Kartenelement setzen
            const cardFirstSec = document.getElementById('card-first-sec');
            if (newPokemonData.details && newPokemonData.details.types && newPokemonData.details.types[0]) {
                const bgColor = getBackgroundColor(newPokemonData.details.types[0]);
                cardFirstSec.style.backgroundColor = bgColor;
            }
    
            // Evolutionsdaten abrufen und HTML generieren
            const evolutionData = await getEvolutionDataForPokemon(newPokemonData.name);
            const evolutionHTML = generateEvolutionHTML(evolutionData);
            document.getElementById('evolutionContent').innerHTML = evolutionHTML;
    
            // Dropdown- und Navigationsereignisse überwachen
            watchDropdown(newPokemonData.movesDetails);
            watchNavigationMenu(newPokemonData.movesDetails);
            applyFilters(newPokemonData.movesDetails);

            // Zeigt das Modal an und setzt den Zustand auf offen
            const modal = document.getElementById('pokemonModal');
            modal.style.display = "block";
            isModalOpen = true;
            
            // Event-Listener für das Schließen des Modals hinzufügen
            const closeModalButton = document.getElementById('closeModal');
            closeModalButton.addEventListener('click', closeTheModal);
    
            // Aktualisieren des Event-Listeners für die Pfeile
            const arrowLeft = document.querySelector('.arrow-back');
            const arrowRight = document.querySelector('.arrow-forward');
    
            arrowLeft.addEventListener('click', () => changePokemon(pokemonIndex, 'previous'));
            arrowRight.addEventListener('click', () => changePokemon(pokemonIndex, 'next'));
    
        } catch (error) {
            console.error("Fehler beim Aktualisieren des Modalinhalts:", error);
        }
    }
    
    
    // Event-Listener für Klicks außerhalb des Modals hinzufügen
    window.removeEventListener('click', handleOutsideClick); // Entfernen Sie das alte Ereignis, falls es existiert
    window.addEventListener('click', handleOutsideClick); // Fügen Sie das Ereignis hinzu, um das Modal zu schließen, wenn auf den Hintergrund geklickt wird

    // Stellen Sie sicher, dass das Modal nicht sofort angezeigt wird
    const modal = document.getElementById('pokemonModal');
    modal.style.display = "none";

    // Stellen Sie sicher, dass die .modal-content-Klicks nicht das Modal schließen
    const modalContent = document.querySelector('.modal-content');
    modalContent.addEventListener('click', function(e) {
        e.stopPropagation();
    });
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

let currentGame = 'sun-moon'; // Standardwert
let currentLearnMethod = 'level-up'; // Standardwert

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



