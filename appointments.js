let dbPatients, dbDoctors, dbAppointments;
let appointmentPatientNote = '';  // create empty string to make the variable work later

// Function to check and populate the patients database with JSON data
function checkAndPopulatePatients() {
    let transaction = dbPatients.transaction(['patients'], 'readonly');
    let objectStore = transaction.objectStore('patients');  // object store called patients
    let countRequest = objectStore.count();  // count number of patients that exist in our object store called patients

    countRequest.onsuccess = function() {
        // add sample data if none exists in DB
        if (countRequest.result === 0) {
            const patientsData = [
                { First: 'John', Last: 'Doe', age: 30 },
                { First: 'Jane', Last: 'Smith', age: 45 },
                { First: 'Mary', Last: 'Johnson', age: 60 }
            ];

            let transaction = dbPatients.transaction(['patients'], 'readwrite');  // read write permissions
            let objectStore = transaction.objectStore('patients');  // object store called patients
            patientsData.forEach(patient => objectStore.add(patient));  // for each patient, add
        }
    };
}

// Open or create the PatientsDB
function openPatientsDB() {
    let request = indexedDB.open('patientsDB', 5);  // open DB called patientsDB

    request.onupgradeneeded = function(event) {
        dbPatients = event.target.result;

        if (!dbPatients.objectStoreNames.contains('patients')) {
            let objectStore = dbPatients.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
        }

        // if there is not an object store called userLogins then create the object store within our DB
        if (!dbPatients.objectStoreNames.contains('userLogins')) {
            dbPatients.createObjectStore('userLogins', { keyPath: 'id' });
        }
    };

    request.onsuccess = function(event) {
        dbPatients = event.target.result;
        console.log('PatientsDB opened successfully');
        checkAndPopulatePatients();  // Populate the patients if needed
        populatePatientSelect(); // Populate the patient select dropdown
    };

    request.onerror = function(event) {
        console.error('PatientsDB error:', event.target.errorCode);
    };
}

// Open or create the DoctorsDB
function openDoctorsDB() {
    let request = indexedDB.open('DoctorsDB', 4);  // open DB called DoctorsDB - version 4 of DB

    request.onupgradeneeded = function(event) {
        dbDoctors = event.target.result;

        // if no object store called doctors then create object store with indexes called first_name and last_name
        if (!dbDoctors.objectStoreNames.contains('doctors')) {
            let objectStore = dbDoctors.createObjectStore('doctors', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex('first_name', 'first_name', { unique: false });
            objectStore.createIndex('last_name', 'last_name', { unique: false });
        }

        // if no object store called userLogins then create object store called userLogins with the key path being ID
        if (!dbDoctors.objectStoreNames.contains('userLogins')) {
            dbDoctors.createObjectStore('userLogins', { keyPath: 'id' });
        }
    };

    request.onsuccess = function(event) {
        dbDoctors = event.target.result;
        console.log('DoctorsDB opened successfully');  // for debugging
        checkAndPopulateDoctors();  // Populate the doctors if needed
        loadDoctors();
        populatePatientSelect();  // Call and run function to populate data in select dropdown
    };

    // error handling
    request.onerror = function(event) {
        console.error('DoctorsDB error:', event.target.errorCode);
    };
}

// Function to check and populate the doctors database from external JSON data
function checkAndPopulateDoctors() {
    let transaction = dbDoctors.transaction(['doctors'], 'readonly'); // we only need read permissions
    let objectStore = transaction.objectStore('doctors'); // object store called doctors
    let countRequest = objectStore.count();  // count the number of doctors that exist in object store doctors

    countRequest.onsuccess = function() {
        if (countRequest.result === 0) {
            // Fetch doctors data from external JSON file
            fetch('https://jsethi-mdx.github.io/cst2572.github.io/doctors.json')
                .then(response => response.json())
                .then(data => {
                    let transaction = dbDoctors.transaction(['doctors'], 'readwrite');
                    let objectStore = transaction.objectStore('doctors');
                    
                    // Add each doctor from the fetched data to the database
                    data.forEach(doctor => {
                        objectStore.add(doctor);  // add each doctor that we successfully find within the JSON to the object store called doctors within the DoctorsDB db
                    });

                    transaction.oncomplete = function() {
                        console.log('Doctors successfully added to the database');  // debugging
                    };

                    transaction.onerror = function(event) {
                        console.error('Transaction failed', event);
                    };
                })
                .catch(error => console.error('Error fetching doctors:', error));  // add error to console log for debugging if so
        }
    };
}

// DOMCONTENTLOADED: run the following code when the html page has been fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Ensure these elements exist before proceeding
    if (document.getElementById('patientSelect') && document.getElementById('doctorSelect')) {

        // Open the PatientsDB
        openPatientsDB();

        // Open the DoctorsDB
        openDoctorsDB();
        
    } 
});


