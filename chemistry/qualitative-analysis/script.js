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
    { id: "NH4+", name: "Ammonium", formula: "NH₄+" },
    { id: "Co2+", name: "Cobalt(II)", formula: "Co²+", advanced: true },
    { id: "Ni2+", name: "Nickel(II)", formula: "Ni²+", advanced: true },
    { id: "Mn2+", name: "Manganese(II)", formula: "Mn²+", advanced: true },
    { id: "Cr3+", name: "Chromium(III)", formula: "Cr³+", advanced: true },
    { id: "Na+", name: "Sodium", formula: "Na+", advanced: true },
    { id: "K+", name: "Potassium", formula: "K+", advanced: true },
    { id: "Sr2+", name: "Strontium", formula: "Sr²+", advanced: true },
    { id: "Hg2+", name: "Mercury(II)", formula: "Hg²+", advanced: true },
    { id: "Cd2+", name: "Cadmium", formula: "Cd²+", advanced: true },
    { id: "As3+", name: "Arsenic(III)", formula: "As³+", advanced: true }
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
    { id: "warm-naoh", name: "Warm + NaOH", detail: "Ammonium test" },
    { id: "dmg", name: "DMG reagent", detail: "Nickel confirmation" },
    { id: "sulfide", name: "Sulfide test", detail: "Advanced theory only" }
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
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["A black Ag₂S precipitate forms (advanced sulfide-analysis reaction).", "#262626", "precipitate", "Black precipitate"]
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
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["A black PbS precipitate forms (advanced sulfide-analysis reaction).", "#262626", "precipitate", "Black precipitate"]
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
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["A black CuS precipitate forms (advanced sulfide-analysis reaction).", "#242424", "precipitate", "Black precipitate"]
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
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["A dark FeS precipitate forms (advanced sulfide-analysis reaction).", "#343434", "precipitate", "Dark precipitate"]
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
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["Sulfide reduces Fe³⁺ and may produce a dark precipitate and sulfur; this is not a selective test.", "#5a5348", "precipitate", "Dark precipitate"]
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
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["No simple precipitate in the simplified test conditions.", "#dce7ed", "clear", "No simple change"]
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
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["A white ZnS precipitate forms (advanced sulfide-analysis reaction).", "#efefec", "precipitate", "White precipitate"]
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
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["No precipitate in the simplified test conditions.", "#dce7ed", "clear", "No precipitate"]
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
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["No precipitate in the simplified test conditions.", "#dce7ed", "clear", "No precipitate"]
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
      "warm-naoh": ["NH₃ gas is released. Damp red litmus paper turns blue.", "#e5edf0", "clear", "Ammonia gas; litmus turns blue"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["No precipitate in the simplified test conditions.", "#dce7ed", "clear", "No precipitate"]
    },
    "Co2+": {
      hcl: ["No precipitate; the pink solution may become blue in concentrated chloride.", "#d58e9b", "clear", "Pink solution"],
      naoh: ["A blue precipitate forms and may become pink on standing.", "#718ac4", "precipitate", "Blue precipitate"],
      nh3: ["A blue precipitate forms; excess ammonia can produce a brownish complex.", "#6d83bb", "precipitate", "Blue precipitate"],
      carbonate: ["A pink or purple carbonate precipitate forms.", "#bb8297", "precipitate", "Pink-purple precipitate"],
      ki: ["No simple characteristic test result.", "#dce7ed", "clear", "No clear change"],
      thiocyanate: ["A blue complex may form, especially in suitable solvent conditions.", "#3276a8", "clear", "Blue complex (conditions matter)"],
      sulfate: ["No precipitate.", "#d58e9b", "clear", "Pink solution; no precipitate"],
      flame: ["No reliable characteristic flame colour in a routine classroom test.", "#dce7ed", "none", "No reliable flame colour"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["A black CoS precipitate forms (advanced sulfide-analysis reaction).", "#262626", "precipitate", "Black precipitate"]
    },
    "Ni2+": {
      hcl: ["No precipitate; the solution is commonly green.", "#82a975", "clear", "Green solution"],
      naoh: ["A green Ni(OH)₂ precipitate forms.", "#71985d", "precipitate", "Green precipitate"],
      nh3: ["A green precipitate forms; excess ammonia can give a blue-violet solution.", "#565da8", "clear", "Blue-violet in excess NH₃"],
      carbonate: ["A pale green NiCO₃ precipitate forms.", "#9caf83", "precipitate", "Pale green precipitate"],
      ki: ["No characteristic change.", "#82a975", "clear", "No change"],
      thiocyanate: ["No distinctive routine colour test.", "#82a975", "clear", "No clear change"],
      sulfate: ["No precipitate.", "#82a975", "clear", "Green solution; no precipitate"],
      flame: ["No reliable characteristic flame colour.", "#dce7ed", "none", "No reliable flame colour"],
      "warm-naoh": ["No ammonia gas is produced.", "#82a975", "clear", "No change"],
      dmg: ["A rose-red precipitate forms, characteristic of Ni²⁺ with dimethylglyoxime in suitable conditions.", "#c84769", "precipitate", "Rose-red precipitate"],
      sulfide: ["A black NiS precipitate forms (advanced sulfide-analysis reaction).", "#242424", "precipitate", "Black precipitate"]
    },
    "Mn2+": {
      hcl: ["No precipitate; a very pale pink solution may be seen.", "#d7c3c6", "clear", "Very pale pink solution"],
      naoh: ["A pale precipitate forms and darkens brown in air.", "#9c8975", "precipitate", "Pale precipitate, browns in air"],
      nh3: ["A pale precipitate forms and may darken on standing.", "#a69482", "precipitate", "Pale precipitate"],
      carbonate: ["A pale pink or off-white MnCO₃ precipitate forms.", "#d4c6c5", "precipitate", "Pale pink precipitate"],
      ki: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      thiocyanate: ["No characteristic blood-red colour.", "#dce7ed", "clear", "No change"],
      sulfate: ["No precipitate.", "#d7c3c6", "clear", "No precipitate"],
      flame: ["No reliable characteristic flame colour in a routine test.", "#dce7ed", "none", "No reliable flame colour"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["A flesh-coloured MnS precipitate forms.", "#c78c75", "precipitate", "Flesh-coloured precipitate"]
    },
    "Cr3+": {
      hcl: ["No precipitate; chromium(III) solutions may be green or violet.", "#628c6e", "clear", "Green/violet solution"],
      naoh: ["A grey-green Cr(OH)₃ precipitate forms and dissolves in excess NaOH to a green solution.", "#718978", "precipitate", "Grey-green precipitate; dissolves in excess"],
      nh3: ["A grey-green precipitate forms and remains in excess ammonia.", "#718978", "precipitate", "Grey-green precipitate"],
      carbonate: ["A grey-green hydroxide precipitate may form with carbon dioxide release.", "#718978", "precipitate", "Grey-green precipitate"],
      ki: ["No simple characteristic result.", "#628c6e", "clear", "No clear change"],
      thiocyanate: ["No characteristic blood-red colour.", "#628c6e", "clear", "No blood-red colour"],
      sulfate: ["No precipitate.", "#628c6e", "clear", "No precipitate"],
      flame: ["No reliable characteristic flame colour.", "#dce7ed", "none", "No reliable flame colour"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#628c6e", "clear", "No red precipitate"],
      sulfide: ["No simple sulfide precipitation under the conditions represented here.", "#628c6e", "clear", "No simple change"]
    },
    "Na+": {
      hcl: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      naoh: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      nh3: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      carbonate: ["No precipitate; sodium salts remain soluble.", "#dce7ed", "clear", "No precipitate"],
      ki: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      thiocyanate: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      sulfate: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      flame: ["An intense yellow flame is characteristic of Na⁺.", "#f5d735", "yellow", "Bright yellow flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["No precipitate; sodium salts are soluble.", "#dce7ed", "clear", "No precipitate"]
    },
    "K+": {
      hcl: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      naoh: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      nh3: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      carbonate: ["No precipitate; potassium salts remain soluble.", "#dce7ed", "clear", "No precipitate"],
      ki: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      thiocyanate: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      sulfate: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      flame: ["A lilac flame is characteristic; sodium contamination can mask it.", "#a984ce", "lilac", "Lilac flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["No precipitate; potassium salts are soluble.", "#dce7ed", "clear", "No precipitate"]
    },
    "Sr2+": {
      hcl: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      naoh: ["Little or no precipitate in dilute solution.", "#dce7ed", "clear", "Little or no precipitate"],
      nh3: ["No precipitate.", "#dce7ed", "clear", "No precipitate"],
      carbonate: ["A white SrCO₃ precipitate forms.", "#efefec", "precipitate", "White precipitate"],
      ki: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      thiocyanate: ["No characteristic change.", "#dce7ed", "clear", "No change"],
      sulfate: ["A white SrSO₄ precipitate forms.", "#f2f2ef", "precipitate", "White precipitate"],
      flame: ["A crimson-red flame is characteristic of Sr²⁺.", "#d7434e", "red", "Crimson-red flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["No precipitate in the simplified test conditions.", "#dce7ed", "clear", "No precipitate"]
    },
    "Hg2+": {
      hcl: ["No precipitate with dilute chloride under the conditions represented.", "#dce7ed", "clear", "No precipitate"],
      naoh: ["A yellow to red-brown HgO precipitate forms.", "#c28b45", "precipitate", "Yellow/red-brown precipitate"],
      nh3: ["A pale precipitate may form depending on the counter-ion; this is not a reliable stand-alone identification.", "#e8e5dc", "precipitate", "Pale precipitate (counter-ion dependent)"],
      carbonate: ["A basic mercury(II) precipitate may form; result depends on conditions.", "#c4b989", "precipitate", "Pale precipitate (conditions matter)"],
      ki: ["A scarlet HgI₂ precipitate forms and dissolves in excess iodide.", "#d94335", "precipitate", "Scarlet precipitate"],
      thiocyanate: ["A pale precipitate may form; not a selective test.", "#e8e5dc", "precipitate", "Pale precipitate"],
      sulfate: ["No reliable classroom precipitation test.", "#dce7ed", "clear", "No clear change"],
      flame: ["No characteristic flame test.", "#dce7ed", "none", "No characteristic flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["A black HgS precipitate forms. Mercury compounds are highly toxic.", "#242424", "precipitate", "Black precipitate"]
    },
    "Cd2+": {
      hcl: ["No precipitate with dilute chloride.", "#dce7ed", "clear", "No precipitate"],
      naoh: ["A white Cd(OH)₂ precipitate forms and does not dissolve in excess NaOH.", "#ececec", "precipitate", "White precipitate; insoluble in excess"],
      nh3: ["A white precipitate forms and can dissolve in excess ammonia.", "#ececec", "precipitate", "White precipitate; may dissolve in excess"],
      carbonate: ["A white CdCO₃ precipitate forms.", "#eeeeea", "precipitate", "White precipitate"],
      ki: ["No distinctive simple result.", "#dce7ed", "clear", "No clear change"],
      thiocyanate: ["No selective classroom result.", "#dce7ed", "clear", "No clear change"],
      sulfate: ["No precipitate in dilute solution.", "#dce7ed", "clear", "No precipitate"],
      flame: ["No characteristic flame test.", "#dce7ed", "none", "No characteristic flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["A yellow CdS precipitate forms. Cadmium compounds are highly toxic.", "#e8d52c", "precipitate", "Yellow precipitate"]
    },
    "As3+": {
      hcl: ["No precipitate in this simplified test.", "#dce7ed", "clear", "No precipitate"],
      naoh: ["Arsenite species remain dissolved under alkaline conditions; this is not a safe practical test.", "#dce7ed", "clear", "No visible precipitate"],
      nh3: ["No reliable visible change in this simplified test.", "#dce7ed", "clear", "No clear change"],
      carbonate: ["No reliable visible change in this simplified test.", "#dce7ed", "clear", "No clear change"],
      ki: ["No simple selective result.", "#dce7ed", "clear", "No clear change"],
      thiocyanate: ["No characteristic test.", "#dce7ed", "clear", "No clear change"],
      sulfate: ["No characteristic precipitate.", "#dce7ed", "clear", "No precipitate"],
      flame: ["No characteristic flame test.", "#dce7ed", "none", "No characteristic flame"],
      "warm-naoh": ["No ammonia gas is produced.", "#dce7ed", "clear", "No change"],
      dmg: ["No characteristic nickel-DMG precipitate.", "#dce7ed", "clear", "No red precipitate"],
      sulfide: ["A yellow arsenic sulfide precipitate is a historical group-analysis observation. Arsenic compounds are extremely toxic; simulation only.", "#e4d32d", "precipitate", "Yellow precipitate (simulation only)"]
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
    const appearance = {
      "Cu2+": ["#78b5df", "Blue solution"],
      "Fe2+": ["#a5c8aa", "Pale green solution"],
      "Fe3+": ["#b98a48", "Yellow-brown solution"],
      "Co2+": ["#d58e9b", "Pink solution"],
      "Ni2+": ["#82a975", "Green solution"],
      "Mn2+": ["#d7c3c6", "Very pale pink solution"],
      "Cr3+": ["#628c6e", "Green or violet solution"]
    };
    const [initialColour, initialLabel] = appearance[currentCation()] || ["rgba(208, 224, 235, .15)", "Clear, colourless solution"];
    solution.style.background = initialColour;
    precipitate.className = "precipitate";
    precipitate.style.background = "transparent";
    precipitate.style.height = "0";
    flame.className = "flame";
    flame.style.background = "transparent";
    tubeLabel.textContent = initialLabel;
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
      const flameColours = {
        green: "#87b95b",
        orange: "#df7a35",
        bluewhite: "#bfcbe0",
        yellow: "#f5d735",
        lilac: "#a984ce",
        red: "#d7434e"
      };
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
  resetVisual();
  renderReagents();
  renderCations();
  applyTheme();
})();
