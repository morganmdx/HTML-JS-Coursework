let db;

// run the following code when the html page has been fully loaded
document.addEventListener('DOMContentLoaded', () => {
    let request = window.indexedDB.open('DoctorsDB', 4); // Incremented version to 4 to clear previous

    // error handling for DB failing to open or make a connection
    request.onerror = function(event) {
        console.error('Database failed to open', event);
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Database opened successfully');

        // Check and populate the database if needed
        let transaction = db.transaction(['doctors'], 'readonly');
        let objectStore = transaction.objectStore('doctors');
        let countRequest = objectStore.count();

        countRequest.onsuccess = function() {
            if (countRequest.result === 0) {
                populateDatabase();
            } else {
                console.log('Database already populated');
            }
        };

        // Load doctors into the select dropdown once the DB is initialized
        loadDoctors();
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;

        // Create the 'doctors' object store if it doesn't exist
        if (!db.objectStoreNames.contains('doctors')) {
            let objectStore = db.createObjectStore('doctors', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex('first_name', 'first_name', { unique: false });
            objectStore.createIndex('last_name', 'last_name', { unique: false });
            console.log('Doctors object store created');
        }

        // Create the 'userLogins' object store if it doesn't exist
        if (!db.objectStoreNames.contains('userLogins')) {
            let loginStore = db.createObjectStore('userLogins', { keyPath: 'id' });
            console.log('User logins object store created');
        }
    };
});

// Function to hash passwords for security reasons
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Function to load doctors
function loadDoctors() {
    if (!db) {
        console.error("Database is not initialized.");
        return;
    }

    let transaction = db.transaction(['doctors'], 'readonly');
    let objectStore = transaction.objectStore('doctors');
    let request = objectStore.getAll();  // get all items
    const checkDropdown = document.getElementById('doctorSelect');  // variable to check if doctorSelect <select> box exists on page

    if (checkDropdown) {  // check if select box is within page's markup
        request.onsuccess = function(event) {
            const doctors = event.target.result;
            const doctorSelect = document.getElementById('doctorSelect');
    
            // if doctor select box exists on page
            if (doctorSelect) {
                doctorSelect.innerHTML = ''; // Clear existing options
            }
    
            // if 1 or more doctors in array then loop through each doctor and append as an <option> element to the <select> box
            if (doctors.length > 0) {
                doctors.forEach(doctor => {
                    const option = document.createElement('option');
                    option.value = doctor.id;
                    option.textContent = `${doctor.first_name} ${doctor.last_name}`;
                    doctorSelect.appendChild(option);
                });
            } else {
                console.log('No doctors found in IndexedDB.');  // error to display in console log for debugging
            }
        };
    }

    // error handling if the above fails
    request.onerror = function(event) {
        console.error('Error getting doctors:', event.target.error);
    };
}

// Function to get and populate data to the database from the provided doctors JSON file
function populateDatabase() {
    fetch('https://jsethi-mdx.github.io/cst2572.github.io/doctors.json')
        .then(response => response.json())
        .then(data => {
            let transaction = db.transaction(['doctors'], 'readwrite');
            let objectStore = transaction.objectStore('doctors');  // object store called doctors
            
            // for each item add doctor to db object store called doctors
            data.forEach(doctor => {
                objectStore.add(doctor);
            });

            // mainly for debugging - if this were a live project
            transaction.oncomplete = function() {
                console.log('Doctors successfully added to the database');
            };

            transaction.onerror = function(event) {
                console.error('Transaction failed', event);
            };
        })
        .catch(error => console.error('Error fetching doctors:', error));
}

// Function to allow user to search doctors based on their first/last name
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
    resultsDiv.innerHTML = '';

    // if more than 1 result exists then loop through each and display using OOP to access values
    if (results.length > 0) {
        let html = '<h2>Search Results:</h2>';  // output h2 heading
        html += '<ul>';  // display as unordered list

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

        html += '</ul>'; // closing unordered list tag
        resultsDiv.innerHTML = html;  // output to resultsDiv element on page defined above by using 'innerHTML' to output as the content of the element
    } else {  
        // if no doctors exist then output the following
        resultsDiv.innerHTML = '<p>No doctors found.</p>';
    }
}

// Function to add a new doctor
function addDoctor() {
    if (!db) {  // check if there is an existing db connection
        console.error('Database has not been started or created.');
        return;
    }

    // map variables in our db to the values of the form fields hence using getElementById and the .value target
    const doctorData = {
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        email: document.getElementById('email').value,
        gender: document.getElementById('gender').value,
        Address: document.getElementById('address').value,
        Telephone: document.getElementById('telephone').value
    };

    const transaction = db.transaction(['doctors'], 'readwrite');
    const objectStore = transaction.objectStore('doctors');  // object store called doctors
    const request = objectStore.add(doctorData);

    request.onsuccess = function() {
        console.log("New Doctor Data added to DB:", doctorData);
        alert("Doctor added successfully!");
    };

    // error handling with visual alert msg
    request.onerror = function(event) {
        console.error("Error adding doctor:", event.target.error);
        alert("Failed to add doctor. Please check the console for details.");
    };

    // reset add doctor form on form submisssion
    document.getElementById('doctorForm').reset();
    return false; // Prevent the form from submitting the normal page-refresh way
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
                document.getElementById('gender').value = doctor.gender;  // populate selected doctor's gender into the gender input field
                document.getElementById('address').value = doctor.Address;
                document.getElementById('telephone').value = doctor.Telephone;
            }
        };
    }
}

