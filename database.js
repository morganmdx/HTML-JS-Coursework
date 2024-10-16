let db;

// Open or create an IndexedDB
function openDB() {
    let request = indexedDB.open('PatientsDB', 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        let objectStore = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Database opened successfully');
        fetchAndStorePatients();
    };

    request.onerror = function(event) {
        console.error('Database error:', event.target.errorCode);
    };
}

// Function to add a new patient via the form
function addPatient() {
    let nhs = document.getElementById('nhs').value;
    let title = document.getElementById('title').value;
    let first = document.getElementById('first').value;
    let last = document.getElementById('last').value;
    let dob = document.getElementById('dob').value;
    let gender = document.getElementById('gender').value;
    let address = document.getElementById('address').value;
    let email = document.getElementById('email').value;
    let telephone = document.getElementById('telephone').value;

    // Start a transaction to get the next available ID
    let transaction = db.transaction(['patients'], 'readwrite');
    let objectStore = transaction.objectStore('patients');

    // Get all patients and find the next available ID
    let request = objectStore.getAll();

    request.onsuccess = function(event) {
        let allPatients = event.target.result;
        let nextId = allPatients.length > 0 ? allPatients[allPatients.length - 1].id + 1 : 1;

        // Create a new patient object with all form data and auto-incremented id
        let newPatient = {
            id: nextId,  // Auto-assign the next available id
            NHS: nhs,
            Title: title,
            First: first,
            Last: last,
            DOB: dob,
            Gender: gender,
            Address: address,
            Email: email,
            Telephone: telephone
        };

        // Add the new patient to the object store
        objectStore.add(newPatient);

        transaction.oncomplete = function() {
            console.log('New patient added successfully');
            alert('Patient added successfully!');
        };

        transaction.onerror = function(event) {
            console.error('Error adding new patient:', event.target.error);
        };
    };

    // Reset the form after submission
    document.getElementById('patientForm').reset();
    return false; // Prevent default form submission
}


// Fetch JSON data from URL and store it in IndexedDB
function fetchAndStorePatients() {
    fetch('https://jsethi-mdx.github.io/cst2572.github.io/patients.json')
        .then(response => response.json())
        .then(data => {
            let batchSize = 20; // Handle data in chunks of 20 records at a time
            let totalBatches = Math.ceil(data.length / batchSize);
            for (let i = 0; i < totalBatches; i++) {
                let batch = data.slice(i * batchSize, (i + 1) * batchSize);
                let transaction = db.transaction(['patients'], 'readwrite');
                let objectStore = transaction.objectStore('patients');
                
                batch.forEach(patient => {
                    objectStore.add(patient);
                });

                transaction.oncomplete = function() {
                    console.log(`Batch ${i + 1} of ${totalBatches} added successfully.`);
                };

                transaction.onerror = function(event) {
                    console.error('Error adding batch:', event.target.error);
                };
            }
        })
        .catch(error => console.error('Fetch error:', error));
}


// Function to add a new patient via the form
// Function to add a new patient via the form
function addStudent() {
    let name = document.getElementById('name').value;
    let age = document.getElementById('age').value;
    let address = document.getElementById('address').value;

    let transaction = db.transaction(['patients'], 'readwrite');
    let objectStore = transaction.objectStore('patients');

    // Split name into First and Last (Assuming it's "First Last")
    let splitName = name.split(' ');
    let firstName = splitName[0];
    let lastName = splitName.length > 1 ? splitName[1] : ''; // Handle cases with no last name

    // Create a new patient object with basic details from the form
    let newPatient = {
        NHS: '', // Leave blank
        Title: '', // Leave blank
        First: firstName,
        Last: lastName,
        DOB: '', // Not available in form, leave blank
        Gender: '', // Leave blank
        Address: address,
        Email: '', // Not available, leave blank
        Telephone: '', // Not available, leave blank
    };

    // Add the new patient object to the database
    objectStore.add(newPatient);

    transaction.oncomplete = function() {
        console.log('New patient added successfully');
    };

    transaction.onerror = function(event) {
        console.error('Error adding new patient:', event.target.error);
    };

    // Reset form after submission
    document.getElementById('studentForm').reset();
    return false; // Prevent default form submission
}


// Initialize the database on page load
window.onload = function() {
    openDB();
};