(()=>{
  const menuItems = [
      { "text": "map", "url": "/m/" },
      { "text": "editor", "url": "/e/" },
      { "text": "warper", "url": "/w/" },
      { "text": "buildings", "url": "/h/" },
      { "text": "time", "url": "/t/" },
  ];

  function currentPrefix() {
    const loc = window.location.pathname;
    const i = loc.indexOf("/", 1);
    if (i < 0) {
      return loc;
    }
    return loc.substring(0, i+1);
  }

  function menuText(url) {
    for (let i = 0; i < menuItems.length; ++i) {
      if (menuItems[i].url == url) {
        return menuItems[i].text;
      }
    }
  }

  const appMenuDropDown = createDropDown();

  const appMenuDismiss = (e) => {
    appMenuDropDown.classList.add("kartta-app-menu-hidden");
    document.removeEventListener('click', appMenuDismiss);
    e.stopPropagation();
  }

  function createElement(tag, attrs, text) {
    const el = document.createElement(tag);
    if (attrs != undefined) {
      for (const [attr, value] of Object.entries(attrs)) {
        el.setAttribute(attr, value);
      }
    }
    if (text) {
      el.innerHTML = text;
    }
    return el;
  }

  function createAppMenu(appMenuDropDown) {
    const div = createElement("div", {
      "class": "kartta-app-menu-display-wrapper"
    });
    const appMenuDisplay = createAppMenuDisplay();
    appMenuDisplay.addEventListener('click', (e) => {
      appMenuDropDown.classList.remove("kartta-app-menu-hidden");
      e.stopPropagation();
      document.addEventListener('click', appMenuDismiss);
    });
    div.appendChild(appMenuDisplay);
    div.appendChild(appMenuDropDown);
    return div;
  }

  function createAppMenuDisplay() {
    const span1 = createElement("span", {
      "class": "kartta-app-name-menu-caret"
    });
    span1.appendChild(createElement("b", {
      "class": "kartta-caret"
    }));
    const span2 = createElement("span", {
      "class": "kartta-app-name-menu"
    }, menuText(currentPrefix()));

    const div = createElement("div", {
      "class": "kartta-app-menu-display",
      "id": "kartta-app-menu-display"
    });

    div.appendChild(span1);
    div.appendChild(span2);
    return div;
  }

  function createMenuItem(text, url) {
    const elA = document.createElement("a");
    elA.setAttribute("href", url);
    const elDiv = document.createElement("div");
    elDiv.setAttribute("class", "kartta-item");
    elDiv.innerHTML = text;
    elA.appendChild(elDiv);
    return elA;
  }

  function createDropDown() {
    const elDiv = document.createElement("div");
    elDiv.setAttribute("class", "kartta-app-menu-display-dropdown kartta-app-menu-hidden");
    elDiv.setAttribute("id", "kartta-app-menu-display-dropdown");
    menuItems.forEach(item => {
      elDiv.appendChild(createMenuItem(item.text, item.url));
    });
    return elDiv;
  }

  const appMenuPlaceholder = document.getElementById("kartta-app-menu-placeholder");

  appMenuPlaceholder.parentNode.insertBefore(createAppMenu(appMenuDropDown, "mappni"), appMenuPlaceholder);
  appMenuPlaceholder.parentNode.removeChild(appMenuPlaceholder);
})();
