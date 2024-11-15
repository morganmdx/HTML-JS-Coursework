// Initialize and open the IndexedDB database
let db1;

// DOMCONTENTLOADED: run the following code when the html page has been fully loaded
document.addEventListener('DOMContentLoaded', () => {
    let request = window.indexedDB.open('DoctorsDB', 4); // Open 'doctorsDB' with version 2

    request.onerror = function(event) {
        console.error('Database failed to open', event);
    };

    request.onsuccess = function(event) {
        db1 = event.target.result; // Assign the opened database to db1
        console.log('Database opened successfully');  // debugging

        // Check if the 'userLogins' store is populated
        let transaction = db1.transaction(['userLogins'], 'readonly');
        let objectStore = transaction.objectStore('userLogins');
        let countRequest = objectStore.count();  // count number of items in object store called userLogins

        countRequest.onsuccess = function() {
            if (countRequest.result === 0) {
                console.log('Populating users...');
                populateUsers();  // Populate users if the store is empty
            } else {
                console.log('User logins store already populated');
            }
        };
    };

    // Upgrade event for IndexedDB version changes
    request.onupgradeneeded = function(event) {
        db1 = event.target.result;

        // Create 'doctors' store if it doesn't exist
        if (!db1.objectStoreNames.contains('doctors')) {
            let objectStore = db1.createObjectStore('doctors', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex('first_name', 'first_name', { unique: false });
            objectStore.createIndex('last_name', 'last_name', { unique: false });
            console.log('Doctors object store created');
        }

        // Create 'userLogins' store if it doesn't exist
        if (!db1.objectStoreNames.contains('userLogins')) {
            let loginStore = db1.createObjectStore('userLogins', { keyPath: 'id', autoIncrement: true });
            loginStore.createIndex('username', 'username', { unique: true }); // Add index for 'username'
            console.log('User logins object store created');
        }
    };
});

// Display appointments for the logged-in patient
    function displayUserAppointments() {
        const username = localStorage.getItem('loggedInPatientUsername');
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
                        <td>${appointment.notes}</td>
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

// Function to populate the 'userLogins' store with sample data
function populateUsers() {
    // populate with sample data if no data exists
    let users = [
        { username: 'john.doe@example.com', password: 'password123' },
        { username: 'jane.doe@example.com', password: 'securepass' }
    ];

    let transaction = db1.transaction(['userLogins'], 'readwrite');  // read write permissions for db's object store userLogins
    let objectStore = transaction.objectStore('userLogins');  // object store called userLogins
    
    users.forEach(user => objectStore.add(user));  // Add user with their data for each

    transaction.oncomplete = function() {
        console.log('Users added successfully');
    };

    // error handling and debugging
    transaction.onerror = function(event) {
        console.error('Error adding users:', event.target.error);
    };
}

// Login form submission event listener
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    // create variables and store values as values of form elements
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    
    console.log(`Attempting login with username: ${username}`); // Debugging line

    let request = window.indexedDB.open('DoctorsDB', 4); // Open 'doctorsDB'

    request.onerror = function(event) {
        console.error('Database failed to open', event);  // debugging
    };

    request.onsuccess = function(event) {
        let db = event.target.result;

        // Transaction to check if the user exists in the userLogins store
        let transaction = db.transaction(['userLogins'], 'readonly');
        let objectStore = transaction.objectStore('userLogins');
        let index = objectStore.index('username');
        let getRequest = index.get(username);

        getRequest.onsuccess = function(event) {
            let user = event.target.result;
            console.log('User found:', user);  // Debugging line
            if (user && user.password === password) {
                window.location.href = 'dashboard.html'; // Redirect to dashboard on successful login
            } else {
                alert('Invalid username or password');  // use alert() function to display msg to user
            }
        };

        getRequest.onerror = function(event) {
            console.error('Error fetching user:', event.target.errorCode);
        };
    };
});
