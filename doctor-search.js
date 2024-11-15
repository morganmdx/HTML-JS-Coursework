let db;

// DOMCONTENTLOADED: run the following code when the html page has been fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Open (or create) the database called 'DoctorsDB' version 4
    let request = window.indexedDB.open('DoctorsDB', 4);

    // error handling
    request.onerror = function(event) {
        console.error('Database failed to open', event);  // debugging
    };

    // db connection successful
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Database opened successfully');  // debugging

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
        if (!db.objectStoreNames.contains('doctors')) {  // if no object store exists called doctors
            let objectStore = db.createObjectStore('doctors', { keyPath: 'id', autoIncrement: true });  // create object store called doctors
            objectStore.createIndex('first_name', 'first_name', { unique: false });  // create index first_name within our doctors object store
            objectStore.createIndex('last_name', 'last_name', { unique: false });  // create index last_name within our doctors object store
            console.log('Database setup complete');  // debugging
        }
    };
});

// Function to get and populate the database
function populateDatabase() {
    fetch('https://jsethi-mdx.github.io/cst2572.github.io/doctors.json')  // link of our doctors JSON file
        .then(response => response.json())
        .then(data => {
            let transaction = db.transaction(['doctors'], 'readwrite');  // read write permissions needed
            let objectStore = transaction.objectStore('doctors');  // object store called doctors
            
            // for each doctor found add to object store within our doctors DB
            data.forEach(doctor => {
                objectStore.add(doctor);
            });

            // when successful add msg to console - good during the dev stage
            transaction.oncomplete = function() {
                console.log('Doctors successfully added to the database');
            };

            // error handling
            transaction.onerror = function(event) {
                console.error('Transaction failed', event);
            };
        })
        .catch(error => console.error('Error fetching doctors:', error));
}

// Function to search doctors based on first or last name
function searchDoctors() {
    let searchValue = document.getElementById('search').value.toLowerCase();  // convert user input based on the ID "search" field to lowercase using .toLowerCase() function
    let transaction = db.transaction(['doctors'], 'readonly');  // read permissions needed
    let objectStore = transaction.objectStore('doctors');  // object store called doctors
    let request = objectStore.getAll();  // get all records within object store

    request.onsuccess = function(event) {
        let doctors = event.target.result;
        // search filter for each doctor record that exists in DB using OR operator and converts the doctors' naming conventions to lowercase just for this search function
        let results = doctors.filter(doctor => 
            doctor.first_name.toLowerCase().includes(searchValue) || 
            doctor.last_name.toLowerCase().includes(searchValue)
        );

        displayResults(results);  // display data by storing as results parameter to return and display to user
    };

    request.onerror = function(event) {
        console.error('Error fetching doctors:', event.target.errorCode);
    };

    return false; // Prevent form default behaviour when submitting
}

// Function to display search results
function displayResults(results) {
    let resultsDiv = document.getElementById('results');  // get element on page with the ID of results
    resultsDiv.innerHTML = ''; // Clear previous results

    if (results.length > 0) {  // if there is more than one result in search results array
        let html = '<h2>Search Results:</h2>';  // display word search results inside a h2 heading tag
        html += '<ul>';  // create unordered list

        // for each doctor in the search results array then return the following based on OOP
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

        html += '</ul>';  // closing unordered list tag
        resultsDiv.innerHTML = html;  // output above OOP content for each doctor found in search via search query by using the innerHTML content of the desired element on the page with ID of 'results'
    } else {
        resultsDiv.innerHTML = '<p>No doctors found.</p>';  // if no search results found display this paragraph to user
    }
}
