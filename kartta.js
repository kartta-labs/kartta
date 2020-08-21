const appMenuDropDown = document.getElementById("app-menu-display-dropdown");
const appMenuDisplay = document.getElementById("app-menu-display");

const appMenuDismiss = (e) => {
  appMenuDropDown.classList.add("app-menu-hidden");
  document.removeEventListener('click', appMenuDismiss);
  e.stopPropagation();
}

appMenuDisplay.addEventListener('click', (e) => {

  appMenuDropDown.classList.remove("app-menu-hidden");
  e.stopPropagation();
  document.addEventListener('click', appMenuDismiss);
});
