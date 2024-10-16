// Existing IndexedDB code
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

        // Load doctors into the select dropdown
        loadDoctors();
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

// Function to add a new doctor
function addDoctor() {
    // Ensure db is open before adding
    if (!db) {
        console.error('Database is not initialized');
        return;
    }

    const doctorData = {
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        email: document.getElementById('email').value,
        gender: document.getElementById('gender').value,
        Address: document.getElementById('address').value,
        Telephone: document.getElementById('telephone').value
    };

    // Add the new doctor data to the IndexedDB
    const transaction = db.transaction(['doctors'], 'readwrite');
    const objectStore = transaction.objectStore('doctors');
    const request = objectStore.add(doctorData);

    request.onsuccess = function() {
        console.log("New Doctor Data added to DB:", doctorData);
        alert("Doctor added successfully!");
    };

    request.onerror = function(event) {
        console.error("Error adding doctor:", event.target.error);
        alert("Failed to add doctor. Please check the console for details.");
    };

    // Reset the form after submission
    document.getElementById('doctorForm').reset();
    return false; // Prevent the form from submitting the traditional way
}

// Load doctors into the select dropdown
function loadDoctors() {
    // Check if db is defined
    if (!db) {
        console.error("Database is not initialized.");
        return;
    }

    let transaction = db.transaction(['doctors'], 'readonly');
    let objectStore = transaction.objectStore('doctors');
    let request = objectStore.getAll();

    request.onsuccess = function(event) {
        const doctors = event.target.result;
        const doctorSelect = document.getElementById('doctorSelect');

        // Clear existing options
        doctorSelect.innerHTML = '';

        if (doctors.length > 0) {
            doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `${doctor.first_name} ${doctor.last_name}`;
                doctorSelect.appendChild(option);
            });
        } else {
            console.log("No doctors found in IndexedDB.");
        }
    };

    request.onerror = function(event) {
        console.error("Error retrieving doctors:", event.target.error);
    };
}

// Load the selected doctor's data into the form
function loadDoctorData() {
    const doctorId = document.getElementById('doctorSelect').value;
    if (doctorId) {
        const transaction = db.transaction(['doctors'], 'readonly');
        const objectStore = transaction.objectStore('doctors');
        const request = objectStore.get(parseInt(doctorId));

        request.onsuccess = function(event) {
            const doctor = event.target.result;
            if (doctor) {
                document.getElementById('first_name').value = doctor.first_name;
                document.getElementById('last_name').value = doctor.last_name;
                document.getElementById('email').value = doctor.email;
                document.getElementById('gender').value = doctor.gender;
                document.getElementById('address').value = doctor.Address;
                document.getElementById('telephone').value = doctor.Telephone;
            }
        };
    }
}

// Edit doctor function
function editDoctor() {
    const doctorId = document.getElementById('doctorSelect').value;

    const updatedData = {
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        email: document.getElementById('email').value,
        gender: document.getElementById('gender').value,
        Address: document.getElementById('address').value,
        Telephone: document.getElementById('telephone').value
    };

    // Update the doctor data in IndexedDB
    const transaction = db.transaction(['doctors'], 'readwrite');
    const objectStore = transaction.objectStore('doctors');
    const request = objectStore.put({ id: parseInt(doctorId), ...updatedData });

    request.onsuccess = function() {
        alert("Doctor updated successfully!");
    };

    request.onerror = function(event) {
        console.error("Error updating doctor:", event.target.error);
        alert("Failed to update doctor. Please check the console for details.");
    };

    return false; // Prevent the form from submitting the traditional way
}

// Load doctors when the page is loaded
document.addEventListener('DOMContentLoaded', loadDoctors);