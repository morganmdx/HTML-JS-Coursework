document.addEventListener('DOMContentLoaded', () => {
    // Open IndexedDB and create an object store for medicines
    let db;
    const request = indexedDB.open('MedicinesDB', 1);  // open/make connection to MedicinesDB

    request.onupgradeneeded = function (event) {
        db = event.target.result;
        // Create the object store if it doesn't exist
        if (!db.objectStoreNames.contains('medicines')) {
            db.createObjectStore('medicines', { keyPath: 'id' });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log('IndexedDB initialized.');
        fetchAndStoreMedicines(); // Fetch and store medicines in IndexedDB
    };


    // error handling
    request.onerror = function (event) {
        console.error('Error opening IndexedDB:', event.target.error);
    };

    // Get medicines data from the JSON URL and store it in my DB
    function fetchAndStoreMedicines() {
        fetch('https://jsethi-mdx.github.io/cst2572.github.io/medicines.json')
            .then(response => response.json())
            .then(data => {
                let batchSize = 20; // Process data in smaller parts
                let totalBatches = Math.ceil(data.length / batchSize);

                for (let i = 0; i < totalBatches; i++) {
                    let batch = data.slice(i * batchSize, (i + 1) * batchSize);
                    let transaction = db.transaction(['medicines'], 'readwrite');
                    let objectStore = transaction.objectStore('medicines');

                    batch.forEach(medicine => {
                        // Extract only id and Drug attributes
                        const record = { id: medicine.id, Drug: medicine.Drug };

                        // Check if the medicine already exists by its id
                        let checkRequest = objectStore.get(record.id);

                        checkRequest.onsuccess = function (event) {
                            if (!event.target.result) {
                                // If the medicine does not exist, add it to the object store
                                objectStore.add(record);
                            } else {
                                console.log(`Medicine with id ${record.id} already exists.`);
                            }
                        };

                        checkRequest.onerror = function (event) {
                            console.error('Error checking medicine:', event.target.error);
                        };
                    });

                    transaction.oncomplete = function () {
                        console.log(`Batch ${i + 1} of ${totalBatches} processed successfully.`);
                        loadMedicines(); // Call loadMedicines after processing each batch
                        countMedicines(); // Count medicines after processing each batch
                    };

                    transaction.onerror = function (event) {
                        console.error('Error processing batch:', event.target.error);
                    };
                }
            })
            .catch(error => console.error('Fetch error:', error));
    }

    // Function to load medicines from IndexedDB and display them in the table
    function loadMedicines() {
        const transaction = db.transaction(['medicines'], 'readonly');
        const objectStore = transaction.objectStore('medicines');
        const request = objectStore.getAll();

        request.onsuccess = function (event) {
            const medicines = event.target.result;
            const tableBody = document.querySelector('#medicines-list tbody');
            if (tableBody) {
                tableBody.innerHTML = ''; // Clear existing rows

            if (medicines.length > 0) {
                medicines.forEach((medicine) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${medicine.id}</td><td>${medicine.Drug}</td>`;
                    tableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="2">No medicines available.</td>`;
                tableBody.appendChild(row);
            }
            }
        };

        request.onerror = function (event) {
            console.error('Error fetching medicines:', event.target.error);
        };
    }

    // Function to count medicines in IndexedDB and display the count in an element
    function countMedicines() {
        const transaction = db.transaction(['medicines'], 'readonly');
        const objectStore = transaction.objectStore('medicines');
        const countRequest = objectStore.count();

        countRequest.onsuccess = function (event) {
            const count = event.target.result;
            console.log(`Total medicines: ${count}`);
            const countElement = document.getElementById('totalMedicinesCount');
            if (countElement) {
                countElement.textContent = `${count}`;  // output count
            }
        };

        countRequest.onerror = function (event) {
            console.error('Error counting medicines:', event.target.error);
        };
    }
});
