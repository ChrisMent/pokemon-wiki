import {
    lightenColor,
    getBackgroundColor,
    capitalizeFirstLetter,
    capitalizeEachWord,
    formatNumber,
    hideLoadingIndicator,
    } from './utils.js';
import {
    allPokemonData,
    isInitialLoad,
    getRenderedPokemonCount,
    incrementRenderedPokemonCount
} from './api.js';

// Die Funktion renderAllPokemon() ist als Hilfsfunktion gedacht, die die renderOverview() - Funktion für jedes Pokémon-Objekt in dem Array = allPokemonData (api.js) aufruft. 

// --> Für jedes dieser Objekte wird die renderOverview-Funktion aufgerufen
// --> Parameter allPokemonData ist das Array aus api.js

// Funktion: renderAllPokemon
// Zweck: Rendert alle Pokémon-Daten in der Benutzeroberfläche.
export function renderAllPokemon(allPokemonData) {
    // Zugriff auf den Container im DOM, in dem alle Pokémon dargestellt werden sollen.
    const pokemonContainer = document.getElementById("pokemon-container");
    // Leeren des Containers, um alte Inhalte zu entfernen oder bei einer Neuladung neu zu beginnen.
    pokemonContainer.innerHTML = '';

    // Iteriere durch jedes Pokémon-Datenobjekt und rufe die Funktion renderOverview auf,
    // um die Darstellung jedes einzelnen Pokémon zu verwalten.
    for (let pokemonData of allPokemonData) {
        renderOverview(pokemonData);
    }
}


// Funktion: renderOverview
// Zweck: Rendert die Übersichtsdarstellung für ein einzelnes Pokémon.
// pokemonData: Das Datenobjekt für ein spezifisches Pokémon.
// localTotalPokemonCount: Die Gesamtzahl der Pokémon, die gerendert werden sollen.

export function renderOverview(pokemonData, localTotalPokemonCount) {
    // Extrahieren der relevanten Pokémon-Daten. Nutzung von 'details' falls vorhanden, ansonsten direkte Nutzung von 'pokemonData'.
    const data = pokemonData.details ? pokemonData.details : pokemonData;
    // Setzen der Hintergrundfarbe je nach dem ersten Pokemon-Typ in der Übersicht
    const bgColor = getBackgroundColor(data.types[0]);

    //console.log('pokemonData:', data);
    //console.log('types:', data.types);
    //console.log('sprites:', data.sprites);

    // Überprüfung, ob die notwendigen Daten vorhanden sind. Bei Fehlen wird ein Fehler protokolliert und die Funktion frühzeitig beendet. Die if Bedingung prüft ob, !data || !data.types || !data.sprites NICHT vorhanden. Wenn das "true" ergibt wird die Funktion beendet.
    if (!data || !data.types || !data.sprites) {
        console.error('Pokemon-Daten fehlen oder sind unvollständig:', pokemonData);
        // Hier können Sie entscheiden, ob Sie eine Ladeanzeige rendern wollen.
        return; // Beendet die Funktion frühzeitig, um Fehler zu vermeiden
    }
    // Zugriff auf den Container, in dem das Pokémon dargestellt wird.
    const pokemonContainer = document.getElementById("pokemon-container");

    // Fügen des HTML-Inhalts zum Container hinzu
    pokemonContainer.innerHTML += overviewText(data, bgColor)


    // Inkrementiere den Zähler für gerenderte Pokémon zur Kontrolle der Ladeanzeige
    incrementRenderedPokemonCount();
    // Ändern der Bedingung für das Ausblenden des Spinners
    if ((isInitialLoad && getRenderedPokemonCount() === allPokemonData.length) ||
        (!isInitialLoad && getRenderedPokemonCount() === localTotalPokemonCount)) {
        hideLoadingIndicator();
    }
}

