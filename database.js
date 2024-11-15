let db;

// Open or create an IndexedDB with the name PatientsDB
function openDB() {
    let request = indexedDB.open('patientsDB', 5); 

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

// Hash a password using SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
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


// Load patient data and use OOP to access values
function loadPatientData() {
    const patientId = document.getElementById('patientSelect').value;
    const transaction = db.transaction(['patients'], 'readonly');
    const store = transaction.objectStore('patients');
    const request = store.get(parseInt(patientId));  // Convert patient ID into integer
    console.log(`Selected Patient ID: ${patientId}`);

    request.onsuccess = function(event) {
        const patient = event.target.result;
        if (patient) {
            // Ensure the property names here match the object structure in IndexedDB
            document.getElementById('first_name').value = patient.First;    // First name
            document.getElementById('last_name').value = patient.Last;      // Last name
            document.getElementById('email').value = patient.Email;         // Email address
            document.getElementById('gender').value = patient.Gender;       // Gender
            document.getElementById('address').value = patient.Address;     // Address
            document.getElementById('telephone').value = patient.Telephone; // Telephone
        } else {
            alert("Patient not found.");
        }
    };

    // error handling
    request.onerror = function(event) {
        console.error("Error loading patient data:", event.target.error);
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
        // if patient select box exists on current page
        if (patientSelect) {
            // for each patient loop through each item and output as an <option> into the <select> box
            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id; // Use patient id as the value
                option.textContent = `${patient.First} ${patient.Last}`; // Display full name using backticks
                patientSelect.appendChild(option); // Add option to the select element
            });
        }
    };

    request.onerror = function(event) {
        console.error('Error loading patients:', event.target.error);
    };
}

async function createPatientLoginDetails() {
    // Get the selected patient ID, username, and password from the form
    let patientId = document.getElementById('patientSelect').value; 
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    // Hash the password for security
    let hashedPassword = await hashPassword(password);

    // Transaction on the patients and userLogins object stores
    let transaction = db.transaction(['patients', 'userLogins'], 'readwrite');
    let patientStore = transaction.objectStore('patients');
    let loginStore = transaction.objectStore('userLogins');

    // Get the patient based on the selected patient's ID
    let request = patientStore.get(parseInt(patientId));  // convert to integer

    request.onsuccess = function(event) {
        let patient = event.target.result; // Get the patient object
        if (patient) {
            // Create a login record
            let loginDetails = {
                id: patient.id,  // Reuse the patient's ID as the key
                username: username,
                password: hashedPassword,
                NHS: patient.NHS  // The patient's NHS value
            };

            // Attempt to add the login details to the userLogins store within DB
            let loginRequest = loginStore.add(loginDetails);

            loginRequest.onsuccess = function() {
                alert("Account details created successfully for patient! The NHS number has been successfully linked to the user account.");
                // display alert to user to notify success
            };

            // error event handling
            loginRequest.onerror = function(event) {
                console.error("Error creating user login details: ", event.target.error);
                alert("Error creating user login details.");  // display alert to user
            };

        } else {
            alert("Selected patient does not exist.");  // display alert to user
        }
    };

    request.onerror = function(event) {
        console.error("Error fetching patient: ", event.target.error);
    };

    // Reset the form after submission
    document.getElementById("patientLoginForm").reset(); 
    return false;  // Prevent default form submission
}


// Add new function to handle the edit patient form page
function editPatient() {
    const patientId = document.getElementById('patientSelect').value;  // get value of selected patient and get the ID
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
    const store = transaction.objectStore("patients");  // access patients object store
    const request = store.put(updatedPatient);

    request.onsuccess = function() {
        alert("Patient updated successfully!");  // using alert() function to display notification popup
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
        // Start a transaction on 'patients' object store
        const transaction = db.transaction(['patients'], 'readwrite');
        const objectStore = transaction.objectStore('patients');

        // Delete patient based on ID selected in dropdown
        const deleteRequest = objectStore.delete(parseInt(patientId)); // Convert patient ID to integer

        deleteRequest.onsuccess = function() {
            alert("Patient deleted successfully!");
            location.reload(); // Reload the page to reflect the patient being deleted to avoid existing data displaying
        };

        deleteRequest.onerror = function(event) {
            console.error("Error deleting patient:", event.target.error);
            alert("Error deleting patient.");
        };
    }
}

async function validateLogin() {
    let username = document.getElementById('username').value.trim(); // Trim to avoid whitespace issues
    let password = document.getElementById('password').value;  // get value of password field

    const hashedPassword = await hashPassword(password); // Hash the inputted password
    // console.log("Input password (hashed):", hashedPassword);  // removing this now for security reasons as it was for debugging

    let transaction = db.transaction(['userLogins'], 'readonly');
    let objectStore = transaction.objectStore('userLogins');  // access userLogins object store

    let request = objectStore.getAll(); // Get all user logins
    request.onsuccess = function(event) {
        let users = event.target.result;
        // console.log("Retrieved users from IndexedDB:", users);

        // Find the matching user
        let user = users.find(u => u.username === username && u.password === hashedPassword);

        if (user) {
            alert("Login successful");
            // Save logged-in status and other details
            localStorage.setItem('isPatientLoggedIn', 'true');
            localStorage.setItem('loggedInUsername', username);
            localStorage.setItem('loggedInUserId', user.id);
            window.location.href = 'admin.html'; // Redirect after login
        } else {
            alert("Invalid login details");
        }
    };

    // error handling for failing to get users
    request.onerror = function(event) {
        console.error("Error getting users from DB:", event.target.error);
        alert("Login failed. Please try again.");  // display alert msg to user
    };
}


// Function to update the username field when a doctor is selected
function updateUsername() {
    const doctorId = document.getElementById('patientSelect').value;  // get value of patientSelect <select> dropdown
    
    if (doctorId) {
        const transaction = db.transaction(['patients'], 'readonly');
        const objectStore = transaction.objectStore('patients');  // access object store called patients
        const request = objectStore.get(parseInt(doctorId));  // convert doctor ID to integer

        request.onsuccess = function(event) {
            const doctor = event.target.result;
            if (doctor) {
                // Populate the username field with the doctor's email
                document.getElementById('username').value = doctor.Email;

                // console.log("Selected patient ID:", doctor.Email);  // commenting this out now as no longer need to output this to console log
            }
        };
    }
}

// DOMCONTENTLOADED: run the following code when the html page has been fully loaded
// Attach the updateUsername function to the change event of the doctorSelect dropdown
document.addEventListener('DOMContentLoaded', () => {
    const doctorSelect = document.getElementById('patientSelect');
    
    // If patient <select> box exists then run the following conditional logic
    if (doctorSelect) {
        doctorSelect.addEventListener('change', updateUsername);
    } else {
        return;  // break out
    }
});

// Start the database when the page loads
window.onload = function() {
    openDB();  // open and execute database
};