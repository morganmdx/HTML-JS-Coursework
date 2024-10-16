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
        populatePatientSelect(); // Call the function to populate the select dropdown
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

function loadPatientData() {
    const patientId = document.getElementById('patientSelect').value;
    const transaction = db.transaction(["patients"], "readonly");
    const store = transaction.objectStore("patients");
    const request = store.get(parseInt(patientId));

    request.onsuccess = function(event) {
        const patient = event.target.result;
        if (patient) {
            document.getElementById('first_name').value = patient.First;  // Updated property name
            document.getElementById('last_name').value = patient.Last;    // Updated property name
            document.getElementById('email').value = patient.Email;       // Correct property name
            document.getElementById('gender').value = patient.Gender;     // Correct property name
            document.getElementById('address').value = patient.Address;   // Correct property name
            document.getElementById('telephone').value = patient.Telephone; // Correct property name
        }
    };
}


// Function to populate the patient select dropdown
function populatePatientSelect() {
    const patientSelect = document.getElementById('patientSelect');
    const transaction = db.transaction(['patients'], 'readonly');
    const objectStore = transaction.objectStore('patients');

    const request = objectStore.getAll(); // Get all patients

    request.onsuccess = function(event) {
        const patients = event.target.result;
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id; // Use patient id as the value
            option.textContent = `${patient.First} ${patient.Last}`; // Display full name
            patientSelect.appendChild(option); // Add option to the select element
        });
    };

    request.onerror = function(event) {
        console.error('Error loading patients:', event.target.error);
    };
}

function editPatient() {
    const patientId = document.getElementById('patientSelect').value;
    const updatedPatient = {
        id: parseInt(patientId),
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        email: document.getElementById('email').value,
        gender: document.getElementById('gender').value,
        address: document.getElementById('address').value,
        telephone: document.getElementById('telephone').value
    };

    const transaction = db.transaction(["patients"], "readwrite");
    const store = transaction.objectStore("patients");
    const request = store.put(updatedPatient);

    request.onsuccess = function() {
        alert("Patient updated successfully!");
        location.reload(); // Reload the page to see the updated data
    };

    request.onerror = function() {
        alert("Error updating patient.");
    };
}


// Initialize the database on page load
window.onload = function() {
    openDB();
};