function overviewText(data, bgColor){
    const overviewContent =`
    <div class="col-6 col-lg-3">
        <a href="${data.name}" class="pokemon-link" style="text-decoration: none; color: inherit;">
            <div class="overview-card p-3 border rounded-4" style="background-color: ${bgColor}; cursor: pointer;">
                <img class="overview-background" src="/pokemon-wiki/img/poke_ball_icon.svg" alt="Pokeball Icon">
                <h3 class="pokemon-name">${capitalizeEachWord(data.name)}</h3>
                <div class="overview-columns">
                    <div class="overview-badges">
                        <span class="overview-badge badge rounded-pill" style="background-color:${lightenColor(bgColor, 10)}">${capitalizeEachWord(data.types[0])}</span>
                        ${data.types[1] ? `<span class="overview-badge badge rounded-pill" style="background-color: ${lightenColor(bgColor, 10)}">${capitalizeEachWord(data.types[1])}</span>` : ''}
                    </div>
                    <div class="overview-img-container">
                        <img class="overview-img" src="${data.sprites}" alt="Pokemon Monster Image">
                    </div>
                </div>
            </div>
        </a>
    </div>
    `;
    return overviewContent
}

// Funktion: updateBaseDataAttributes
// Zweck: Aktualisiert die Attribute im Modal-Dialog basierend auf den Basisdaten des Pokémon.
// modalContent: Das DOM-Element, das den Inhalt des Modal-Dialogs enthält in modal.js definiert --> updateBaseDataAttributes(modalContentElement, selectedPokemon);
// pokemonData: Das Datenobjekt für das ausgewählte Pokémon.

export function updateBaseDataAttributes(modalContent, pokemonData) {
    // Bereitstellen der Pokemon-Details für die Switch - funktion
    const details = pokemonData.details;
    // Auswahl aller Elemente im Modal, die Datenattribute für Basisdaten enthalten. Datenattribute aus dem HTML werden immer mit [] übernommen
    const baseDataElements = modalContent.querySelectorAll('[data-base-data]');

    //element: Die Variable element wird durch die forEach-Schleife definiert, die über alle DOM-Elemente iteriert, die das Attribut [data-base-data] haben. Jedes dieser Elemente wird in einem Durchlauf der Schleife als element referenziert.
    baseDataElements.forEach(element => {
        // Abfrage des spezifischen Datentyps, der aktualisiert werden soll.
        const dataType = element.getAttribute('data-base-data');
        
        // Die switch-Anweisung wird mit dem Wert von 'dataType' aufgerufen.
        switch (dataType) {
            // Wenn im case 'dataType' gleich 'pokemonName' ist, wird dieser Codeblock ausgeführt. 
            case 'pokemonName':
                /*Ersetzen des Textinhalts: Wenn element.textContent einem neuen Wert zugewiesen wird, ersetzt dieser Wert den bisherigen Textinhalt des Elements. Das bedeutet, der ursprüngliche Text wird durch den neuen Text ersetzt.*/
                element.textContent = capitalizeEachWord(pokemonData.name);
                // 'break': Stellt sicher das die Bedingungen aus dem case immer erfüllt sind. Ansonsten läuft die Switchprüfung und die Datenaktualisierung nicht mehr weiter.
                break;
            case 'pokemonID':
                element.textContent = '#' + formatNumber(details.id); 
                break;
            case 'pokemonType1':
                element.textContent = capitalizeEachWord(details.types[0]);
                break;
            case 'pokemonType2':
                if (details.types[1]) {
                    element.textContent = capitalizeEachWord(details.types[1]);
                } else {
                    element.style.display = 'none';
                }
                break;
            case 'pokemonImage':
                // Setzt das 'src'-Attribut des Elements auf den URL-Wert des Pokémon-Bildes.
                // 'details.sprites' enthält den URL zum Bild des Pokémon.
                 // 'element.setAttribute': Setzt ein neues Attribut (hier 'src') für das Element ein. Hier muss das Attribut geändert werden und nicht der Text deswegen setAttribute beim Element
                element.setAttribute('src', details.sprites);
                break;
            case 'pokemonBackgroundColor':
                // Berechnet die Hintergrundfarbe basierend auf dem Typ des Pokémon.
                // 'getBackgroundColor': Eine Funktion, die eine Farbe basierend auf dem Pokémon-Typ zurückgibt.
                // 'details.types[0]': Der primäre Typ des Pokémon, verwendet zur Farbbestimmung.    
            
                const backgroundColor = getBackgroundColor(details.types[0]);
                // Setzt die Hintergrundfarbe des Elements auf die berechnete Farbe.
                // 'element.style.backgroundColor': Ändert den CSS-Style 'background-color' des Elements.
                element.style.backgroundColor = backgroundColor;
                break;
                // Weitere Fälle können hier hinzugefügt werden
        }
    });
    updateArrowVisibility();
}