// Function to allow user to edit doctor
function editDoctor() {
    const doctorId = document.getElementById('doctorSelect').value;  // get value of doctor ID based on selected doctor in the <select> box with the ID doctorSelect

    // map the values of the form fields to the db fields
    const updatedData = {
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        email: document.getElementById('email').value,
        gender: document.getElementById('gender').value,
        Address: document.getElementById('address').value,
        Telephone: document.getElementById('telephone').value
    };

    const transaction = db.transaction(['doctors'], 'readwrite');
    const objectStore = transaction.objectStore('doctors');  // object store called doctors
    const request = objectStore.put({ id: parseInt(doctorId), ...updatedData });  // convert doctor ID to integer and update data

    request.onsuccess = function() {
        alert("Doctor updated successfully!");  // display visual alert popup using alert() function
    };

    // error handling for failing to update doctor from the form's submission
    request.onerror = function(event) {
        console.error("Error updating doctor:", event.target.error);
        alert("Failed to update doctor. Please check the console for details.");
    };

    return false; // Prevent the form from submitting the default way
}

// Function to handle deleting a doctor from DB
function deleteDoctor() {
    const doctorId = document.getElementById('doctorSelect').value;

    // ask user using confirm function prompt
    if (confirm("Are you sure you want to delete this doctor?")) {
        const transaction = db.transaction(['doctors'], 'readwrite');
        const objectStore = transaction.objectStore('doctors');

        // look up object store for selected doctor's id and delete that doctor from db
        const deleteRequest = objectStore.delete(parseInt(doctorId));

        deleteRequest.onsuccess = function() {
            alert("Doctor deleted successfully!");  // display msg to user using alert() function
            location.reload();
        };

        deleteRequest.onerror = function(event) {
            console.error("Error deleting doctor:", event.target.error);
            alert("Error deleting doctor.");
        };
    }
}

// Function to update the username field
function updateUsername() {
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;  // get value of password field and store as variable
    if (username !== "" && password !== "") {
        storeLoginDetails(username, password);
    }
}

// Function to store login details
async function storeLoginDetails(username, password) {
    let transaction = db.transaction(['userLogins'], 'readwrite');
    let objectStore = transaction.objectStore('userLogins');
    let request = objectStore.add({ username, password });

    const hashedPassword = await hashPassword(password);  // hash password for security reasons and store as variable

    request.onsuccess = function(event) {
        console.log("User login details saved successfully.");
    };

    // error handling
    request.onerror = function(event) {
        console.error("Error saving login details", event.target.error);
    };
}

// Function to validate login
async function validateLogin() {
    // create our variables for the value of form elements for login fields
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    // hash password for security reasons and store as new variable
    const hashedPassword = await hashPassword(password);

    let transaction = db.transaction(['userLogins'], 'readonly');
    let objectStore = transaction.objectStore('userLogins');  // get object store userLogins
    let request = objectStore.getAll();  // get all from DB

    request.onsuccess = function(event) {
        let users = event.target.result;
        let user = users.find(u => u.username === username && u.password === hashedPassword);

        // if finds user matching username and the hashed password then run following code
        if (user) {
            alert("Login successful");  // display prompt to user using alert() function
            // Save logged-in status, username, and user ID to localStorage
            localStorage.setItem('isDoctorLoggedIn', 'true');
            localStorage.setItem('loggedInDoctorUsername', username);
            localStorage.setItem('loggedInDoctorID', user.id);  // Store the user ID
            window.location.href = "admin.html"; // Redirect to doctor management page
        } else {
            alert("Invalid username or password.");  // incorrect login details entered
        }
    };

    request.onerror = function(event) {
        console.error("Error validating login", event.target.error);
    };

    return false;
}


// Function to update the username field when a doctor is selected
function updateUsername() {
    const doctorId = document.getElementById('doctorSelect').value; // get value of doctorSelect <select> box for selected doctor
    if (doctorId) {  // if doctor ID is selected or the value is populated or not empty
        const transaction = db.transaction(['doctors'], 'readonly');
        const objectStore = transaction.objectStore('doctors');
        const request = objectStore.get(parseInt(doctorId));  // convert doctor ID to integer and get doctor from object store based on their ID

        request.onsuccess = function(event) {
            const doctor = event.target.result;
            if (doctor) {
                // Populate the username field with the doctor's email
                document.getElementById('username').value = doctor.email;
            }
        };
    }
}

// Changes to the doctorSelect dropdown based on user's doctor selection - load the following when HTML content is loaded
document.addEventListener('DOMContentLoaded', () => {
    const doctorSelect = document.getElementById('doctorSelect');
    if (doctorSelect) {  // if doctor select box appears on page
        doctorSelect.addEventListener('change', updateUsername);
    } else {
        return;
    }
});



// Create doctor login details
async function createDoctorLoginDetails() {
    let doctorId = document.getElementById('doctorSelect').value; 
    let password = document.getElementById('password').value;
    const hashedPassword = await hashPassword(password);

    let transaction = db.transaction(['doctors', 'userLogins'], 'readwrite');
    let doctorStore = transaction.objectStore('doctors');
    let loginStore = transaction.objectStore('userLogins');

    let doctorRequest = doctorStore.get(parseInt(doctorId));  // convert doctor ID to integer and get from object store based on their ID

    doctorRequest.onsuccess = function(event) {
        let doctor = event.target.result;
        // conditional logic that then maps fields in the DB to our variables above based on input into front-end form
        if (doctor) {
            let loginData = {
                id: doctorId,
                username: doctor.email,
                password: hashedPassword  // value of hashed password
            };

            let loginRequest = loginStore.add(loginData);  // add to DB

            loginRequest.onsuccess = function() {
                alert("Doctor login details created successfully!");
            };  // successful
        }
    };
}