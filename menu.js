// Logout function (defined globally)
function logout() {
    // Remove login status from localStorage
    localStorage.removeItem("isDoctorLoggedIn");
    localStorage.removeItem("isPatientLoggedIn");
    localStorage.removeItem("isAdminLoggedIn");

    // Redirect to the login page
    window.location.href = "doctor-login.html";
}

function toggleNav() {
    var navToggle = document.getElementById("header_navigation");
    if (navToggle.style.display === "block") {
      navToggle.style.display = "none";
    } else {
      navToggle.style.display = "block";
    }
  }

// Check if the user is logged in and show menu parts
if (localStorage.getItem("isAdminLoggedIn") || localStorage.getItem("isPatientLoggedIn") || localStorage.getItem("isDoctorLoggedIn")) {
    const adminOnly = document.getElementsByClassName("showloggedin");

    // Convert to an array and loop through
    Array.from(adminOnly).forEach(element => {
        element.style.display = "block"; // Show the menu item
    });
}
// If Admin is logged in
if (localStorage.getItem("isAdminLoggedIn")) {
    const adminOnly = document.getElementsByClassName("adminonly");

    // Convert to an array and loop through
    Array.from(adminOnly).forEach(element => {
        element.style.display = "block"; // Show the menu item
    });
}
// If Patient is logged in
if (localStorage.getItem("isPatientLoggedIn")) {
    const adminOnly = document.getElementsByClassName("patientonly");

    // Convert to an array and loop through
    Array.from(adminOnly).forEach(element => {
        element.style.display = "block"; // Show the menu item
    });
}
// If Doctor is logged in
if (localStorage.getItem("isDoctorLoggedIn") || localStorage.getItem("isAdminLoggedIn") ) {
    const adminOnly = document.getElementsByClassName("docandadmins");

    // Convert to an array and loop through
    Array.from(adminOnly).forEach(element => {
        element.style.display = "block"; // Show the menu item
    });
}
else {
    const adminOnly = document.getElementsByClassName("loggedoutall");

    // Convert to an array and loop through
    Array.from(adminOnly).forEach(element => {
        element.style.display = "block"; // Show the menu item
    });
}


// DOMCONTENTLOADED: run the following code when the html page has been fully loaded
// JavaScript to toggle the submenu
document.addEventListener('DOMContentLoaded', function () {
    const toggleButtons = document.querySelectorAll('.toggleMenu');
    const submenus = document.querySelectorAll('.submenu');

    toggleButtons.forEach((button, index) => {
        button.addEventListener('click', function () {
            const submenu = submenus[index];
            submenu.classList.toggle('show'); // Toggle the 'show' class to display or hide the submenu
        });
    });
});