// Funktion: updateAboutDataAttributes
// Zweck: Aktualisiert die "Über"-Informationen eines Pokémon im Modal-Dialog.
// modalContent: Das DOM-Element, das den Inhalt des Modal-Dialogs enthält in modal.js definiert --> updateAboutDataAttributes(modalContentElement, selectedPokemon.details);
// details: Die detaillierten Informationen über das Pokémon.

export function updateAboutDataAttributes(modalContent, details) {
    // Selektiert alle Elemente im Modal, die Datenattribute für 'Über'-Informationen haben.
    const aboutDataElements = modalContent.querySelectorAll('[data-about]');

    aboutDataElements.forEach(element => {
        // Liest das 'data-about'-Attribut jedes Elements aus, um zu bestimmen, welche Informationen aktualisiert werden sollen.
        const aboutType = element.getAttribute('data-about');

        // Eine switch-Anweisung, die verschiedene Fälle basierend auf 'aboutType' behandelt.
        switch (aboutType) {
            case 'species':
                // Setzt den Textinhalt des Elements auf die Art des Pokémon, ohne das Wort 'Pokémon'.
                element.textContent = details.genusWithoutPokemon;
                break;
            case 'height':
                // Setzt den Textinhalt des Elements auf die Größe des Pokémon in Zoll und Zentimetern.
                element.textContent = `${details.heightInInch} inches (${details.height} cm)`;
                break;
            case 'weight':
                // Setzt den Textinhalt des Elements auf das Gewicht des Pokémon in Pfund und Kilogramm.
                element.textContent = `${details.weightInLbs} lbs (${details.weightInKg} kg)`;
                break;
            case 'abilities':
                // Wenn Fähigkeiten vorhanden sind, werden diese formatiert und als Textinhalt gesetzt.
                if (details.abilities) {
                    const capitalizedAbilities = details.abilities.map(ability => capitalizeEachWord(ability));
                    element.textContent = capitalizedAbilities.join(', ');
                }
                break;
            case 'genderRateFemale':
                // Setzt den Textinhalt auf den Prozentsatz weiblicher Pokémon, falls vorhanden.
                element.textContent = (details.genderRateFemale !== -1) ? `${details.genderRateFemale}%` : '';
                break;
            case 'genderRateMale':
                // Setzt den Textinhalt auf den Prozentsatz männlicher Pokémon, falls vorhanden.
                element.textContent = (details.genderRateFemale !== -1) ? `${details.genderRateMale}%` : '';
                break;
            case 'eggGroups':
                // Wenn Eigruppen vorhanden sind, werden diese formatiert und als Textinhalt gesetzt.
                if (details.eggGroups) {
                    const capitalizedEggGroups = details.eggGroups.map(eggGroup => capitalizeEachWord(eggGroup));
                    element.textContent = capitalizedEggGroups.join(', ');
                }
                break;
            case 'captureRate':
                // Setzt den Textinhalt auf die Fangrate des Pokémon.
                element.textContent = `${details.captureRate}%`;
                break;
                // Weitere Fälle können hier hinzugefügt werden
        }
    });

    // Anpassung der Anzeige für Geschlechterinformationen, je nachdem ob diese bekannt sind.
    const genderUnknownRow = modalContent.querySelector('#gender-unknown');
    const genderStandardRow = modalContent.querySelector('#gender-standard');
    if (details.genderRateFemale === -1) {
        // Zeigt die 'Unbekannt'-Zeile an, wenn die Geschlechterrate unbekannt ist.
        genderUnknownRow.style.display = '';
        genderStandardRow.style.display = 'none';
    } else {
        // Verbirgt die 'Unbekannt'-Zeile und zeigt die Standardzeile an, wenn die Geschlechterrate bekannt ist.
        genderUnknownRow.style.display = 'none';
        genderStandardRow.style.display = '';
    }
}


