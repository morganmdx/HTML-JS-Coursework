// Open or create the PatientsDB, DoctorsDB, and AppointmentsDB
let patientsDB, doctorsDB, appointmentsDB;

const requestPatientsDB = indexedDB.open('patientsDB', 5);
const requestDoctorsDB = indexedDB.open('DoctorsDB', 4);
const requestAppointmentsDB = indexedDB.open('AppointmentsDB', 2);

requestPatientsDB.onerror = function(event) {
    console.log('Error opening PatientsDB:', event.target.errorCode);
};

requestPatientsDB.onsuccess = function(event) {
    patientsDB = event.target.result;
    console.log('PatientsDB opened successfully');  // for debugging
    updatePatientCount();  // Update the count when PatientsDB opens
};

requestPatientsDB.onupgradeneeded = function(event) {
    patientsDB = event.target.result;
    console.log('Upgrading or creating the PatientsDB...');

    // if there is NOT an object store with the name patients then run the following code
    if (!patientsDB.objectStoreNames.contains('patients')) {
        const objectStore = patientsDB.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });  // increment id each time
        objectStore.createIndex('name', 'name', { unique: false });
    }
};

requestDoctorsDB.onerror = function(event) {
    console.log('Error opening DoctorsDB:', event.target.errorCode);
};

requestDoctorsDB.onsuccess = function(event) {
    doctorsDB = event.target.result;
    console.log('DoctorsDB opened successfully');
    updateDoctorCount();  // Update the count when DoctorsDB opens
};

