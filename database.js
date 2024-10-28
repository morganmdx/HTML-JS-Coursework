let db;

// Open or create an IndexedDB with the name PatientsDB
function openDB() {
    let request = indexedDB.open('PatientsDB', 1); 

    request.onupgradeneeded = function(event) {
        db = event.target.result;

        // Create patients object store if it doesn't exist
        if (!db.objectStoreNames.contains('patients')) {
            let objectStore = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
        }

        // Create userLogins object store for patient login details
        if (!db.objectStoreNames.contains('userLogins')) {
            let loginStore = db.createObjectStore('userLogins', { keyPath: 'id' }); 
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Database opened successfully'); // if db successfully executes and opens then prints this to console log
        fetchAndStorePatients();  // call and run function
        populatePatientSelect();  // call and run function to populate data in select dropdown
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
            id: nextId,  // assign the next available id
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


// Fetch patients data from the JSON URL and store it in IndexedDB
function fetchAndStorePatients() {  
    fetch('https://jsethi-mdx.github.io/cst2572.github.io/patients.json')
        .then(response => response.json())
        .then(data => {
            let batchSize = 20; // Handle data in small parts
            let totalBatches = Math.ceil(data.length / batchSize);

            for (let i = 0; i < totalBatches; i++) {
                let batch = data.slice(i * batchSize, (i + 1) * batchSize);
                let transaction = db.transaction(['patients'], 'readwrite');
                let objectStore = transaction.objectStore('patients');

                batch.forEach(patient => {
                    // Check if the patient already exists by using their 'id'
                    let checkRequest = objectStore.get(patient.id);

                    checkRequest.onsuccess = function(event) {
                        if (!event.target.result) {
                            // If patient does not exist, add it to the object store
                            objectStore.add(patient);
                        } else {
                            console.log(`Patient with id ${patient.id} already exists.`);
                        }
                    };

                    checkRequest.onerror = function(event) {
                        console.error('Error checking patient:', event.target.error);
                    };
                });

                transaction.oncomplete = function() {
                    console.log(`Batch ${i + 1} of ${totalBatches} processed successfully.`);
                };

                transaction.onerror = function(event) {
                    console.error('Error processing batch:', event.target.error);
                };
            }
        })
        .catch(error => console.error('Fetch error:', error));
}



// Create function to add a new patient via the form
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
        console.log('New patient added successfully');  // print to console the following success message on completion
    };

    transaction.onerror = function(event) {
        console.error('Error adding new patient:', event.target.error);  // print to console the following error msg
    };

    // Reset form after submission
    document.getElementById('studentForm').reset();
    return false; // Prevent default form submission
}

function loadPatientData() {
    const patientId = document.getElementById('patientSelect').value;
    const transaction = db.transaction(["patients"], "readonly");
    const store = transaction.objectStore("patients");
    const request = store.get(parseInt(patientId));  // change patient ID into integer

    request.onsuccess = function(event) {
        const patient = event.target.result;
        if (patient) {
            document.getElementById('first_name').value = patient.First;  // Update value of first name element with value of patient first name
            document.getElementById('last_name').value = patient.Last;    // Update value of surname element with value of patient last name
            document.getElementById('email').value = patient.Email;       // Update value of email element with value of patient email address
            document.getElementById('gender').value = patient.Gender;     // Update value of gender form element with value of patient gender
            document.getElementById('address').value = patient.Address;   // Update value of address element with value of address field
            document.getElementById('telephone').value = patient.Telephone; // Update value of telephone element with value of patient phone number
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

function createPatientLoginDetails() {
    // Get the selected patient ID, username, and password from the form
    let patientId = document.getElementById('patientSelect').value; 
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    // Begin a transaction on both the patients and userLogins object stores
    let transaction = db.transaction(['patients', 'userLogins'], 'readwrite');
    let patientStore = transaction.objectStore('patients');
    let loginStore = transaction.objectStore('userLogins');

    // Retrieve the patient based on the selected ID
    let request = patientStore.get(parseInt(patientId));

    request.onsuccess = function(event) {
        let patient = event.target.result;
        if (patient) {
            // If the patient exists, create a login record
            // The following are key value pairs and is OOP
            let loginDetails = {
                id: patient.id,  // Reuse the patient's ID as the key
                username: username,
                password: password,
                NHS: patient.nhs  // link NHS number with patient account
            };

            // Attempt to add the login details to the userLogins store
            let loginRequest = loginStore.add(loginDetails);

            loginRequest.onsuccess = function() {
                alert("Account details created successfully for patient! The NHS number has been successfully linked to the user account.");
            };

            loginRequest.onerror = function(event) {
                console.error("Error creating user login details: ", event.target.error);
                alert("Error creating user login details.");
            };

        } else {
            alert("Selected patient does not exist.");
        }
    };

    request.onerror = function(event) {
        console.error("Error fetching patient: ", event.target.error);
    };

    // Reset the form after submission
    document.getElementById("patientLoginForm").reset(); 
    return false;  // Prevent default form submission
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
        alert("Patient updated successfully!");  // using alert() function to display notification popup with prompt user must dismiss
        location.reload(); // Reload the page to see the updated data
    };

    request.onerror = function() {
        alert("Error updating patient.");
    };
}

// Delete patient from DB
function deletePatient() {
    const patientId = document.getElementById('patientSelect').value;

    // Confirm before deletion
    if (confirm("Are you sure you want to delete this patient?")) {
        // Start a transaction on the 'patients' object store
        const transaction = db.transaction(['patients'], 'readwrite');
        const objectStore = transaction.objectStore('patients');

        // Delete patient on ID selected in dropdown
        const deleteRequest = objectStore.delete(parseInt(patientId)); // Convert patient ID to integer

        deleteRequest.onsuccess = function() {
            alert("Patient deleted successfully!");
            location.reload(); // Reload the page to reflect changes
        };

        deleteRequest.onerror = function(event) {
            console.error("Error deleting patient:", event.target.error);
            alert("Error deleting patient.");
        };
    }
}

// Start the database when the page loads
window.onload = function() {
    openDB();  // execute database
};