// Funktion: renderCardBackgroundColor
// Zweck: Setzt die Hintergrundfarbe eines Karten-Elements basierend auf dem Typ des Pokémon.
// cardElement: Das DOM-Element der Karte, dessen Hintergrundfarbe geändert werden soll.
// pokemonType: Der Typ des Pokémon, der zur Bestimmung der Hintergrundfarbe verwendet wird.
// Wird in 2 Funktionen der modal.js aufgerufen renderCardBackgroundColor(modalContentElement, newPokemonData.details.types[0]);

export function renderCardBackgroundColor(cardElement, pokemonType) {
    // Überprüft, ob ein Pokémon-Typ angegeben wurde.
    if (pokemonType) {
        // Ruft die Funktion getBackgroundColor auf, die eine Farbe basierend auf dem Pokémon-Typ zurückgibt.
        // pokemonType: Der Typ des Pokémon, z.B. "Feuer", "Wasser" etc.
        const bgColor = getBackgroundColor(pokemonType);

        // Setzt die Hintergrundfarbe des cardElement auf die durch getBackgroundColor ermittelte Farbe.
        // cardElement.style.backgroundColor: Die Eigenschaft, die den CSS-Stil für die Hintergrundfarbe des Elements steuert.
        cardElement.style.backgroundColor = bgColor;
    }
    // Wenn kein pokemonType angegeben ist, wird keine Änderung an der Hintergrundfarbe vorgenommen.
}


// Funktion: renderPokemonStats
// Zweck: Aktualisiert die Statistik-Werte eines Pokémon im Modal-Dialog beim Update des Pokemons
// modalContent: Das DOM-Element, das den Inhalt des Modal-Dialogs enthält. Generiert in der updateModalContent(pokemonIndex) der modal.js
// selectedPokemon: Das ausgewählte Pokémon-Objekt, dessen Statistiken angezeigt werden sollen.

export function renderPokemonStats(modalContent, selectedPokemon) {
    // Selektiert alle Elemente im Modal, die Datenattribute für Statistiken haben.
    const statsElements = modalContent.querySelectorAll('[data-stat]');

    // Iteriert durch jedes Element, das eine Pokémon-Statistik darstellt.
    statsElements.forEach(element => {
        // Liest das 'data-stat'-Attribut jedes Elements aus, um zu bestimmen, welche Statistik angezeigt werden soll.
        const statType = element.getAttribute('data-stat');

        // Setzt den Textinhalt des Elements auf den Wert der entsprechenden Statistik aus dem selectedPokemon-Objekt.
        // selectedPokemon.details.baseStats[statType]: Greift auf den spezifischen Statistikwert zu, basierend auf dem Wert von 'statType'.
        element.textContent = selectedPokemon.details.baseStats[statType];
    });
    // Nach Durchlauf dieser Schleife sind alle Statistik-Elemente im Modal mit den aktuellen Werten des ausgewählten Pokémon aktualisiert.
}


// Funktion: renderProgressBars
// Zweck: Aktualisiert die Fortschrittsbalken im Modal-Dialog entsprechend den übergebenen Daten.
// progressBarsData: Ein Array von Objekten, die Informationen zu jedem Fortschrittsbalken enthalten.
// totalProgressBarSelector: Ein CSS-Selektor für den Gesamtfortschrittsbalken.

export function renderProgressBars(progressBarsData, totalProgressBarSelector) {
    // Iteriert durch jedes Objekt in progressBarsData.
    progressBarsData.forEach(progressBarData => {
        // Findet das DOM-Element des Fortschrittsbalkens basierend auf dem dataType-Wert.
        const progressBar = document.querySelector(`[data-width="${progressBarData.dataType}"]`);

        // Konvertiert den width-Wert in eine Fließkommazahl und setzt die Breite des Balkens.
        const widthValue = parseFloat(progressBarData.width);
        progressBar.style.width = widthValue + '%';

        // Setzt die Hintergrundfarbe des Balkens basierend auf dem width-Wert.
        if (widthValue > 50) {
            progressBar.style.backgroundColor = '#6DCD95'; // Grüner Balken für Werte über 50%
        } else {
            progressBar.style.backgroundColor = '#FDA2A2'; // Roter Balken für Werte unter oder gleich 50%
        }
    });

    // Verarbeitung des Gesamtfortschrittsbalkens, falls ein Selektor angegeben ist.
    if (totalProgressBarSelector) {
        // Findet den Gesamtfortschrittsbalken basierend auf dem Selektor.
        const progressBarTotal = document.querySelector(totalProgressBarSelector);
        if (!progressBarTotal) {
            console.error('Gesamtfortschrittsbalken nicht gefunden:', totalProgressBarSelector);
            return; // Beendet die Funktion, falls der Balken nicht gefunden wird.
        }
        // Setzt die Breite des Gesamtfortschrittsbalkens basierend auf seinem eigenen data-width Attribut.
        progressBarTotal.style.width = progressBarTotal.getAttribute('data-width') + '%';
        progressBarTotal.style.backgroundColor = '#faae0b'; // Gelber Balken für den Gesamtfortschritt.
    }
}


