import { capitalizeFirstLetter} from './utils.js';
export async function loadAllPokemon() {
    let url = 'https://pokeapi.co/api/v2/pokemon/';
    
    // Aufbereitete Daten aus Fetch - Funktionen im Array gespeichert
    let allPokemonData = []; 


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
  
            // Erstellung eine Objektes mit 3 Variabeln
            const pokemonData = {
                name: name,
                types: types,
                image: image
            };
            
            // Speichern der Daten in einem Array
            allPokemonData.push(pokemonData);
        }
  
        return allPokemonData;
  
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
    }
  }