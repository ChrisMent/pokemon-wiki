import { lightenColor, getBackgroundColor } from './utils.js';
import { capitalizeFirstLetter} from './utils.js';
import { initModal } from './modal.js';
import { getAllPokemonMoves } from './api.js';


// Die Funktion renderAllPokemon() ist als Hilfsfunktion gedacht, die die renderOverview() - Funktion für jedes Pokémon-Objekt in dem Array = allPokemonData (api.js) aufruft. 

// --> Für jedes dieser Objekte wird die renderOverview-Funktion aufgerufen
// --> Parameter allPokemonData ist das Array aus api.js

export function renderAllPokemon(allPokemonData) {
    
    const pokemonContainer = document.getElementById("pokemon-container");
    pokemonContainer.innerHTML = '';  // Leert den Container

    // for...of Schleife, es wird über jedes Element im Array allPokemonData iteriert und die Werte in pokemonData gespeichert. Das wird solange gemacht bis das letzte Element erreicht wurde.
    for (let pokemonData of allPokemonData) {
    // Aufrufen der Funktion renderOverview() mit den Daten aus dem der For Schleife
        renderOverview(pokemonData);
    }
}

// Diese Funktion ist für ein einzelnes Pokémon-Objekt gedacht
export function renderOverview(pokemonData) {
    const pokemonContainer = document.getElementById("pokemon-container");
   
   // Setzen der Hintergrundfarbe je nach dem ersten Pokemon-Typ
    const bgColor = getBackgroundColor(pokemonData.types[0]);

    // Fügen des HTML-Inhalts zum Container hinzu
    pokemonContainer.innerHTML += `
    <div class="col-6">
        <div class="overview-card p-3 border rounded-4" style="background-color: ${bgColor}">
            <img class="overview-background" src="/pokemon-wiki/img/poke_ball_icon.svg" alt="Pokeball Icon">
            <h3 class="pokemon-name"><a id="open-modal"class="pokemon-link" href="${pokemonData.name}">${capitalizeFirstLetter(pokemonData.name)}</a></h3>
            <div class="overview-columns">
                <div class="overview-badges">
                    <span class="overview-badge badge rounded-pill" style="background-color:${lightenColor(bgColor, 10)}">${pokemonData.types[0]}</span>
                    ${pokemonData.types[1] ? `<span class="overview-badge badge rounded-pill" style="background-color: ${lightenColor(bgColor, 10)}">${pokemonData.types[1]}</span>` : ''}
                </div>
                <div class="overview-img-container">
                    <img class="overview-img" src="${pokemonData.image}" alt="Pokemon Monster">
                </div>
            </div>
        </div>
    </div>
    `;
}

export function generateEvolutionHTML(evolutionChain) {
    let htmlContent = '';  // Initialisieren Sie die Variablen
    for (let i = 0; i < evolutionChain.length - 1; i++) {

        
        const currentPokemon = evolutionChain[i];
        const nextPokemon = evolutionChain[i + 1];

        const segment = `
        <div class="container text-center">
            <div class="row gx-5 p-0">
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
                    <div><strong>Lvl ${nextPokemon.min_level}</strong></div>
                </div>
                <div class="col">
                    <div class="evolution-pokemon">
                        <div class="evolution-row">
                            <div class="evolution-col-img">
                                <div class="evolution-img-container">
                                    <img class="poke-thumbnail" src="${nextPokemon.thumbnail}" alt="${nextPokemon.name} Thumbnail">
                                </div>
                                <p><strong>${capitalizeFirstLetter(nextPokemon.name)}</strong></p>
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


export function displayMovesForGame(selectedGame, allPokemonMoves) {
    console.log(allPokemonMoves);

    // Filtern Sie die Bewegungen basierend auf dem ausgewählten Spiel
    console.log(selectedGame);

    // Standardwert setzen
    selectedGame = selectedGame || 'sun-moon';

    const movesForSelectedGame = allPokemonMoves.filter(move => {
        return move.moveVersionGroup && move.moveVersionGroup.includes(selectedGame);
    });
    // Generieren Sie das HTML für die Bewegungen
    const movesHTML = movesForSelectedGame.map(move => {
        return `
            <tr>
                <th class="align-middle text-center" scope="row">${move.levelLearnedAt}</th>
                <td class="align-middle text-center">${move.moveName}</td>
                <td class="align-middle text-center">${move.movePower}</td>
                <td class="align-middle text-center">${move.moveType}</td>
                <td class="align-middle text-center">${move.moveDamageClass}</td>
            </tr>
        `;
    }).join('');

    // Fügen Sie das generierte HTML in die Tabelle ein
    document.querySelector('.table tbody').innerHTML = movesHTML;
}
const moves = getAllPokemonMoves();
console.log(moves[0]);
