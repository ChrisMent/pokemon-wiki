// Hilfsfunktionen

// Ersten Buchstabe immer groß schreiben
export function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeEachWord(str) {
  return str.split('-').map(capitalizeFirstLetter).join('-');
}

// Hintergrundfarben heller machen
export function lightenColor(color, percent) {
  var num = parseInt(color.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Definition der Hintergrundfarben.
// Funktion als Objekt verwenden, die die Hintergrundfarbe für einen bestimmten Pokemontyp zurückgibt
export function getBackgroundColor(type) {
  const colors = {
      'grass': '#48d0b0',
      'fire': '#FB6C6C',
      'water': '#77BEFE',
      'bug': '#B2746C',
      'normal': '#7D528D',
      'poison': '#BE508F',
      'electric': '#383838',
      'ground': '#7E571E',
      'fairy': '#2F4D6F',
      'fighting': '#DD955A',
      'psychic': '#779758',
      'rock': '#A4A8B4',
      'ghost': '#3D657E',
      'ice': '#C3DFF5',
      'dragon': '#D7BC91',
      'dark': '#554F51',
      'steel': '#8C9193',
  };
  return colors[type] || '#d1d5d4'; // Standardfarbe ist Grau, falls der Typ nicht gefunden wird
}

// Wandelt zahlen um #001. Fügt einer Zeichenkette hinzu, die benötigt werden, um eine bestimmte Länge zu erreichen. Hier 3 Stellen
export function formatNumber(number) {
  return String(number).padStart(3, '0');
}

// Funktion, um den Ladeindikator anzuzeigen
export function showLoadingIndicator() {
  const loadingIndicator = document.querySelector('.spinner-border');
  loadingIndicator.style.display = 'block';
}

// Funktion, um den Ladeindikator zu verstecken
export function hideLoadingIndicator() {
  const loadingIndicator = document.querySelector('.spinner-border');
  loadingIndicator.style.display = 'none';
}

export function getCurrentRenderedPokemonCount() {
  return renderedPokemonCount;
}

// Korrigieren der URL
export function correctSpriteUrl(url) {
  if (!url) {
      // Hier Standard-URL zurückgeben oder einfach `null` beibehalten,
      // abhängig davon, wie  mit fehlenden Bildern umgegangen werden soll.
      return null;
  }

  const prefix = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/';
  if (url.startsWith(prefix)) {
      // Ersetze das Präfix nur, wenn es mehr als einmal vorkommt.
      const correctedUrl = url.replace(new RegExp(`(${prefix})+`), prefix);
      return correctedUrl;
  }
  return url;
}

//! Evolution -Hilfsfunktionen

// Hilfsfunktion, um die rekursive Evolutionskette in ein flaches Array zu konvertieren. Hier findet eine Umwandlung aus einem Objekt das tief verschachtelt ist in mehrere Objekt statt, welche immer nur die nachfolgenden Evolutionstufen hat
export function flattenEvolutionChain(chain) {
  // Initialisiert ein leeres Array, das das Ergebnis der "Abflachung" aufnehmen wird.
  const result = [];
  // Weist die ursprüngliche Evolutionskette einer Hilfsvariable 'current' zu. 
  // Diese Variable wird genutzt, um durch die Kette zu iterieren.
  let current = chain;
  // Eine while-Schleife wird genutzt, um durch die Kette zu iterieren, solange 'current' ein gültiges Objekt ist.
  while (current) {
      // Fügt das aktuelle Objekt (repräsentiert die aktuelle Evolutionsstufe) zum 'result'-Array hinzu.
      result.push(current);
      // Aktualisiert 'current', um auf die nächste Stufe der Evolution zu verweisen. 
      // Wenn 'current.next_evolution' null oder undefiniert ist, endet die Schleife.
      current = current.next_evolution;
  }
  // Nachdem die gesamte Kette durchlaufen wurde, gibt die Funktion das 'result'-Array zurück. 
  // Dieses Array enthält nun alle Stufen der Evolution in einer flachen Struktur.
  return result;
}

// Rekursive Hilfsfunktion, um die Evolutionskette zu extrahieren und ein Array zu bauen
export function extractEvolutionChain(chain) {
  const pokemonName = chain.species.name; // Name des Pokemons aus der Chain
  const pokemonSpeciesUrl = chain.species.url; // Die Url des Species Typs
  
  // Teilt die URL an jedem "/" und entfernt leere Strings, nimmt dann das letzte Element (die ID) aus dem Array
  const pokemonId = pokemonSpeciesUrl.split("/").filter(Boolean).pop(); 
  
  // Initialisiert die Variable für das minimale Level, auf dem die Evolution stattfindet
  let min_level = null;
  // Überprüft, ob Evolutionsdetails vorhanden sind und weist min_level zu, falls verfügbar
  if (chain.evolution_details.length > 0) {
      // Extrahieren des min_level aus den Evolutionsdetails, falls vorhanden
      min_level = chain.evolution_details[0].min_level;
  }

  // Erstellt ein Ergebnisobjekt mit den extrahierten Daten
  const result = {
      id: parseInt(pokemonId),
      name: pokemonName,
      thumbnail: null, // Dies wird später aktualisiert
      min_level: min_level
  };

  // Überprüft, ob es eine weitere Evolution in der Kette gibt
  if (chain.evolves_to.length > 0) {
      // Rekursiver Aufruf der Funktion für die nächste Stufe der Evolution. Das wird solange gemacht bis alle Evolutionsstufen abgeschlossen sind. Das Prizip beruft dem Rekursionskonzept bei dem eine Funktion sich selbst aufruft.
      result.next_evolution = extractEvolutionChain(chain.evolves_to[0]);
  }

  return result;
}

// Diese Funktion aktualisiert die Thumbnails rekursiv für jedes Element der Evolutionskette.
export async function updateEvolutionThumbnails(evolutionChain) { 
  // Übergabe der gesamten Daten aus dem evolutionChain 
  if (evolutionChain) {
      // Prüfen, ob eine gültige ID vorhanden ist
      if (evolutionChain.id) {
          try {
              // Holen der Bilder für die jeweilige Evolutionstufe
              evolutionChain.thumbnail = await getPokemonThumbnail(evolutionChain.id);
          } catch (error) {
              console.error("Fehler beim Laden des Thumbnails für", evolutionChain.name, ":", error);
              evolutionChain.thumbnail = null; // Setze ein Standard-Thumbnail oder belasse es bei null
          }
      }

      // Rekursiver Aufruf für die nächste Evolution
      if (evolutionChain.next_evolution) {
          await updateEvolutionThumbnails(evolutionChain.next_evolution);
      }
  }
}

// Funktion, um die Pokemon-Thumbnail-URL zu erhalten
export async function getPokemonThumbnail(pokemonId) {
  if (typeof pokemonId === 'undefined') {
      console.error('Keine gültige Pokemon-ID übergeben');
      return null; // oder URL eines Standard-Thumbnails
  }
  // Erneutes Abrufen der Pokemon Detail Daten
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
  if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Erneuter Aufruf der Detail-Data ID, zur Sicherstellung dass die URL immer der tatsächlichen ID des Pokémon entspricht
  const data = await response.json();
  // Generierung des Bildes anhand der ID des Pokemons
  let thumbnailUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`;

  // Korrigiert die URL falls nötig
  return correctSpriteUrl(thumbnailUrl);
}