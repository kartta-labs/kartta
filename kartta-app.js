(()=>{
  const menuItems = [
      { "text": "map", "url": "/m/" },
      { "text": "editor", "url": "/e/" },
      { "text": "warper", "url": "/w/" },
      { "text": "3d models", "url": "/h/" },
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
    return null;
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

  function createAppMenu(appMenuDropDown, appMenuDismiss) {
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

  function installAppMenu() {
    const appMenuPlaceholder = document.getElementById("kartta-app-menu");

    if (!appMenuPlaceholder) {
      return;
    }

    const appMenuDropDown = createDropDown();

    const appMenuDismiss = (e) => {
      appMenuDropDown.classList.add("kartta-app-menu-hidden");
      document.removeEventListener('click', appMenuDismiss);
      e.stopPropagation();
      e.preventDefault();
      return false;
    }

    const a = createElement("a", {
      "href": "/"
    });
    const picture = createElement("picture");
    picture.appendChild(createElement("source", {
      "srcset": "/m/assets/site-logo.png",
      "type": "image/png"
    }));
    picture.appendChild(createElement("img", {
      "srcset": "/m/assets/site-logo.png",
      "alt": "kartta labs logo",
      "class": "kartta-app-menu-logo",
      "src": "/m/assets/site-logo.png"
    }));
    a.appendChild(picture);


    const appMenuWrapper = createElement("div", {
      "class": "kartta-app-menu-wrapper"
    });
    appMenuWrapper.appendChild(a);
    appMenuWrapper.appendChild(createAppMenu(appMenuDropDown, appMenuDismiss));

    appMenuPlaceholder.parentNode.insertBefore(appMenuWrapper, appMenuPlaceholder);
    appMenuPlaceholder.parentNode.removeChild(appMenuPlaceholder);
  }

  function writeCookie(name, value) {
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + "; path=/";
  }

  function readCookie(name) {
    const name_equals = encodeURIComponent(name) + "=";
    const words = document.cookie.split(';');
    for (var i = 0; i < words.length; i++) {
      let c = words[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(name_equals) === 0) {
        return decodeURIComponent(c.substring(name_equals.length, c.length));
      }
    }
    return null;
  }

  function createCookieBar() {
    const outerDiv = createElement("div", {
      "class": "kartta-cookie-bar"
    });
    const leftDiv = createElement("div", {
      "class": "kartta-cookie-bar-left"
    }, "This site uses cookies from Google to deliver its services and to analyze traffic.");
    leftDiv.appendChild(createElement("a", {
      "class": "kartta-cookie-bar-learn-more-link",
      "href": "https://policies.google.com/technologies/cookies"
    }, "Learn more."));
    const rightDiv = createElement("div", {
      "class": "kartta-cookie-bar-right"
    });
    rightDiv.appendChild(createElement("a", {
      "class": "kartta-cookie-bar-ok-link",
      "href": "javascript:void(0)"
    }, "Ok, Got it."));
    rightDiv.addEventListener('click', (e) => {
      writeCookie("kartta_allow_cookies", "yes");
      outerDiv.parentNode.removeChild(outerDiv);
    });
    outerDiv.appendChild(leftDiv);
    outerDiv.appendChild(rightDiv);
    return outerDiv;
  }

  function installCookieBar() {
    const cookieBarPlaceholder = document.getElementById("kartta-app-cookie-bar");
    if (!cookieBarPlaceholder) {
      return;
    }
    if (readCookie("kartta_allow_cookies") != "yes") {
      cookieBarPlaceholder.parentNode.insertBefore(createCookieBar(), cookieBarPlaceholder);
    }
    cookieBarPlaceholder.parentNode.removeChild(cookieBarPlaceholder);
  }

  document.addEventListener("DOMContentLoaded", () => {
    installAppMenu();
    installCookieBar();
  });

})();