// Funktion: generateEvolutionHTML
// Zweck: Erzeugt HTML-Inhalt für die Darstellung der Evolutionskette eines Pokémon.
// evolutionChain: Ein Array von Objekten, die die Evolutionskette eines Pokémon repräsentieren.

export function generateEvolutionHTML(evolutionChain) {
    let htmlContent = ''; // Initialisierung der Variablen für den gesamten HTML-Inhalt.

    // Iteration durch die Evolutionskette, außer dem letzten Element (keine weitere Evolution).
    for (let i = 0; i < evolutionChain.length - 1; i++) {
        const currentPokemon = evolutionChain[i]; // Aktuelles Pokémon in der Kette.
        const nextPokemon = evolutionChain[i + 1]; // Nächstes Pokémon in der Kette.

        // Aufruf der Funktion generateEvolutionSegmentHTML, um das HTML-Segment für jedes Evolutionspaar zu erzeugen.
        const segment = generateEvolutionSegmentHTML(currentPokemon, nextPokemon);

        htmlContent += segment; // Hinzufügen des Segments zum gesamten HTML-Inhalt.
    }

    return htmlContent; // Rückgabe des gesamten HTML-Inhalts.
}

// Funktion: generateEvolutionSegmentHTML
// Zweck: Erzeugt das HTML-Segment für einen spezifischen Evolutionsschritt.
// currentPokemon: Das aktuelle Pokémon in der Evolutionskette.
// nextPokemon: Das nächste Pokémon in der Evolutionskette.

function generateEvolutionSegmentHTML(currentPokemon, nextPokemon) {
    // Erstellung des HTML-Segments für die Darstellung der Evolution von currentPokemon zu nextPokemon.
    return `
        <div class="container text-center">
            <div class="evolution-postion-container row gx-5 p-0">
                <div class="col">
                    <div class="evolution-pokemon">
                        <div class="evolution-row">
                            <div class="evolution-col-img">
                                <div class="evolution-img-container">
                                    <img class="poke-thumbnail" src="${currentPokemon.thumbnail}" alt="${currentPokemon.name} Thumbnail">
                                </div>
                                <p><strong>${capitalizeFirstLetter(currentPokemon.name)}</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col d-flex align-items-center justify-content-center flex-column">
                    <img src="/pokemon-wiki/img/arrow-right.svg" alt="evolution-arrow-right">
                    <div class="padding-mobile"></div>
                </div>
                <div class="col">
                    <div class="evolution-pokemon">
                        <div class="evolution-row">
                            <div class="evolution-col-img">
                                <div class="evolution-img-container">
                                    <img class="poke-thumbnail" src="${nextPokemon.thumbnail}" alt="${nextPokemon.name} Thumbnail">
                                </div>
                                <p class="padding-mobile"><strong>${capitalizeFirstLetter(nextPokemon.name)}</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <hr>
        </div>`;
}


