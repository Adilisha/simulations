(() => {
  const themeToggle = document.querySelector("#theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const sampleSelect = document.querySelector("#sample");
  const solution = document.querySelector("#solution");
  const precipitate = document.querySelector("#precipitate");
  const flame = document.querySelector("#flame");
  const tubeLabel = document.querySelector("#tube-label");
  const observation = document.querySelector("#observation");
  const testCount = document.querySelector("#test-count");
  const reagentGrid = document.querySelector("#reagents");
  const identityGrid = document.querySelector("#identity-grid");
  const checkButton = document.querySelector("#check-answer");
  const resetButton = document.querySelector("#reset");
  const result = document.querySelector("#result");

  let theme = localStorage.getItem("cation-theme") === "dark" ? "dark" : "light";
  let mysteryCation = "";
  let observations = [];
  let selectedCation = "";

  const cations = [
    { id: "Ag+", name: "Silver", formula: "Ag+" },
    { id: "Pb2+", name: "Lead", formula: "Pb²+" },
    { id: "Cu2+", name: "Copper", formula: "Cu²+" },
    { id: "Fe2+", name: "Iron(II)", formula: "Fe²+" },
    { id: "Fe3+", name: "Iron(III)", formula: "Fe³+" },
    { id: "Al3+", name: "Aluminium", formula: "Al³+" },
    { id: "Zn2+", name: "Zinc", formula: "Zn²+" },
    { id: "Ca2+", name: "Calcium", formula: "Ca²+" },
    { id: "Ba2+", name: "Barium", formula: "Ba²+" },
    { id: "NH4+", name: "Ammonium", formula: "NH₄+" }
  ];

  const reagents = [
    { id: "hcl", name: "Dilute HCl", detail: "Acid reagent" },
    { id: "naoh", name: "NaOH", detail: "Add, then excess" },
    { id: "nh3", name: "NH₃(aq)", detail: "Add, then excess" },
    { id: "carbonate", name: "Na₂CO₃", detail: "Carbonate test" },
    { id: "ki", name: "KI", detail: "Iodide test" },
    { id: "thiocyanate", name: "KSCN", detail: "Iron(III) test" },
    { id: "sulfate", name: "Na₂SO₄", detail: "Sulphate test" },
    { id: "flame", name: "Flame test", detail: "Clean nichrome wire" },
    { id: "warm-naoh", name: "Warm + NaOH", detail: "Ammonium test" }
  ];

  const outcomes = {
    "Ag+": {
      hcl: ["A white precipitate of AgCl forms.", "#f1f2f2", "precipitate", "White precipitate"],
      naoh: ["A brown precipitate of Ag₂O forms.", "#a77745", "precipitate", "Brown precipitate"],
      nh3: ["A brown Ag₂O precipitate can dissolve in excess NH₃ to give a colourless complex.", "#dce7ed", "clear", "Dissolves in excess NH₃"],
      carbonate: ["A pale yellow or off-white Ag₂CO₃ precipitate forms.", "#ded3a3", "precipitate", "Off-white precipitate"],
      ki: ["A pale yellow AgI precipitate forms.", "#ddd98a", "precipitate", "Yellow precipitate"],
      thiocyanate: ["No characteristic precipitate or colour change.", "#dce7ed", "clear", "No change"],
      sulfate: ["No significant change.", "#dce7ed", "clear", "No change"],
      flame: ["No distinct characteristic flame colour.", "#dce7ed", "none", "No characteristic flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"]
    },
    "Pb2+": {
      hcl: ["A white precipitate of PbCl₂ forms; it can dissolve on warming.", "#f1f2f2", "precipitate", "White precipitate"],
      naoh: ["A white Pb(OH)₂ precipitate forms and dissolves in excess NaOH.", "#ececec", "precipitate", "White precipitate; dissolves in excess"],
      nh3: ["A white Pb(OH)₂ precipitate forms and does not dissolve in excess NH₃.", "#ececec", "precipitate", "White precipitate; insoluble in excess"],
      carbonate: ["A white PbCO₃ precipitate forms.", "#eeeeea", "precipitate", "White precipitate"],
      ki: ["A bright yellow PbI₂ precipitate forms.", "#f4db28", "precipitate", "Yellow precipitate"],
      thiocyanate: ["No characteristic colour change.", "#dce7ed", "clear", "No change"],
      sulfate: ["A white PbSO₄ precipitate forms.", "#f2f2ef", "precipitate", "White precipitate"],
      flame: ["The flame is often weakly blue-white.", "#bfcbe0", "bluewhite", "Blue-white flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"]
    },
    "Cu2+": {
      hcl: ["No precipitate; the solution remains blue-green.", "#87b9b2", "clear", "No precipitate"],
      naoh: ["A pale blue Cu(OH)₂ precipitate forms.", "#74acd6", "precipitate", "Blue precipitate"],
      nh3: ["A pale blue precipitate forms, then dissolves in excess NH₃ to give a deep blue solution.", "#315fcd", "clear", "Blue solution in excess NH₃"],
      carbonate: ["A blue-green basic copper carbonate precipitate forms.", "#57aaa1", "precipitate", "Blue-green precipitate"],
      ki: ["A brown solution and white CuI precipitate may form.", "#c8aa72", "precipitate", "Brown solution / precipitate"],
      thiocyanate: ["No strongly characteristic change; Cu(I/II) chemistry can be complex.", "#dce7ed", "clear", "No strong change"],
      sulfate: ["No precipitate; the blue solution remains.", "#78b5df", "clear", "Blue solution"],
      flame: ["A blue-green flame may be seen.", "#4ab8ad", "green", "Blue-green flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"]
    },
    "Fe2+": {
      hcl: ["No precipitate; the pale green solution remains.", "#a5c8aa", "clear", "No precipitate"],
      naoh: ["A dirty green Fe(OH)₂ precipitate forms; it may turn brown in air.", "#719c79", "precipitate", "Green precipitate"],
      nh3: ["A dirty green Fe(OH)₂ precipitate forms.", "#719c79", "precipitate", "Green precipitate"],
      carbonate: ["A green FeCO₃ precipitate forms.", "#73a47a", "precipitate", "Green precipitate"],
      ki: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      thiocyanate: ["No strong blood-red colour is produced.", "#dce7ed", "clear", "No strong change"],
      sulfate: ["No precipitate.", "#a5c8aa", "clear", "No precipitate"],
      flame: ["No strong characteristic flame colour.", "#dce7ed", "none", "No characteristic flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"]
    },
    "Fe3+": {
      hcl: ["No precipitate; the yellow-brown solution remains.", "#b98a48", "clear", "No precipitate"],
      naoh: ["A rusty brown Fe(OH)₃ precipitate forms.", "#a85f3d", "precipitate", "Brown precipitate"],
      nh3: ["A rusty brown Fe(OH)₃ precipitate forms.", "#a85f3d", "precipitate", "Brown precipitate"],
      carbonate: ["A brown Fe(OH)₃ precipitate may form with effervescence.", "#a85f3d", "precipitate", "Brown precipitate"],
      ki: ["Iodide is oxidised; a brown iodine colour may appear.", "#9c7042", "clear", "Brown colour"],
      thiocyanate: ["An intense blood-red FeSCN²+ complex forms.", "#a93232", "clear", "Blood-red solution"],
      sulfate: ["No precipitate.", "#b98a48", "clear", "No precipitate"],
      flame: ["No strong characteristic flame colour.", "#dce7ed", "none", "No characteristic flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"]
    },
    "Al3+": {
      hcl: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      naoh: ["A white Al(OH)₃ precipitate forms and dissolves in excess NaOH.", "#ececec", "precipitate", "White precipitate; dissolves in excess"],
      nh3: ["A white Al(OH)₃ precipitate forms and is insoluble in excess NH₃.", "#ececec", "precipitate", "White precipitate; insoluble in excess"],
      carbonate: ["A white Al(OH)₃ precipitate may form with effervescence.", "#ececec", "precipitate", "White precipitate"],
      ki: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      thiocyanate: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      sulfate: ["No precipitate.", "#dce7ed", "clear", "No change"],
      flame: ["No characteristic flame colour.", "#dce7ed", "none", "No characteristic flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"]
    },
    "Zn2+": {
      hcl: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      naoh: ["A white Zn(OH)₂ precipitate forms and dissolves in excess NaOH.", "#ececec", "precipitate", "White precipitate; dissolves in excess"],
      nh3: ["A white Zn(OH)₂ precipitate forms and dissolves in excess NH₃.", "#ececec", "precipitate", "White precipitate; dissolves in excess"],
      carbonate: ["A white ZnCO₃ precipitate forms.", "#eeeeea", "precipitate", "White precipitate"],
      ki: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      thiocyanate: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      sulfate: ["No precipitate.", "#dce7ed", "clear", "No change"],
      flame: ["No strong characteristic flame colour.", "#dce7ed", "none", "No characteristic flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"]
    },
    "Ca2+": {
      hcl: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      naoh: ["Usually no precipitate in dilute solution; a slight Ca(OH)₂ precipitate may form.", "#dce7ed", "clear", "Little or no precipitate"],
      nh3: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      carbonate: ["A white CaCO₃ precipitate forms.", "#efefec", "precipitate", "White precipitate"],
      ki: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      thiocyanate: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      sulfate: ["A slight white CaSO₄ precipitate may form in concentrated solution.", "#efefec", "slight", "Possibly slight white precipitate"],
      flame: ["An orange-red flame is seen.", "#df7a35", "orange", "Orange-red flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"]
    },
    "Ba2+": {
      hcl: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      naoh: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      nh3: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      carbonate: ["A white BaCO₃ precipitate forms.", "#efefec", "precipitate", "White precipitate"],
      ki: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      thiocyanate: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      sulfate: ["A dense white BaSO₄ precipitate forms.", "#f4f4f1", "precipitate", "Dense white precipitate"],
      flame: ["A pale apple-green flame is seen.", "#87b95b", "green", "Apple-green flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"]
    },
    "NH4+": {
      hcl: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      naoh: ["No precipitate. Gently warming releases NH₃ gas.", "#dce7ed", "clear", "No precipitate; smell/ammonia test"],
      nh3: ["No reaction.", "#dce7ed", "clear", "No change"],
      carbonate: ["No characteristic precipitate.", "#dce7ed", "clear", "No change"],
      ki: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      thiocyanate: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      sulfate: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      flame: ["No characteristic persistent flame colour.", "#dce7ed", "none", "No characteristic flame"],
      "warm-naoh": ["NH₃ gas is released. Damp red litmus paper turns blue.", "#e5edf0", "clear", "Ammonia gas; litmus turns blue"]
    }
  };

  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === "dark" ? "Use light theme" : "Use dark theme";
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
    themeColor.content = theme === "dark" ? "#111827" : "#f4f7fb";
  }

  function pickMystery() {
    const available = cations.map((cation) => cation.id);
    const previous = mysteryCation;
    let choices = available.filter((id) => id !== previous);
    mysteryCation = choices[Math.floor(Math.random() * choices.length)];
  }

  function resetVisual() {
    solution.style.height = "155px";
    solution.style.background = "rgba(208, 224, 235, .15)";
    precipitate.className = "precipitate";
    precipitate.style.background = "transparent";
    precipitate.style.height = "0";
    flame.className = "flame";
    flame.style.background = "transparent";
    tubeLabel.textContent = "Clear, colourless solution";
  }

  function resetExperiment() {
    observations = [];
    selectedCation = "";
    if (sampleSelect.value === "mystery") pickMystery();
    resetVisual();
    observation.textContent = "Choose a reagent to begin.";
    testCount.textContent = "0 observations";
    result.className = "result";
    result.textContent = "";
    document.querySelectorAll(".identity").forEach((button) => button.classList.remove("selected"));
    checkButton.disabled = true;
  }

  function currentCation() {
    return sampleSelect.value === "mystery" ? mysteryCation : sampleSelect.value;
  }

  function addReagent(reagent) {
    const cation = currentCation();
    const [text, colour, kind, shortLabel] = outcomes[cation][reagent.id];
    observations.push({ reagent: reagent.name, result: text });
    observation.textContent = text;
    testCount.textContent = `${observations.length} observation${observations.length === 1 ? "" : "s"}`;

    resetVisual();
    if (kind === "precipitate" || kind === "slight") {
      precipitate.className = "precipitate visible";
      precipitate.style.background = colour;
      if (kind === "slight") precipitate.style.height = "20px";
      solution.style.background = "rgba(208, 224, 235, .12)";
      tubeLabel.textContent = shortLabel;
    } else if (kind === "clear") {
      solution.style.background = colour;
      tubeLabel.textContent = shortLabel;
    } else if (kind === "none") {
      tubeLabel.textContent = shortLabel;
    } else {
      solution.style.background = colour;
      tubeLabel.textContent = shortLabel;
    }

    if (reagent.id === "flame") {
      flame.className = "flame visible";
      const flameColours = { green: "#87b95b", orange: "#df7a35", bluewhite: "#bfcbe0" };
      flame.style.background = flameColours[kind] || "transparent";
    }
  }

  function renderReagents() {
    reagentGrid.innerHTML = "";
    reagents.forEach((reagent) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "reagent";
      button.innerHTML = `<strong>${reagent.name}</strong><span>${reagent.detail}</span>`;
      button.addEventListener("click", () => addReagent(reagent));
      reagentGrid.appendChild(button);
    });
  }

  function renderCations() {
    identityGrid.innerHTML = "";
    cations.forEach((cation) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "identity";
      button.textContent = cation.formula;
      button.title = cation.name;
      button.addEventListener("click", () => {
        selectedCation = cation.id;
        document.querySelectorAll(".identity").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        checkButton.disabled = false;
        result.className = "result";
        result.textContent = "";
      });
      identityGrid.appendChild(button);
    });
  }

  themeToggle.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("cation-theme", theme);
    applyTheme();
  });

  sampleSelect.addEventListener("change", resetExperiment);
  resetButton.addEventListener("click", resetExperiment);

  checkButton.addEventListener("click", () => {
    if (!selectedCation) return;
    const actual = cations.find((cation) => cation.id === currentCation());
    const guess = cations.find((cation) => cation.id === selectedCation);
    if (selectedCation === currentCation()) {
      result.className = "result correct";
      result.textContent = `Correct — this sample contains ${actual.name} ions (${actual.formula}).`;
    } else {
      result.className = "result incorrect";
      result.textContent = `Not quite. ${guess.name} (${guess.formula}) was not the sample. Continue comparing observations or reset for a new unknown.`;
    }
  });

  pickMystery();
  renderReagents();
  renderCations();
  applyTheme();
})();