// Function to populate the patient select dropdown
function populatePatientSelect() {
    const patientSelect = document.getElementById('patientSelect');
    /* if (!patientSelect) {
        console.error('patientSelect element not found.');
        return;
    } */

    if (patientSelect) {
        const transaction = dbPatients.transaction(['patients'], 'readonly');
        const objectStore = transaction.objectStore('patients');

        const request = objectStore.getAll();

        request.onsuccess = function(event) {
            const patients = event.target.result;
            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.First} ${patient.Last}`;
                patientSelect.appendChild(option);
            });
        };

        request.onerror = function(event) {
            console.error('Error loading patients:', event.target.error);
        };
    }
}



// Function to load doctors
function loadDoctors() {
    if (!dbDoctors) {
        console.error("Doctors database is not initialized.");
        return;
    }

    let transaction = dbDoctors.transaction(['doctors'], 'readonly');
    let objectStore = transaction.objectStore('doctors');
    let request = objectStore.getAll();

    request.onsuccess = function(event) {
        const doctors = event.target.result;
        const doctorSelect = document.getElementById('doctorSelect');
        if (doctorSelect) {
            doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `${doctor.first_name} ${doctor.last_name}`;
                doctorSelect.appendChild(option); 
            });
        }
    };

    request.onerror = function(event) {
        console.error('Error getting doctors:', event.target.error);
    };
}


// Open or create the AppointmentsDB
function openAppointmentsDB() {
    // Open the AppointmentsDB
    let request = indexedDB.open('AppointmentsDB', 2);

    // Handle database upgrade
    request.onupgradeneeded = function(event) {
        dbAppointments = event.target.result;

        // Create the object store if it doesn't exist
        if (!dbAppointments.objectStoreNames.contains('appointments')) {
            let objectStore = dbAppointments.createObjectStore('appointments', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex('patient_id', 'patient_id', { unique: false });
            objectStore.createIndex('doctor_id', 'doctor_id', { unique: false });
            objectStore.createIndex('date', 'date', { unique: false });
            console.log('Appointments object store created.');
        } else {
            console.log('Appointments object store already exists.');
        }
    };

    // Handle success
    request.onsuccess = function(event) {
        dbAppointments = event.target.result;
        console.log('AppointmentsDB opened successfully.');
        // If Patient is logged in
        if (localStorage.getItem("isPatientLoggedIn")) {
            loadAppointments(); // Load existing appointments after the database is opened
        }
        else {
            loadAppointments_all(); // Load appointments for all patients
        }
    };

    // Handle error
    request.onerror = function(event) {
        console.error('AppointmentsDB error:', event.target.errorCode, event.target.error);
    };
}


// Function to add an appointment
function addAppointment(patientId, doctorId, date, appointmentPatientNote) {
    if (!dbAppointments) {
        console.error("Appointments database is not initialized.");
        return;
    }

    const currentPatientID = parseInt(localStorage.getItem('loggedInUserId'));
    console.log("The current patient ID is ", currentPatientID);
    const inputPatientID = document.getElementById('patientSelectalt');


    if (inputPatientID) {
        inputPatientID.value = currentPatientID; // Set the value of the input element
    }

    // Validate inputs
    if (!patientId || !doctorId || !date) {
        return;
    }

    let transaction = dbAppointments.transaction(['appointments'], 'readwrite');
    let objectStore = transaction.objectStore('appointments');

    let newAppointment = {
        patient_id: patientId,
        doctor_id: doctorId,
        date: date,
        patientNote: appointmentPatientNote,
    };

    let request = objectStore.add(newAppointment);

    request.onsuccess = function() {
        console.log('Appointment added successfully');
        loadAppointments(); // Reload the appointments to show the new entry
        showMessage("Appointment added successfully!"); // Display success message
    };

    request.onerror = function(event) {
        console.error('Error adding appointment:', event.target.error);
    };
}

// Function to display a message on the frontend
function showMessage(message) {
    const messageElement = document.getElementById('message');  // Get the element with ID 'message'
    
    if (!messageElement) {
        console.error('Message element not found in the DOM.');
        return;
    }
    
    // Update the text content of the message element
    messageElement.textContent = message;

    // Show message
    messageElement.style.display = 'block';
}


// Display appointments for the logged-in patient
function displayUserAppointments() {
    const username = localStorage.getItem('loggedInUserId');
    if (!username) {
        console.log('No user is logged in.');
        return;
    }

    const transaction = db.transaction(['appointments'], 'readonly');
    const objectStore = transaction.objectStore('appointments');
    const request = objectStore.getAll();

    request.onsuccess = function (event) {
        const appointments = event.target.result;
        const userAppointments = appointments.filter(appointment => appointment.username === username);

        const tableBody = document.querySelector('#appointments-list tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        if (userAppointments.length > 0) {
            userAppointments.forEach((appointment) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${appointment.date}</td>
                    <td>${appointment.time}</td>
                    <td>${appointment.doctor}</td>
                    <td>${appointment.reason}</td>
                    <td>${appointment.patientNote}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4">No appointments found for ${username}.</td>`;
            tableBody.appendChild(row);
        }
    };

    request.onerror = function (event) {
        console.error('Error fetching appointments:', event.target.error);
    };
}

