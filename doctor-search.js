let db;

document.addEventListener('DOMContentLoaded', () => {
    // Open (or create) the database
    let request = window.indexedDB.open('doctorsDB', 1);

    request.onerror = function(event) {
        console.error('Database failed to open', event);
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Database opened successfully');

        // Check if the doctors object store already has entries
        let transaction = db.transaction(['doctors'], 'readonly');
        let objectStore = transaction.objectStore('doctors');
        let countRequest = objectStore.count();
        
        countRequest.onsuccess = function() {
            if (countRequest.result === 0) {
                // Only populate if the database is empty
                populateDatabase();
            } else {
                console.log('Database already populated');
            }
        };
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;

        // Create the object store for doctors with auto-incrementing IDs
        if (!db.objectStoreNames.contains('doctors')) {
            let objectStore = db.createObjectStore('doctors', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex('first_name', 'first_name', { unique: false });
            objectStore.createIndex('last_name', 'last_name', { unique: false });
            console.log('Database setup complete');
        }
    };
});

// Function to fetch and populate the database
function populateDatabase() {
    fetch('https://jsethi-mdx.github.io/cst2572.github.io/doctors.json')
        .then(response => response.json())
        .then(data => {
            let transaction = db.transaction(['doctors'], 'readwrite');
            let objectStore = transaction.objectStore('doctors');
            
            data.forEach(doctor => {
                objectStore.add(doctor);
            });

            transaction.oncomplete = function() {
                console.log('Doctors successfully added to the database');
            };

            transaction.onerror = function(event) {
                console.error('Transaction failed', event);
            };
        })
        .catch(error => console.error('Error fetching doctors:', error));
}

// Function to search doctors based on first or last name
function searchDoctors() {
    let searchValue = document.getElementById('search').value.toLowerCase();
    let transaction = db.transaction(['doctors'], 'readonly');
    let objectStore = transaction.objectStore('doctors');
    let request = objectStore.getAll();

    request.onsuccess = function(event) {
        let doctors = event.target.result;
        let results = doctors.filter(doctor => 
            doctor.first_name.toLowerCase().includes(searchValue) || 
            doctor.last_name.toLowerCase().includes(searchValue)
        );

        displayResults(results);
    };

    request.onerror = function(event) {
        console.error('Error fetching doctors:', event.target.errorCode);
    };

    return false; // Prevent form from submitting
}

// Function to display search results
function displayResults(results) {
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Clear previous results

    if (results.length > 0) {
        let html = '<h2>Search Results:</h2>';
        html += '<ul>';

        results.forEach(doctor => {
            html += `<li>
                <strong>ID:</strong> ${doctor.id} <br/>
                <strong>First Name:</strong> ${doctor.first_name} <br/>
                <strong>Last Name:</strong> ${doctor.last_name} <br/>
                <strong>Email:</strong> ${doctor.email} <br/>
                <strong>Gender:</strong> ${doctor.gender} <br/>
                <strong>Address:</strong> ${doctor.Address} <br/>
                <strong>Telephone:</strong> ${doctor.Telephone} <br/><br/>
            </li>`;
        });

        html += '</ul>';
        resultsDiv.innerHTML = html;
    } else {
        resultsDiv.innerHTML = '<p>No doctors found.</p>';
    }
}
