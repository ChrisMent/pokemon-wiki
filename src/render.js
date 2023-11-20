import { lightenColor, getBackgroundColor, capitalizeFirstLetter, capitalizeEachWord, formatNumber } from './utils.js';
import { hideLoadingIndicator, allPokemonData, incrementRenderedPokemonCount, resetRenderedPokemonCount, getCurrentRenderedPokemonCount, isInitialLoad, renderedPokemonCount } from './api.js';
import { initModal, applyFilters } from './modal.js';

// Die Funktion renderAllPokemon() ist als Hilfsfunktion gedacht, die die renderOverview() - Funktion für jedes Pokémon-Objekt in dem Array = allPokemonData (api.js) aufruft. 

// --> Für jedes dieser Objekte wird die renderOverview-Funktion aufgerufen
// --> Parameter allPokemonData ist das Array aus api.js

export function renderAllPokemon(allPokemonData) {
    const pokemonContainer = document.getElementById("pokemon-container");
    pokemonContainer.innerHTML = '';

    for (let pokemonData of allPokemonData) {
        renderOverview(pokemonData);
    }
}

// Diese Funktion ist für ein einzelnes Pokémon-Objekt gedacht
export function renderOverview(pokemonData, localTotalPokemonCount) {
    // Extrahieren Sie die relevanten Daten basierend auf der Struktur
    const data = pokemonData.details ? pokemonData.details : pokemonData;

    //console.log('pokemonData:', data);
    //console.log('types:', data.types);
    //console.log('sprites:', data.sprites);

    // Überprüfen, ob die erforderlichen Daten vorhanden sind
    if (!data || !data.types || !data.sprites) {
        console.error('Pokemon-Daten fehlen oder sind unvollständig:', pokemonData);
        // Hier können Sie entscheiden, ob Sie eine Ladeanzeige rendern wollen.
        return; // Beendet die Funktion frühzeitig, um Fehler zu vermeiden
    }

    const pokemonContainer = document.getElementById("pokemon-container");

    // Setzen der Hintergrundfarbe je nach dem ersten Pokemon-Typ
    const bgColor = getBackgroundColor(data.types[0]);

    // Fügen des HTML-Inhalts zum Container hinzu
    pokemonContainer.innerHTML += `
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


    // Inkrementiere den Zähler für gerenderte Pokémon
    incrementRenderedPokemonCount();

    // Ändern der Bedingung für das Ausblenden des Spinners
    if ((isInitialLoad && renderedPokemonCount === allPokemonData.length) ||
        (!isInitialLoad && renderedPokemonCount === localTotalPokemonCount)) {
        hideLoadingIndicator();
    }
}

export function updateBaseDataAttributes(modalContent, pokemonData) {
    const details = pokemonData.details;
    const baseDataElements = modalContent.querySelectorAll('[data-base-data]');

    baseDataElements.forEach(element => {
        const dataType = element.getAttribute('data-base-data');
        switch (dataType) {
            case 'pokemonName':
                element.textContent = capitalizeEachWord(pokemonData.name);
                break;
            case 'pokemonID':
                element.textContent = '#' + formatNumber(details.id); // Hier wird die 'id' direkt aus 'details' abgerufen
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
                element.setAttribute('src', details.sprites);
                break;
            case 'pokemonBackgroundColor':
                const backgroundColor = getBackgroundColor(details.types[0]);
                element.style.backgroundColor = backgroundColor;
                break;
            // Weitere Fälle können hier hinzugefügt werden
        }
    });
}

export function updateAboutDataAttributes(modalContent, details) {
    const aboutDataElements = modalContent.querySelectorAll('[data-about]');

    aboutDataElements.forEach(element => {
        const aboutType = element.getAttribute('data-about');
        switch (aboutType) {
            case 'species':
                element.textContent = details.genusWithoutPokemon;
                break;
            case 'height':
                element.textContent = `${details.heightInInch} inches (${details.height} cm)`;
                break;
            case 'weight':
                element.textContent = `${details.weightInLbs} lbs (${details.weightInKg} kg)`;
                break;
            case 'abilities':
                if (details.abilities) {
                    const capitalizedAbilities = details.abilities.map(ability => capitalizeEachWord(ability));
                    element.textContent = capitalizedAbilities.join(', ');
                }
                break;
            case 'genderRateFemale':
                element.textContent = (details.genderRateFemale !== -1) ? `${details.genderRateFemale}%` : '';
                break;
            case 'genderRateMale':
                element.textContent = (details.genderRateFemale !== -1) ? `${details.genderRateMale}%` : '';
                break;
            case 'eggGroups':
                if (details.eggGroups) {
                    const capitalizedEggGroups = details.eggGroups.map(eggGroup => capitalizeEachWord(eggGroup));
                    element.textContent = capitalizedEggGroups.join(', ');
                }
                break;
            case 'captureRate':
                element.textContent = `${details.captureRate}%`;
                break;
            // Fügen Sie hier weitere Fälle hinzu
        }
    });

    // Behandlung der Anzeige/Verbergen von Geschlechterinformationen
    const genderUnknownRow = modalContent.querySelector('#gender-unknown');
    const genderStandardRow = modalContent.querySelector('#gender-standard');
    if (details.genderRateFemale === -1) {
        genderUnknownRow.style.display = '';
        genderStandardRow.style.display = 'none';
    } else {
        genderUnknownRow.style.display = 'none';
        genderStandardRow.style.display = '';
    }
}

export function renderCardBackgroundColor(cardElement, pokemonType) {
    if (pokemonType) {
        const bgColor = getBackgroundColor(pokemonType);
        cardElement.style.backgroundColor = bgColor;
    }
}

export function renderPokemonStats(modalContent, selectedPokemon) {
    const statsElements = modalContent.querySelectorAll('[data-stat]');
    statsElements.forEach(element => {
        const statType = element.getAttribute('data-stat');
        element.textContent = selectedPokemon.details.baseStats[statType];
    });
}

export function renderProgressBars(progressBarsData, totalProgressBarSelector) {
    progressBarsData.forEach(progressBarData => {
        const progressBar = document.querySelector(`[data-width="${progressBarData.dataType}"]`);
        const widthValue = parseFloat(progressBarData.width);
        progressBar.style.width = widthValue + '%';

        // Ausführliche Schreibweise für backgroundColor
        if (widthValue > 50) {
            progressBar.style.backgroundColor = '#6DCD95';
        } else {
            progressBar.style.backgroundColor = '#FDA2A2';
        }
    });

    // Verarbeitung des Gesamtfortschrittsbalkens
    if (totalProgressBarSelector) {
        const progressBarTotal = document.querySelector(totalProgressBarSelector);
        if (!progressBarTotal) {
            console.error('Gesamtfortschrittsbalken nicht gefunden:', totalProgressBarSelector);
            return;
        }
        progressBarTotal.style.width = progressBarTotal.getAttribute('data-width') + '%';
        progressBarTotal.style.backgroundColor = '#faae0b';
    }
}

export function generateEvolutionHTML(evolutionChain) {
    let htmlContent = '';  // Initialisieren Sie die Variablen
    for (let i = 0; i < evolutionChain.length - 1; i++) {

        
        const currentPokemon = evolutionChain[i];
        const nextPokemon = evolutionChain[i + 1];

        const segment = `
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

        htmlContent += segment;
    }

    return htmlContent;
}

export function renderMoves(moves, currentLearnMethod) {
    const tableMoves = document.getElementById('pokemon-moves');

    // Überprüfe, ob das Element gefunden wurde
    if (!tableMoves) {
        console.error('Element "pokemon-moves" nicht gefunden.');
        return; // Frühzeitiger Abbruch der Funktion, wenn das Element nicht existiert
    }

    // Sortieren der Bewegungen basierend auf dem Level
    moves.sort((a, b) => a.levelLearnedAt - b.levelLearnedAt);

    // Erstellen des HTML-Inhalts basierend auf den Bewegungen
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

    // Aktualisiere das innerHTML des gefundenen Elements
    tableMoves.innerHTML = movesHTML;
}


export function updateTableHeader(currentLearnMethod) {
    // Suche nach dem Element mit der ID 'pokemon-moves-header'
    const tableHeader = document.getElementById('pokemon-moves-header');
    console.log("Update Table Header aufgerufen, tableHeader gefunden:", tableHeader);

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