export function renderMoves(moves, currentLearnMethod) {
    // Zugriff auf das HTML-Element, das die Tabelle mit den Pokémon-Bewegungen darstellt.
    const tableMoves = document.getElementById('pokemon-moves');

    // Überprüfen, ob das Tabellenelement vorhanden ist, um Fehler zu vermeiden.
    if (!tableMoves) {
        console.error('Element "pokemon-moves" nicht gefunden.');
        return; // Frühzeitiger Abbruch der Funktion, falls das Element nicht gefunden wird.
    }

    // Sortieren der Bewegungen basierend auf dem Level, an dem sie erlernt werden.
    moves.sort((a, b) => a.levelLearnedAt - b.levelLearnedAt);

    // Erstellen des HTML-Inhalts für jede Bewegung und deren Details.
    const movesHTML = moves.map(move => {
        return `
            <tr>
            ${["tutor", "egg", "machine"].includes(currentLearnMethod) ? '' : `<th class="align-middle text-center" scope="row">${move.levelLearnedAt}</th>`}
            <td class="align-middle text-center">${capitalizeEachWord(move.moveName)}</td>
            <td class="align-middle text-center">${move.movePower ? move.movePower : '-'}</td>
            <td class="align-middle text-center">${capitalizeEachWord(move.moveType)}</td>
            <td class="align-middle text-center">${capitalizeEachWord(move.moveDamageClass)}</td>
            </tr>
        `;
    }).join('');

    // Aktualisierung des innerHTML des Tabellenelements mit den generierten Bewegungsinformationen.
    tableMoves.innerHTML = movesHTML;
}


export function updateTableHeader(currentLearnMethod) {
    // Suche nach dem Element mit der ID 'pokemon-moves-header'
    const tableHeader = document.getElementById('pokemon-moves-header');
    //console.log("Update Table Header aufgerufen, tableHeader gefunden:", tableHeader);

    // Überprüfe, ob das Element vorhanden ist
    if (tableHeader) {
        // Entscheide, welcher HTML-Code basierend auf der aktuellen Lernmethode verwendet werden soll
        if (["tutor", "egg", "machine"].includes(currentLearnMethod)) {
            // Setze den HTML-Inhalt für die Methoden 'tutor', 'egg', 'machine'
            tableHeader.innerHTML = `
                <tr>
                    <th class="align-middle text-center">Move Name</th>
                    <th class="align-middle text-center">Power</th>
                    <th class="align-middle text-center">Type</th>
                    <th class="align-middle text-center">Damage Class</th>
                </tr>
            `;
        } else {
            // Setze den HTML-Inhalt für die Methode 'level-up' oder andere
            tableHeader.innerHTML = `
                <tr>
                    <th class="align-middle text-center">Level</th>
                    <th class="align-middle text-center">Move Name</th>
                    <th class="align-middle text-center">Power</th>
                    <th class="align-middle text-center">Type</th>
                    <th class="align-middle text-center">Damage Class</th>
                </tr>
            `;
        }
    } else {
        // Protokolliere einen Fehler, wenn das Element nicht gefunden wird
        console.error('Element pokemon-moves-header nicht gefunden.');
    }
}

// Funktion zum Aktualisieren der Sichtbarkeit der Pfeile
export function updateArrowVisibility() {
    // Suche nach den Pfeilelementen im DOM, weil diese im Modal sind muss die Fehlermeldung abgefangen werden, siehe folgendes If- Statement
    const leftArrow = document.querySelector('.bg-arrow-left');
    const rightArrow = document.querySelector('.bg-arrow-right');

    // Überprüfen, ob die Pfeilelemente vorhanden sind, um Fehler zu vermeiden.
    // Der NOT Operator !leftArrow ODER !rightArrow prüft, ob die Konstanten null oder undefined sind, wenn eine der beiden Bedingungen wahr sind, wird eine Info protokolliert und die Funktion beendet.

    if (!leftArrow || !rightArrow) {
        console.info("Pfeilelemente in der Übersicht nicht vorhanden.");
        return;
    }

    // Wenn nur ein einzelnes Pokémon vorhanden ist, werden beide Pfeile ausgeblendet, da kein Wechsel zu einem anderen Pokémon möglich ist.
    // Wenn mehr als ein Pokémon vorhanden ist, werden die Pfeile eingeblendet, um den Wechsel zwischen den Pokémon zu ermöglichen.
    if (allPokemonData.length <= 1) {
        leftArrow.style.display = 'none';
        rightArrow.style.display = 'none';
    } else {
        leftArrow.style.display = 'block';
        rightArrow.style.display = 'block';
    }

}
