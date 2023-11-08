// modal.js  

// Importieren Sie benötigte Module und Funktionen
import { allPokemonData, getEvolutionDataForPokemon } from './api.js';
import { generateEvolutionHTML, renderMoves, updateTableHeader  } from './render.js';
import { lightenColor, getBackgroundColor, formatNumber } from './utils.js';
import { capitalizeFirstLetter, capitalizeEachWord } from './utils.js';

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
}

// Hauptfunktion zum Initialisieren des Modals

export async function initModal() {
    const pokemonListContainer = document.getElementById('overview-container');

    pokemonListContainer.addEventListener('click', async function(e) {
        const link = e.target.closest('.pokemon-link');
        if (!link) return;

        e.preventDefault();
        const hrefAttribute = link.getAttribute('href');
        if (!hrefAttribute) {
            console.error('Link has no href attribute');
            return;
        }

        const pokemonName = hrefAttribute.toLowerCase();
        console.log('allPokemonData:', allPokemonData);
        const selectedPokemon = allPokemonData.find(pokemon => pokemon.name.toLowerCase() === pokemonName.toLowerCase());

        console.log('selectedPokemon: ', selectedPokemon);
        console.log('pokemonName: ', pokemonName);

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
            textResponseModal = replaceValues(textResponseModal, selectedPokemon);
            document.querySelector('.modal-content').innerHTML = textResponseModal;

            // Setzen der Breite und Farbe des Fortschrittsbalkens
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

            const progressBarTotal = document.querySelector('.total');
            progressBarTotal.style.width = progressBarTotal.getAttribute('data-width') + '%';
            progressBarTotal.style.backgroundColor = '#faae0b';

            // Hintergrundfarbe für das erste Kartenelement setzen
            const cardFirstSec = document.getElementById('card-first-sec');
            if (selectedPokemon.types && selectedPokemon.types[0]) {
                cardFirstSec.style.backgroundColor = getBackgroundColor(selectedPokemon.types[0]);
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
            if (closeModalButton) {
                closeModalButton.removeEventListener('click', closeTheModal);
                closeModalButton.addEventListener('click', closeTheModal);
            }

        } catch (error) {
            console.error("Error loading modal content:", error);
        }
    });

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

// Funktion zum Ersetzen von Platzhaltern im modalContent
function replaceValues(modalContent, pokemonData) {

    const details = pokemonData.details;

    modalContent = modalContent.replace(/{{pokemonName}}/g, capitalizeEachWord(pokemonData.name));
    modalContent = modalContent.replace('{{pokemonID}}', formatNumber(pokemonData.id));
    modalContent = modalContent.replace('{{pokemonType1}}', capitalizeEachWord(details.types[0]));
    
    // Überprüft, ob ein zweiter Pokémon-Typ vorhanden ist
    if (pokemonData.details.types[1]) {
        modalContent = modalContent.replace('{{pokemonType2}}', capitalizeEachWord(details.types[1]));
    } else {
        // Wenn kein zweiter Typ vorhanden ist, wird das div-Element ausgeblendet
        modalContent = modalContent.replace('<div id="type-2" class="badge-background badge rounded-pill">', '<div id="type-2" class="badge-background badge rounded-pill" style="display: none;">');
    }

    // Ersetzt das Pokémon-Bild
    modalContent = modalContent.replace(/{{pokemonImage}}/g, details.sprites);
    // Ruft die Hintergrundfarbe basierend auf dem ersten Pokémon-Typ ab
    const backgroundColor = getBackgroundColor(details.types[0]);
    // Ersetzt die Hintergrundfarbe
    modalContent = modalContent.replace('{{pokemonBackgroundColor}}', backgroundColor);
    modalContent = modalContent.replace('{{Species}}', details.genusWithoutPokemon
    );
    modalContent = modalContent.replace('{{heightInInch}}', details.heightInInch);
    modalContent = modalContent.replace('{{height}}', details.height);
    modalContent = modalContent.replace('{{weightInLbs}}', details.weightInLbs);
    modalContent = modalContent.replace('{{weightInKg}}', details.weightInKg);
    // Konstante `capitalizedAbilities` erstellen, um das Ergebnis der `map`-Funktion zu speichern.
    // Die `map`-Funktion wird auf das Array `pokemonData.abilities` angewendet.
    // `map` ruft eine Callback-Funktion für jedes Element des Arrays auf und erstellt ein neues Array aus den Ergebnissen.
    const capitalizedAbilities = details.abilities.map(abilities => 
        capitalizeEachWord(abilities)
    );
    modalContent = modalContent.replace('{{abilities}}', 
    // `join` wird auf das `capitalizedAbilities`-Array angewendet, um seine Elemente zu einem einzigen String zusammenzufassen und mit dem Trennzeichen ', ' (Komma gefolgt von einem Leerzeichen) verbunden. Das Ergebnis ist ein String, welcher die Werte, separiert durch ein Komma ausgibt.
    capitalizedAbilities.join(', ')
  );

    // Überprüfen, ob ein Geschlecht vorhanden und dann das entsprechende Template rendern
    if (pokemonData.genderRateFemale == -1) {
        const genderUnknownPattern = /<tr id="gender-standard">[\s\S]*?<\/tr>/; // Ein regulärer Ausdruck, der die <tr> Zeile mit der ID "gender-standard" erfasst
        modalContent = modalContent.replace(genderUnknownPattern, ''); 
        // Entfernen Sie das Standard-Template
    } else {
        const genderStandardPattern = /<tr id="gender-unknown">[\s\S]*?<\/tr>/; // Ein regulärer Ausdruck, der die <tr> Zeile mit der ID "gender-unknown" erfasst
        modalContent = modalContent.replace(genderStandardPattern, ''); 
        // Entfernen Sie das "Unknown"-Template
        modalContent = modalContent.replace('{{genderRateFemale}}', pokemonData.genderRateFemale);
        modalContent = modalContent.replace('{{genderRateMale}}', pokemonData.genderRateMale);
    }
    const capitalizedEggGroups = pokemonData.eggGroups.map(eggGroups => capitalizeEachWord(eggGroups))
    modalContent = modalContent.replace('{{eggGroups}}', capitalizedEggGroups.join(', '));
    
    modalContent = modalContent.replace('{{captureRate}}', pokemonData.captureRate);
    
    // Mehrfache Vorkommen: Wenn es mehrere Vorkommen von {{x}} im Modal gibt, ersetzt die Methode .replace() nur das erste Vorkommen. Alle Vorkommen ersetzen, mit einem regulären Ausdruck.

    modalContent = modalContent.replace(/{{hp}}/g, details.baseStats.hp);
    modalContent = modalContent.replace(/{{attack}}/g, details.baseStats.attack);
    modalContent = modalContent.replace(/{{defense}}/g, details.baseStats.defense);
    modalContent = modalContent.replace(/{{specialAttack}}/g, details.baseStats.specialAttack);
    modalContent = modalContent.replace(/{{specialDefense}}/g, details.baseStats.specialDefense);
    modalContent = modalContent.replace(/{{speed}}/g, details.baseStats.speed);
    modalContent = modalContent.replace(/{{totalProgress}}/g, details.baseStats.totalProgress); // pokemonData.baseStats.totalStatProgress
       
    return modalContent;
}