requestDoctorsDB.onupgradeneeded = function(event) {
    doctorsDB = event.target.result;
    console.log('Upgrading or creating the DoctorsDB...');  // debugging

    // if there is NOT an object store within the current DB called doctors then run the following code
    if (!doctorsDB.objectStoreNames.contains('doctors')) {
        const objectStore = doctorsDB.createObjectStore('doctors', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('name', 'name', { unique: false });
        console.log('Doctors object store created');  // debugging
    }
};

// Open or create the AppointmentsDB
requestAppointmentsDB.onerror = function(event) {
    console.log('Error opening AppointmentsDB:', event.target.errorCode);
};

requestAppointmentsDB.onsuccess = function(event) {
    appointmentsDB = event.target.result;
    console.log('AppointmentsDB opened successfully');
    updateAppointmentCount();  // Update the count when AppointmentsDB opens
};

requestAppointmentsDB.onupgradeneeded = function(event) {
    appointmentsDB = event.target.result;
    console.log('Upgrading or creating the AppointmentsDB...');  // for debugging

    // if no appointments object store exists then run following
    if (!appointmentsDB.objectStoreNames.contains('appointments')) {
        const objectStore = appointmentsDB.createObjectStore('appointments', { keyPath: 'id', autoIncrement: true });  // create object store for Appts
        objectStore.createIndex('patient_id', 'patient_id', { unique: false });  // create index called patient_id in object store called appointments
        objectStore.createIndex('doctor_id', 'doctor_id', { unique: false });  // create index called doctor_id in object store called appointments
        console.log('Appointments object store created');  // debugging
    }
};

// Function to add a patient to the PatientsDB
function addPatient(patientData) {
    const transaction = patientsDB.transaction(['patients'], 'readwrite');  // readwrite permissions
    const objectStore = transaction.objectStore('patients');  // object store called patients

    const request = objectStore.add(patientData);

    request.onsuccess = function() {
        console.log('Patient added successfully');  // debugging
        updatePatientCount();  // Update the count after adding a new patient
    };

    request.onerror = function(event) {
        console.log('Error adding patient:', event.target.errorCode);
    };
}

// Function to add a doctor to the DoctorsDB
function addDoctor(doctorData) {
    const transaction = doctorsDB.transaction(['doctors'], 'readwrite');
    const objectStore = transaction.objectStore('doctors');

    const request = objectStore.add(doctorData);  // add doctor to the DB with inputted data

    request.onsuccess = function() {
        console.log('Doctor added successfully');  // debugging
        updateDoctorCount();  // Update the count after adding a new doctor
    };

    request.onerror = function(event) {
        console.log('Error adding doctor:', event.target.errorCode);
    };
}

// Function to add an appointment to the AppointmentsDB
function addAppointment(appointmentData) {
    const transaction = appointmentsDB.transaction(['appointments'], 'readwrite');  // connection to AppointmentsDB with readwrite permissions
    const objectStore = transaction.objectStore('appointments');  // object store called appointments

    const request = objectStore.add(appointmentData);  // add appointment data to object store within AppointmentsDB

    // when successfully added
    request.onsuccess = function() {
        console.log('Appointment added successfully');  // debugging
        updateAppointmentCount();  // Update the count after adding a new appointment
    };

    // error handling
    request.onerror = function(event) {
        console.log('Error adding appointment:', event.target.errorCode);  // debugging
    };
}

// Function to update the patient count on the page
function updatePatientCount() {
    const patientCountElement = document.getElementById('patientCount');  // from html page, get <select> box with the ID of patientCount
    
    const transaction = patientsDB.transaction(['patients'], 'readonly');  // read only permissions needed
    const objectStore = transaction.objectStore('patients');  // object store called patients
    
    const request = objectStore.count();  // Get the count of all patient records
    
    // if successful then..
    request.onsuccess = function() {
        const patientCount = request.result;
        patientCountElement.textContent = patientCount;
    };

    // error handling
    request.onerror = function(event) {
        console.log('Error counting patients:', event.target.errorCode);
    };
}

// Function to update the doctor count on the page
function updateDoctorCount() {
    const doctorCountElement = document.getElementById('doctorCount'); // element on page for select box - target based on ID value 'doctorCount'
    
    const transaction = doctorsDB.transaction(['doctors'], 'readonly');
    const objectStore = transaction.objectStore('doctors');
    
    const request = objectStore.count();  // Get the count of all doctor records
    
    // If successful then..
    request.onsuccess = function() {
        const doctorCount = request.result;
        doctorCountElement.textContent = doctorCount;
    };

    // error handling
    request.onerror = function(event) {
        console.log('Error counting doctors:', event.target.errorCode);
    };
}

// Function to update the appointment count on the page
function updateAppointmentCount() {
    const appointmentCountElement = document.getElementById('appointmentCount');  // get element on page with the ID of appointmentCount
    
    const transaction = appointmentsDB.transaction(['appointments'], 'readonly');
    const objectStore = transaction.objectStore('appointments');  // object store called appointments
    
    const request = objectStore.count();  // Get the count of all appointment records
    
    request.onsuccess = function() {
        const appointmentCount = request.result;
        appointmentCountElement.textContent = appointmentCount;  // populate the content on the page
    };

    request.onerror = function(event) {
        console.log('Error counting appointments:', event.target.errorCode);
    };
}

// Handle form submission to add a new patient
function handleAddPatient(event) {
    event.preventDefault();

    // map data from front-end form input to the fields that exist in the DB
    const patientData = {
        name: document.getElementById('name').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        telephone: document.getElementById('telephone').value
    };

    addPatient(patientData);  // add patient using addPatient() function with the parameter values within patientData

    document.getElementById('patientForm').reset();  // reset patient form on submission
}

// Handle form submission to add a new doctor
function handleAddDoctor(event) {
    event.preventDefault();  // prevent default form submission behaviour

    // map data inputted into add new doctor form to DB fields
    const doctorData = {
        name: document.getElementById('doctorName').value,
        specialty: document.getElementById('specialty').value,
        phone: document.getElementById('doctorPhone').value,
        email: document.getElementById('doctorEmail').value
    };

    addDoctor(doctorData);  // add doctor based on inputted data

    document.getElementById('doctorForm').reset();  // clear or reset form on submission
}

// Handle form submission to add a new appointment
function handleAddAppointment(event) {
    event.preventDefault();  // prevent default form submission behaviour

    // map data from front-end form to DB fields
    const appointmentData = {
        patient_id: document.getElementById('patientSelect').value,
        doctor_id: document.getElementById('doctorSelect').value,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value
    };

    addAppointment(appointmentData);  // add appointment data to DB

    document.getElementById('appointmentForm').reset();  // reset or clear form values
}
