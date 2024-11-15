document.addEventListener('DOMContentLoaded', () => {  
    let dbAppointments;
    let dbMedicines;
    let dbPatients;

    // Open AppointmentsDB
    function openAppointmentsDB() {
        const request = indexedDB.open('AppointmentsDB', 2);

        request.onsuccess = function (event) {
            console.log('AppointmentsDB opened.');
            dbAppointments = event.target.result;
            loadAppointments();
        };

        request.onerror = function (event) {
            console.error('Error opening AppointmentsDB:', event.target.error);
        };
    }

    // Open MedicinesDB
    function openMedicinesDB() {
        const request = indexedDB.open('MedicinesDB', 1);

        request.onsuccess = function (event) {
            console.log('MedicinesDB opened.');
            dbMedicines = event.target.result;
            loadMedicines();
        };

        request.onerror = function (event) {
            console.error('Error opening MedicinesDB:', event.target.error);
        };
    }

    // Open PatientsDB
    function openPatientsDB() {
        const request = indexedDB.open('patientsDB', 5);  // Ensure version matches your actual DB version

        request.onsuccess = function (event) {
            console.log('PatientsDB opened.');
            dbPatients = event.target.result;
        };

        request.onerror = function (event) {
            console.error('Error opening PatientsDB:', event.target.error);
        };
    }

    // Load appointments with patient names
    function loadAppointments() {
        const appointmentSelect = document.getElementById('appointmentSelect');
        if (!appointmentSelect) {
            console.error('Appointment dropdown not found.');
            return;
        }

        const transaction = dbAppointments.transaction('appointments', 'readonly');
        const objectStore = transaction.objectStore('appointments');

        objectStore.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                const appointment = cursor.value;
                const patientId = appointment.patient_id;

                // Fetch patient details after ensuring PatientsDB is loaded
                if (dbPatients) {
                    fetchPatientName(patientId, function(patientFullName) {
                        const option = document.createElement('option');
                        option.value = appointment.id;
                        option.textContent = `Appointment ID: ${appointment.id} - Patient: ${patientFullName}`;
                        appointmentSelect.appendChild(option);
                    });
                } else {
                    console.error('PatientsDB is not loaded yet.');
                }

                cursor.continue();
            }
        };

        transaction.onerror = function (event) {
            console.error('Error loading appointments:', event.target.error);
        };
    }

    // Fetch patient name (First and Last) from PatientsDB
    function fetchPatientName(patientId, callback) {
        const transaction = dbPatients.transaction('patients', 'readonly');
        const objectStore = transaction.objectStore('patients');

        const request = objectStore.get(patientId);
        request.onsuccess = function (event) {
            const patient = event.target.result;
            if (patient) {
                // Concatenate First and Last name to get full name
                const patientFullName = `${patient.First} ${patient.Last}`;
                console.log('Patient found:', patientFullName);  // Log the full name
                callback(patientFullName);  // Pass the full name to the callback
            } else {
                console.error('Patient not found.');
                callback('Unknown Patient');  // Fallback in case patient not found
            }
        };

        request.onerror = function (event) {
            console.error('Error fetching patient name:', event.target.error);
        };
    }

    // Load medicines into the dropdown
    function loadMedicines() {
        const medicineSelect = document.getElementById('medicineSelect');
        if (!medicineSelect) {
            console.error('Medicine dropdown not found.');
            return;
        }

        const transaction = dbMedicines.transaction('medicines', 'readonly');
        const objectStore = transaction.objectStore('medicines');

        objectStore.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                const medicine = cursor.value;

                // Log the medicine name to check if it's populated
                console.log('Medicine:', medicine);

                const option = document.createElement('option');
                option.value = medicine.id;

                // Check if the name is valid, and set text accordingly
                if (medicine.Drug) {
                    option.textContent = medicine.Drug;
                } else {
                    option.textContent = 'Unknown Medicine';  // Fallback if no name
                }

                medicineSelect.appendChild(option);
                cursor.continue();
            }
        };

        transaction.onerror = function (event) {
            console.error('Error loading medicines:', event.target.error);
        };
    }

    // Add selected medicine and notes to the selected appointment
    document.getElementById('addMedicinesForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const appointmentId = parseInt(document.getElementById('appointmentSelect').value);
        const medicineId = parseInt(document.getElementById('medicineSelect').value);
        const appointmentNotes = document.getElementById('appointmentNotes').value;  // Get the notes from the textarea

        // Fetch the selected appointment
        const transaction = dbAppointments.transaction('appointments', 'readwrite');
        const objectStore = transaction.objectStore('appointments');
        const request = objectStore.get(appointmentId);

        request.onsuccess = function (event) {
            const appointment = event.target.result;

            if (!appointment.medicines) {
                appointment.medicines = []; // Initialize medicines array if not present
            }

            // Add the selected medicine to the medicines array
            appointment.medicines.push(medicineId);

            // Add notes to the appointment
            appointment.notes = appointmentNotes;  // Add the notes field

            // Update the appointment in the database
            const updateRequest = objectStore.put(appointment);
            updateRequest.onsuccess = function () {
                console.log(`Medicine ID ${medicineId} added to Appointment ID ${appointmentId}.`);
                displayAppointmentDetails(appointment); // Display updated appointment details

                // Append success message to the existing statusMessage element
                const statusMessage = document.getElementById('message');
                if (statusMessage) {
                    statusMessage.textContent = `Appointment ID ${appointmentId} successfully updated.`;
                    statusMessage.style.display = 'block';
                }
            };
            updateRequest.onerror = function (event) {
                console.error('Error updating appointment:', event.target.error);
            };
        };

        request.onerror = function (event) {
            console.error('Error fetching appointment:', event.target.error);
        };
    });

    // Display updated appointment details including notes
    function displayAppointmentDetails(appointment) {
        const appointmentDetails = document.getElementById('appointmentDetails');
        appointmentDetails.innerHTML = ` 
            <p>Appointment ID: ${appointment.id}</p>
            <p>Patient ID: ${appointment.patient_id}</p>
            <p>Doctor ID: ${appointment.doctor_id}</p>
            <p>Medicines: ${appointment.medicines.join(', ')}</p>
            <p><strong>Notes:</strong> ${appointment.notes || 'No notes added'}</p>
        `;
    }

    // Initialize all databases when the page loads
    openAppointmentsDB();
    openMedicinesDB();
    openPatientsDB();
});
