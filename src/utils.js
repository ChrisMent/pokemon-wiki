// Hilfsfunktionen

// Ersten Buchstabe immer groß schreiben
export function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
// Hintergrundfarben heller machen
export function lightenColor(color, percent) {
    var num = parseInt(color.replace("#",""), 16),
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
      'Grass': '#48d0b0',
      'Fire': '#FB6C6C',
      'Water': '#77BEFE',
      'Bug': '#B2746C',
      'Normal': '#7D528D'
    };
    return colors[type] || '#d1d5d4';  // Standardfarbe ist Grau, falls der Typ nicht gefunden wird
  }

  // Dropdown-Menu Modal Pokemons

  export function toggleDropdown() {
    const dropdownMenu = document.getElementById('gameOptions');
    if (dropdownMenu.classList.contains('show')) {
        dropdownMenu.classList.remove('show');
    } else {
        // Überprüfen Sie den aktuellen Wert des ausgewählten Radiobuttons
        const selectedRadio = document.querySelector('input[name="gameOption"]:checked');
        const selectedOptionSpan = document.getElementById('selectedOption');
        selectedOptionSpan.textContent = selectedRadio.value;
        dropdownMenu.classList.add('show');
    }
}


  export function updateSelectedOption(radioInput) {
    const selectedOptionSpan = document.getElementById('selectedOption');
    selectedOptionSpan.textContent = radioInput.value;

    // Dropdown-Menü schließen
    const dropdownMenu = document.getElementById('gameOptions');
    dropdownMenu.classList.remove('show');
}

// Wandelt zahlen um #001. Fügt einer Zeichenkette hinzu, die benötigt werden, um eine bestimmte Länge zu erreichen. Hier 3 Stellen
export function formatNumber(number) {
  return String(number).padStart(3, '0');
}

