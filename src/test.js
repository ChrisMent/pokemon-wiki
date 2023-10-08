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

function loadAndShowModal(file, selectedPokemon) {
    // Hier können Sie den Code zum Laden des Modals aus der modal.html-Datei und zum Ersetzen der Platzhalter hinzufügen...
    // Zum Beispiel:
    fetch(file)
        .then(response => response.text())
        .then(modalContent => {
            modalContent = replaceValues(modalContent, selectedPokemon);
            document.querySelector('.modal-content').innerHTML = modalContent;
            // Zeigt das Modal an
            const modal = document.getElementById('pokemonModal');
            modal.style.display = "block";
        })
        .catch(error => {
            console.error("Error loading modal content:", error);
        });
}

function replaceValues(modalContent, pokemonData) {
    // Hier können Sie den Code zum Ersetzen der Platzhalter in modalContent mit den tatsächlichen Daten aus pokemonData hinzufügen...
    // Zum Beispiel:
    modalContent = modalContent.replace(/{{pokemonName}}/g, capitalizeFirstLetter(pokemonData.name));
    // ... (restlicher Code zum Ersetzen der Platzhalter)
    return modalContent;
}

// Restliche Funktionen und Code bleiben unverändert...






// Hauptfunktion zum Initialisieren des Modals
export function initModal() {
    console.log("initModal function started");
    const modal = document.getElementById('pokemonModal');
    const pokemonLinks = document.querySelectorAll('.pokemon-link');
    console.log(pokemonLinks.length + " Pokémon-Links gefunden");  // Zum Debuggen
    
    // Fügt jedem Pokémon-Link einen EventListener hinzu
    pokemonLinks.forEach(link => {
        link.addEventListener('click', async function(e) {
            // Verhindert das Standardverhalten des Links
            e.preventDefault();
            console.log(e.currentTarget);
            // Pfad zur modal.html-Datei
            const file = 'modal.html';
            // Extrahiert den Namen des angeklickten Pokémon aus dem href-Attribut
            const pokemonName = e.currentTarget.getAttribute('href');
            // Sucht nach den Daten des ausgewählten Pokémon im allPokemonData Array
            const selectedPokemon = allPokemonData.find(pokemon => pokemon.name === pokemonName);

            // Überprüft, ob Daten für das ausgewählte Pokémon gefunden wurden
            if (!selectedPokemon) {
                console.error(`Daten für ${pokemonName} nicht gefunden.`);
                return;
            }

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
        })
  });
}