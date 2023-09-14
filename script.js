async function loadAllPokemon() {
  let url = 'https://pokeapi.co/api/v2/pokemon/';
  let allPokemonData = []; // Aufbereitete Daten aus Fetch - Funktionen im Array gespeichert
  // console.log("All Pokemon Data:", allPokemonData);
    try {
      let response = await fetch(url);

      if (!response.ok) { // Wenn der Response fehlschlägt, dann gebe die Fehlermeldung aus
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      let jsonResponse = await response.json(); // Umwandeln des Resonses in das JSON Format
      let results = jsonResponse.results;

      for (let result of results) {
          const pokemonUrl = result.url;  // URL für die Detailinformationen des Pokémons
          const pokemonResponse = await fetch(pokemonUrl);  // Zweite Fetch-Anfrage für Details

          if (!pokemonResponse.ok) {
              throw new Error(`HTTP error! status: ${pokemonResponse.status}`);
          }

          const pokemonJson = await pokemonResponse.json();  // Antwort als JSON
          const name = capitalizeFirstLetter(pokemonJson.name);
          const types = pokemonJson.types.map(typeObj => capitalizeFirstLetter(typeObj.type.name));
          const image = pokemonJson.sprites.other.home.front_default;

          const pokemonData = {
              name: name,
              types: types,
              image: image
          };

          allPokemonData.push(pokemonData);
      }

      return allPokemonData;

  } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
  }
}

function renderOverview(pokemonData) {
  // Erstellen eines neuen Containers für das Pokémon
  const pokemonContainer = document.createElement("div");
  pokemonContainer.className = "col-6";

  // Setzen der Hintergrundfarbe basierend auf dem ersten Typ des Pokémons
  const bgColor = getBackgroundColor(pokemonData.types[0]);


  // Erstellen des HTML-Inhalts für das Pokémon
  const pokemonHTML = `
      <div class="overview-card p-3 border rounded-4" style="background-color: ${bgColor}">
          <img class="overview-background" src="/pokemon-wiki/img/poke_ball_icon.svg" alt="Pokeball Icon">
          <h3 class="pokemon-name">${pokemonData.name}</h3>
          <div class="overview-columns">
              <div class="overview-badges">
                  <span class="overview-badge badge rounded-pill" style="background-color:${lightenColor(bgColor, 10)} ">${pokemonData.types[0]}</span>
                  ${pokemonData.types[1] ? `<span class="overview-badge badge rounded-pill" style="background-color: ${lightenColor(bgColor, 10)}">${pokemonData.types[1]}</span>` : ''}
              </div>
              <img class="overview-img" src="${pokemonData.image}" alt="Pokemon Monster">
          </div>
      </div>
  `;

  // Fügen des HTML-Inhalts zum Container hinzu
  pokemonContainer.innerHTML = pokemonHTML;

  // Hinzufügen des Containers zur Haupt-Row (angenommen, es gibt eine div mit der Klasse "row" im HTML)
  const mainRow = document.querySelector(".row");
  if (mainRow) {
      mainRow.appendChild(pokemonContainer);
  }
}


function renderAllPokemon(allPokemonData) {
  for (let pokemonData of allPokemonData) {
      renderOverview(pokemonData);
  }
}

async function main() {
  try {
      const allPokemonData = await loadAllPokemon();  // Daten für alle Pokémon laden
      renderAllPokemon(allPokemonData);  // Alle Pokémon im HTML darstellen
  } catch (error) {
      console.error("Fehler beim Laden oder Rendern der Pokemon:", error);
  }
}

// Hilfsfunktionen

// Ersten Buchstabe immer groß schreiben
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Hintergrundfarben heller machen
function lightenColor(color, percent) {
  var num = parseInt(color.replace("#",""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Funktion als Objekt verwenden, die die Hintergrundfarbe für einen bestimmten Pokemontyp zurückgibt
function getBackgroundColor(type) {
  const colors = {
    'Grass': '#48d0b0',
    'Fire': '#FB6C6C',
    'Water': '#77BEFE',
    'Bug': '#B2746C',
    'Normal': '#7D528D'
  };
  return colors[type] || '#d1d5d4';  // Standardfarbe ist Weiß, falls der Typ nicht gefunden wird
}


// Init Funktion um verschiedene Funktionen aufzurufen
document.addEventListener("DOMContentLoaded", function() {
  main();  // Hauptfunktion aufrufen
});