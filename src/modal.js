// modal.js  

// Importieren Sie benötigte Module und Funktionen
import { allPokemonData } from './api.js';
import { lightenColor, getBackgroundColor } from './utils.js';
import { capitalizeFirstLetter } from './utils.js';

// Hauptfunktion zum Initialisieren des Modals
export function initModal() {
    console.log("initModal function started");
    const modal = document.getElementById('pokemonModal');
    const pokemonLinks = document.querySelectorAll('.pokemon-link');
    console.log(pokemonLinks.length + " Pokémon-Links gefunden");  // Zum Debuggen
    
    // Fügt jedem Pokémon-Link einen EventListener hinzu
    document.body.addEventListener('click', function(e) {
        if (e.target.matches('.pokemon-link, .pokemon-link *')) {   
        
            // Verhindert das Standardverhalten des Links
            e.preventDefault();
            e.stopPropagation();

            // Zugriff auf das tatsächliche Link-Element
            const linkElement = e.target.closest('.pokemon-link');
            console.log(linkElement);

            // Pfad zur modal.html-Datei
            const file = 'modal.html';
            // Extrahiert den Namen des angeklickten Pokémon aus dem href-Attribut
            const pokemonName = linkElement.getAttribute('href');
            // Sucht nach den Daten des ausgewählten Pokémon im allPokemonData Array
            const selectedPokemon = allPokemonData.find(pokemon => pokemon.name === pokemonName);

            // Überprüft, ob Daten für das ausgewählte Pokémon gefunden wurden
            if (!selectedPokemon) {
                console.error(`Daten für ${pokemonName} nicht gefunden.`);
                return;
            }

            // An dieser Stelle können Sie den Code zum Laden und Anzeigen des Modals hinzufügen...
            // Zum Beispiel:
            loadAndShowModal(file, selectedPokemon);   
        }

        
    });
}

async function loadAndShowModal(file, selectedPokemon) {
    try {
        // Anfrage an modal.html
        const responseModal = await fetch(file);
        // Überprüft den Status der Antwort
        if (!responseModal.ok) {
            throw new Error(`HTTP error! status: ${responseModal.status}`);
        }

        // Konvertiert die Antwort in Text
        let textResponseModal = await responseModal.text();
        // Ersetzt Platzhalter im Text durch tatsächliche Daten
        textResponseModal = replaceValues(textResponseModal, selectedPokemon);
        // Setzt den modalContent in den DOM
        document.querySelector('.modal-content').innerHTML = textResponseModal;
        
        // Aktualisieren Sie die Fortschrittsbalken direkt nach dem Rendern des Modals
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

        // Setzen Sie die Breite des Fortschrittsbalkens bei Total
        const progressBarTotal = document.querySelector('.total');
        progressBarTotal.style.width = progressBarTotal.getAttribute('data-width') + '%';
        progressBarTotal.style.backgroundColor = '#faae0b'
        
        // Zeigt das Modal an
        const modal = document.getElementById('pokemonModal');
        modal.style.display = "block";

        // Setzt die Hintergrundfarbe des Elements mit der ID 'card-first-sec'
        const cardFirstSec = document.getElementById('card-first-sec');
        cardFirstSec.style.backgroundColor = getBackgroundColor(selectedPokemon.types[0]);

        // Fügt einen EventListener zum Schließen des Modals hinzu
        const closeModal = document.getElementById('closeModal');
        closeModal.addEventListener('click', function() {
            modal.style.display = "none";
        });
    
    } catch (error) {
        console.error("Error loading modal content:", error);
    }
}



// Funktion zum Ersetzen von Platzhaltern im modalContent
function replaceValues(modalContent, pokemonData) {
    modalContent = modalContent.replace(/{{pokemonName}}/g, capitalizeFirstLetter(pokemonData.name));
    modalContent = modalContent.replace('{{pokemonID}}', pokemonData.id);
    modalContent = modalContent.replace('{{pokemonType1}}', pokemonData.types[0]);
    
    // Überprüft, ob ein zweiter Pokémon-Typ vorhanden ist
    if (pokemonData.types[1]) {
        modalContent = modalContent.replace('{{pokemonType2}}', pokemonData.types[1]);
    } else {
        // Wenn kein zweiter Typ vorhanden ist, wird das div-Element ausgeblendet
        modalContent = modalContent.replace('<div id="type-2" class="badge-background badge rounded-pill">', '<div id="type-2" class="badge-background badge rounded-pill" style="display: none;">');
    }

    // Ersetzt das Pokémon-Bild
    modalContent = modalContent.replace(/{{pokemonImage}}/g, pokemonData.image);
    // Ruft die Hintergrundfarbe basierend auf dem ersten Pokémon-Typ ab
    const backgroundColor = getBackgroundColor(pokemonData.types[0]);
    // Ersetzt die Hintergrundfarbe
    modalContent = modalContent.replace('{{pokemonBackgroundColor}}', backgroundColor);
    modalContent = modalContent.replace('{{Species}}', pokemonData.genus);
    modalContent = modalContent.replace('{{heightInInch}}', pokemonData.heightInInch);
    modalContent = modalContent.replace('{{height}}', pokemonData.height);
    modalContent = modalContent.replace('{{weightInLbs}}', pokemonData.weightInLbs);
    modalContent = modalContent.replace('{{weightInKg}}', pokemonData.weightInKg);
    modalContent = modalContent.replace('{{abilities}}', pokemonData.abilities);

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
    
    modalContent = modalContent.replace('{{eggGroups}}', pokemonData.eggGroups);
    modalContent = modalContent.replace('{{captureRate}}', pokemonData.captureRate);
    
    // Mehrfache Vorkommen: Wenn es mehrere Vorkommen von {{x}} im Modal gibt, ersetzt die Methode .replace() nur das erste Vorkommen. Alle Vorkommen ersetzen, mit einem regulären Ausdruck.

    modalContent = modalContent.replace(/{{hp}}/g, pokemonData.baseStats.hp);
    modalContent = modalContent.replace(/{{attack}}/g, pokemonData.baseStats.attack);
    modalContent = modalContent.replace(/{{defense}}/g, pokemonData.baseStats.defense);
    modalContent = modalContent.replace(/{{specialAttack}}/g, pokemonData.baseStats.specialAttack);
    modalContent = modalContent.replace(/{{specialDefense}}/g, pokemonData.baseStats.specialDefense);
    modalContent = modalContent.replace(/{{speed}}/g, pokemonData.baseStats.speed);
    modalContent = modalContent.replace(/{{totalProgress}}/g, pokemonData.totalStatProgress);
       
    return modalContent;
}
