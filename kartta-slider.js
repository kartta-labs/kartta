function createKarttaSlider(options) {

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

  function createTextNode(text) {
    return document.createTextNode(text);
  }

  //  <div class="kartta-slider-container">
  //    <div class="kartta-slider-text">Year: <label class="kartta-year-label">1850</label></div>
  //    <input class="kartta-year-slider" type="range" min="1800" max="1950" step="10" value="1850" />
  //  </div>
  const container = createElement("div", {
    class: "kartta-slider-container"
  });
  const labelWrapper = createElement("div", {
    class: "kartta-slider-text"
  });
  labelWrapper.appendChild(createTextNode("Year:"));
  const label = createElement("label", {
    class: "kartta-year-label"
  }, options.value);
  labelWrapper.appendChild(label);
  container.appendChild(labelWrapper);
  const input = createElement("input", {
    class: "kartta-year-slider",
    type: "range",
    min: options.minValue,
    max: options.maxValue,
    step: options.stepSize,
    value: options.value
  });
  container.appendChild(input);
  const handleChange = (e) => {
    const year = e.target.value;
    label.innerText = year;
    if (options.change) {
      options.change(year);
    }
  };
  input.addEventListener('change', handleChange);
  input.addEventListener('input', handleChange);

  if (options.domElementToReplace) {
    options.domElementToReplace.parentNode.insertBefore(container, options.domElementToReplace);
    options.domElementToReplace.parentNode.removeChild(options.domElementToReplace);
  }
  return container;
}
