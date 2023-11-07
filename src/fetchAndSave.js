// fetchAndSave.js
import fetch from 'node-fetch';
import fs from 'fs';
import { fetchPokemonsBaseData, fetchPokemonsDetails, fetchPokemonsSpecies, fetchPokemonsMovesDetails } from './api.js'; 

const fetch = require('node-fetch');
const fs = require('fs');

// Funktion zum Speichern der Daten in einer Datei
function saveDataToFile(data, filename) {
    fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Fehler beim Speichern der Datei:', err);
        } else {
            console.log(`${filename} wurde erfolgreich gespeichert.`);
        }
    });
}

async function runDataFetchAndSave() {
    try {
        const baseData = await fetchPokemonsBaseData();
        const detailsData = await fetchPokemonsDetails();
        const speciesData = await fetchPokemonsSpecies();
        const movesDetailsData = await fetchPokemonsMovesDetails();
        
        // Kombiniere alle Daten in einem Array oder Objekt, je nachdem wie deine Funktionen strukturiert sind
        const allData = { baseData, detailsData, speciesData, movesDetailsData };

        saveDataToFile(allData, 'pokemon_data.json');
    } catch (error) {
        console.error('Fehler beim Abrufen der Daten:', error);
    }
}
  
  runDataFetchAndSave();
