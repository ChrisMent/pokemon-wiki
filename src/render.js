import { lightenColor, getBackgroundColor } from './utils.js';
import { capitalizeFirstLetter} from './utils.js';

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
            <h3 class="pokemon-name"><a class="pokemon-link" href="${pokemonData.name}">${capitalizeFirstLetter(pokemonData.name)}</a></h3>
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
    const baseHTML = `
<div class="container text-center">
    <div class="row gx-5 p-0">
        <div class="col">
            <div class="evolution-pokemon">
                <div class="evolution-row">
                    <div class="evolution-col-img">
                        <div class="evolution-img-container">
                            <img class="poke-thumbnail" src="{{pokemonImage1}}" alt="Pokemon Thumbnail">
                            <!-- SVG content -->
                        </div>
                        <p><strong>{{pokemonName1}}</strong></p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col d-flex align-items-center justify-content-center flex-column">
            <img src="/pokemon-wiki/img/arrow-right.svg" alt="evolution-arrow-right">
            <div><strong>Lvl {{level}}</strong></div>
        </div>
        <div class="col">
            <div class="evolution-pokemon">
                <div class="evolution-row">
                    <div class="evolution-col-img">
                        <div class="evolution-img-container">
                            <img class="poke-thumbnail" src="{{pokemonImage2}}" alt="Pokemon Thumbnail">
                            <!-- SVG content -->
                        </div>
                        <p><strong>{{pokemonName2}}</strong></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <hr>
</div>
    `;

    let htmlOutput = "";
    for (let i = 0; i < evolutionChain.length - 1; i++) {
        const currentPokemon = evolutionChain[i];
        const nextPokemon = evolutionChain[i + 1];
        const level = nextPokemon && nextPokemon.evolution_details && nextPokemon.evolution_details.length > 0 ? nextPokemon.evolution_details[0].min_level : null;
        const speciesUrl = currentPokemon && currentPokemon.species ? currentPokemon.species.url : null;
        const nextSpeciesUrl = nextPokemon && nextPokemon.species ? nextPokemon.species.url : null;
    const nextSpeciesName = nextPokemon && nextPokemon.species ? nextPokemon.species.name : null;

    if (speciesUrl && nextSpeciesUrl && level) {
        htmlOutput += baseHTML
            .replace("{{pokemonImage1}}", speciesUrl.replace("pokemon-species", "media/sprites/pokemon"))
            .replace("{{pokemonImage2}}", nextSpeciesUrl.replace("pokemon-species", "media/sprites/pokemon"))
            .replace("{{pokemonName1}}", currentPokemon.species.name)
            .replace("{{pokemonName2}}", nextSpeciesName)
            .replace("{{level}}", level);
    }

    }

    return htmlOutput;
}
