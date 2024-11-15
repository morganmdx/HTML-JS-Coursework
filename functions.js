// Declare the db variable in the global scope
let db1;

// Function to open or create IndexedDB
function setupIndexedDB() {
    const request = indexedDB.open("AdminsDB", 1);

    request.onupgradeneeded = function (event) {
        db1 = event.target.result;

        // Create "admins" object store
        if (!db1.objectStoreNames.contains("admins")) {
            const adminStore = db1.createObjectStore("admins", { keyPath: "id" });
            adminStore.createIndex("email", "email", { unique: true });
        }

        // Create "userLogins" object store
        if (!db1.objectStoreNames.contains("userLogins")) {
            const userLoginsStore = db1.createObjectStore("userLogins", { autoIncrement: true });
            userLoginsStore.createIndex("username", "username", { unique: true });
        }
    };

    request.onsuccess = function (event) {
        db1 = event.target.result; // Assign the db object to the global variable
        console.log("IndexedDB initialized successfully.");
        fetchAndStoreAdminData(); // Fetch and store data after DB is ready
        populateAdminSelect();    // Populate data in the select dropdown
    };

    request.onerror = function (event) {
        console.error("Error opening IndexedDB:", event.target.error);
    };
}

// Function to fetch and store JSON data in the "admins" table
function fetchAndStoreAdminData() {
    const url = "https://jsethi-mdx.github.io/cst2572.github.io/admin.json";

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            console.log("JSON data fetched successfully:", data);
            const transaction = db1.transaction(["admins"], "readwrite");
            const objectStore = transaction.objectStore("admins");

            data.forEach(admin => {
                objectStore.put(admin);
            });

            transaction.oncomplete = function () {
                console.log("All admin data added to IndexedDB.");
            };

            transaction.onerror = function (event) {
                console.error("Transaction error:", event.target.error);
            };
        })
        .catch(error => {
            console.error("Error fetching JSON:", error);
        });
}

// Function to populate the admin select dropdown
function populateAdminSelect() {
    const adminSelect = document.getElementById('adminSelect');
    if (!db1) {
        console.error("Database not initialized.");
        return;
    }

    const transaction = db1.transaction(['admins'], 'readonly');
    const objectStore = transaction.objectStore('admins');

    const request = objectStore.getAll();

    request.onsuccess = function (event) {
        const admins = event.target.result;
        if (adminSelect) {
            admins.forEach(admin => {
                const option = document.createElement('option');
                option.value = admin.id; // Use admin ID as the value
                option.textContent = `${admin.first_name} ${admin.last_name}`; // Display full name
                adminSelect.appendChild(option);
            });
        }
    };

    request.onerror = function (event) {
        console.error('Error loading admins:', event.target.error);
    };
}

// Helper function to open the database (Promise-based)
function getDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("AdminsDB", 1);

        request.onsuccess = function (event) {
            resolve(event.target.result);
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// Function to store login details
async function storeLoginDetails(username, password) {
    if (!db1) {
        console.error("Database not initialized.");
        return;
    }
    const transaction = db1.transaction(['userLogins'], 'readwrite');
    const objectStore = transaction.objectStore('userLogins');

    const hashedPassword = await hashPassword(password);

    const request = objectStore.add({ username, password: hashedPassword });

    request.onsuccess = function () {
        console.log("User login details saved successfully.");
    };

    request.onerror = function (event) {
        console.error("Error saving login details:", event.target.error);
    };
}

// Example password hashing function (replace with a secure library in production)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

// Function to validate login
async function validateAdminLogin() {
    if (!db1) {
        console.error("Database not initialized.");
        return false;
    }
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const hashedPassword = await hashPassword(password);

    const transaction = db1.transaction(['userLogins'], 'readonly');
    const objectStore = transaction.objectStore('userLogins');
    const request = objectStore.getAll();

    request.onsuccess = function (event) {
        const users = event.target.result;
        const user = users.find(u => u.username === username && u.password === hashedPassword);  // matches user password with hashed password, and their username

        // if user found
        if (user) {
            alert("Login successful");  // display alert to user saying successful
            localStorage.setItem('isAdminLoggedIn', 'true');  // set in local storage - similar to a cookie
            localStorage.setItem('loggedInAdminUsername', username);  // set in local storage the username of current logged in admin user
            localStorage.setItem('loggedInAdminID', user.id); // set in local storage the logged in admin's ID using OOP to access this value
            window.location.href = "admin.html";  // redirect
        } else {
            alert("Invalid username or password.");  // display msg to user saying invalid login details if user not found based on inputted login details
        }
    };

    // error handling
    request.onerror = function (event) {
        console.error("Error validating login", event.target.error);
    };

    return false;
}

// Create admin login details
async function createAdminLoginDetails() {
    let adminId = document.getElementById('adminSelect').value;   // get value of inputted/selected value into the adminSelect
    let password = document.getElementById('password').value;  // get value of password form field and store as variable here
    const hashedPassword = await hashPassword(password);  // hash password for security reasons

    let transaction = db1.transaction(['admins', 'userLogins'], 'readwrite');  // read write permissions
    let adminStore = transaction.objectStore('admins');  // access object store called logins
    let loginStore = transaction.objectStore('userLogins');  // access object store called userLogins

    let adminRequest = adminStore.get(parseInt(adminId));  // convert admin ID to integer and get from object store

    adminRequest.onsuccess = function(event) {
        let admin = event.target.result;
        if (admin) {
            // use OOP to map form submitted data to fields within our DB
            let loginData = {
                id: adminId,
                username: admin.email,
                password: hashedPassword
            };

            // add new login details via loginData parameter to our object store in DB
            let loginRequest = loginStore.add(loginData);

            loginRequest.onsuccess = function() {
                alert("Admin login details created successfully!");  // display msg prompt to user
            };
        }
    };
}

// Start the database when the page loads
window.onload = function() {
    setupIndexedDB(); // Execute DB initialization
};
