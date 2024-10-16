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