// Function to load appointments and display them in a table for the logged-in user
function loadAppointments() {
    if (!dbAppointments) {
        console.error("Appointments database is not initialized.");
        return;
    }

    const loggedInUserId = parseInt(localStorage.getItem('loggedInUserId')); // Retrieve logged-in user's ID

    if (!loggedInUserId) {
        console.error("No logged-in user found.");
        return;
    }

    let transaction = dbAppointments.transaction(['appointments'], 'readonly');
    let objectStore = transaction.objectStore('appointments');
    let request = objectStore.getAll();

    request.onsuccess = async function(event) {
        const appointments = event.target.result;
        const appointmentsTable = document.getElementById('appointmentsTableBody');

        if (appointmentsTable) {
            // Clear the current table contents
            appointmentsTable.innerHTML = '';

            // Filter appointments for the logged-in user
            const userAppointments = appointments.filter(appointment => appointment.patient_id === loggedInUserId);

            if (userAppointments.length === 0) {
                appointmentsTable.innerHTML = `<tr><td colspan="4">No appointments found.</td></tr>`;
                return;
            }

            // Display the filtered appointments
            for (const appointment of userAppointments) {
                const patient = await getPatientById(appointment.patient_id);
                const doctor = await getDoctorById(appointment.doctor_id);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${appointment.id}</td>
                    <td>${patient ? `${patient.First} ${patient.Last}` : 'Unknown Patient'}</td>
                    <td>${doctor ? `${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor'}</td>
                    <td>${appointment.date}</td>
                    <td>${appointment.notes || 'No notes.'}</td>
                    <td>${appointment.patientNote || 'No notes.'}</td>
                `;
                appointmentsTable.appendChild(row);
            }
        }
    };

    request.onerror = function(event) {
        console.error('Error loading appointments:', event.target.error);
    };
}

// Function to load appointments and display them in a table for the logged-in user
function loadAppointments_all() {
    if (!dbAppointments) {
        console.error("Appointments database is not initialized.");
        return;
    }

    const loggedInUserId = parseInt(localStorage.getItem('loggedInUserId')); // Retrieve logged-in user's ID

    if (!loggedInUserId) {
        console.error("No logged-in user found.");
        return;
    }

    let transaction = dbAppointments.transaction(['appointments'], 'readonly');
    let objectStore = transaction.objectStore('appointments');
    let request = objectStore.getAll();

    request.onsuccess = async function(event) {
        const appointments = event.target.result;
        const appointmentsTable = document.getElementById('appointmentsTableBody');

        if (appointmentsTable) {
            // Clear the current table contents
            appointmentsTable.innerHTML = '';

            // Filter appointments for the logged-in user
            const userAppointments = appointments;

            if (userAppointments.length === 0) {
                appointmentsTable.innerHTML = `<tr><td colspan="4">No appointments found.</td></tr>`;
                return;
            }

            // Display the filtered appointments
            for (const appointment of userAppointments) {
                const patient = await getPatientById(appointment.patient_id);
                const doctor = await getDoctorById(appointment.doctor_id);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${appointment.id}</td>
                    <td>${patient ? `${patient.First} ${patient.Last}` : 'Unknown Patient'}</td>
                    <td>${doctor ? `${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor'}</td>
                    <td>${appointment.date}</td>
                    <td>${appointment.notes || 'No notes.'}</td>
                `;
                appointmentsTable.appendChild(row);
            }
        }
    };

    request.onerror = function(event) {
        console.error('Error loading appointments:', event.target.error);
    };
}


// Helper function to get patient by ID
function getPatientById(patientId) {
    return new Promise((resolve, reject) => {
        const transaction = dbPatients.transaction(['patients'], 'readonly');
        const objectStore = transaction.objectStore('patients');
        const request = objectStore.get(patientId);

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Helper function to get doctor by ID
function getDoctorById(doctorId) {
    return new Promise((resolve, reject) => {
        const transaction = dbDoctors.transaction(['doctors'], 'readonly');
        const objectStore = transaction.objectStore('doctors');
        const request = objectStore.get(doctorId);

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}


// Function to handle form submission for creating an appointment
function handleCreateAppointmentForm(event) {
    event.preventDefault(); // Prevent default form submission

    const patientSelect = document.getElementById('patientSelect');
    const patientSelectalt = document.getElementById('patientSelectalt');
    const doctorSelect = document.getElementById('doctorSelect');
    const appointmentDate = document.getElementById('appointmentDate');

    if (appointmentPatientNote = document.getElementById('patientNote')) {
        appointmentPatientNote = document.getElementById('patientNote').value;
    }

    if (patientSelect && doctorSelect && appointmentDate) {
        const patientId = parseInt(patientSelect.value);
        const doctorId = parseInt(doctorSelect.value);
        const date = appointmentDate.value;
        appointmentPatientNote = document.getElementById('patientNote').value;


        // Validate inputs
        if (isNaN(patientId) || isNaN(doctorId) || !date) {
            console.error('Invalid input: Please select a valid patient, doctor, and date.');
            return;
        }

        // Add the appointment
        if (appointmentPatientNote) {
            addAppointment(patientId, doctorId, date, appointmentPatientNote);
        }
        else {
            addAppointment(patientId, doctorId, date);
        }
    }

    else if (patientSelectalt && doctorSelect && appointmentDate) {
        const patientId = parseInt(patientSelectalt.value);
        const doctorId = parseInt(doctorSelect.value);
        const date = appointmentDate.value;
        appointmentPatientNote = document.getElementById('patientNote').value;

        // Validate inputs
        if (isNaN(patientId) || isNaN(doctorId) || !date) {
            console.error('Invalid input: Please select a valid patient, doctor, and date.');
            return;
        }

        // Add the appointment
        // Add the appointment
        if (appointmentPatientNote) {
            addAppointment(patientId, doctorId, date, appointmentPatientNote);
        }
        else {
            addAppointment(patientId, doctorId, date);
        }
    }
    
    else {
        console.error('Missing form elements.');
    }
}


// Initialize the databases and add event listeners
document.addEventListener('DOMContentLoaded', () => {
    openPatientsDB();
    openDoctorsDB();
    openAppointmentsDB();

    const appointmentDateInput = document.getElementById('appointmentDate');

    if (appointmentDateInput) {
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(today.getDate()).padStart(2, '0');
        const minDate = `${year}-${month}-${day}`;

        // Set the minimum selectable date
        appointmentDateInput.setAttribute('min', minDate);
    }

    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        const loggedInPatientID = localStorage.getItem('loggedInUserId'); // Retrieve from localStorage
        const patientSelectalt = document.getElementById('patientSelectalt'); // Get the input element

        if (loggedInPatientID && patientSelectalt) {
            patientSelectalt.value = parseInt(loggedInPatientID); // Populate the field
        } else {
            console.error('No logged-in patient ID found or element missing.');
        }
        appointmentForm.addEventListener('submit', handleCreateAppointmentForm);
    } 
});

