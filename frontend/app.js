// ============================================================
// ENDOCONSORT AI
// Frontend Application Logic
// ============================================================

const API_BASE = "http://127.0.0.1:8002";


// ============================================================
// GLOBAL STATE
// ============================================================

const designState = {
    plantId: null,
    plantName: "",

    stress: "",

    traitIds: [],
    traitNames: [],

    strainIds: [],
    strainNames: [],

    consortiumSize: 2,

    weights: {
        trait: 50,
        compatibility: 30,
        drought: 15,
        literature: 5
    }
};


// ============================================================
// CURRENT STEP
// ============================================================

let currentStep = 1;


// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeApplication();
});


// ============================================================
// INITIALIZATION
// ============================================================

async function initializeApplication() {

    console.log("Starting EndoConsort AI...");

    updateServerStatus("checking");
    updateDatabaseStatus("checking");

    updateWeights();

    try {

        await checkServer();

        await loadPlants();

        await loadDesignOptions();

        setDefaultConsortiumSize();

        console.log(
            "EndoConsort AI initialized successfully."
        );

    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        updateServerStatus("offline");
        updateDatabaseStatus("offline");
    }
}


// ============================================================
// SERVER STATUS
// ============================================================

async function checkServer() {

    try {

        const response = await fetch(
            `${API_BASE}/health`
        );

        if (!response.ok) {
            throw new Error(
                "Backend unavailable"
            );
        }

        const data = await response.json();

        console.log(
            "Health:",
            data
        );

        updateServerStatus("online");

        try {

            const dbResponse = await fetch(
                `${API_BASE}/database`
            );

            if (dbResponse.ok) {

                const dbData =
                    await dbResponse.json();

                console.log(
                    "Database:",
                    dbData
                );

                updateDatabaseStatus("online");

            } else {

                updateDatabaseStatus("offline");
            }

        } catch (error) {

            console.error(
                "Database check failed:",
                error
            );

            updateDatabaseStatus("offline");
        }

    } catch (error) {

        console.error(
            "Server check failed:",
            error
        );

        updateServerStatus("offline");

        throw error;
    }
}


function updateServerStatus(status) {

    const element =
        document.getElementById(
            "serverStatus"
        );

    if (!element) {
        return;
    }

    if (status === "online") {

        element.textContent =
            "● Server Online";

        element.classList.remove(
            "offline"
        );

        element.classList.add(
            "online"
        );

    } else if (status === "offline") {

        element.textContent =
            "● Server Offline";

        element.classList.remove(
            "online"
        );

        element.classList.add(
            "offline"
        );

    } else {

        element.textContent =
            "● Checking Server...";
    }
}


function updateDatabaseStatus(status) {

    const element =
        document.getElementById(
            "databaseStatus"
        );

    if (!element) {
        return;
    }

    if (status === "online") {

        element.textContent =
            "● Database Connected";

        element.classList.remove(
            "offline"
        );

        element.classList.add(
            "online"
        );

    } else if (status === "offline") {

        element.textContent =
            "● Database Offline";

        element.classList.remove(
            "online"
        );

        element.classList.add(
            "offline"
        );

    } else {

        element.textContent =
            "● Checking Database...";
    }
}


// ============================================================
// LOAD PLANTS
// ============================================================

async function loadPlants() {

    const select =
        document.getElementById(
            "plantSelect"
        );

    if (!select) {
        console.error(
            "plantSelect element not found."
        );
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/plants`
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load plants."
            );
        }

        const data =
            await response.json();

        console.log(
            "Plants:",
            data
        );

        const plants =
            Array.isArray(data)
                ? data
                : data.plants || [];

        select.innerHTML = `
            <option value="">
                Select target plant
            </option>
        `;

        plants.forEach(plant => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                plant.plant_id;

            option.textContent =
                plant.scientific_name ||
                plant.common_name ||
                `Plant ${plant.plant_id}`;

            select.appendChild(
                option
            );
        });

        /*
         * Important:
         * Avoid adding duplicate event listeners.
         */
        select.onchange =
            handlePlantChange;

    } catch (error) {

        console.error(
            "Unable to load plants:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load plants
            </option>
        `;
    }
}


// ============================================================
// PLANT SELECTION
// ============================================================

async function handlePlantChange(event) {

    const plantId =
        Number(
            event.target.value
        );

    if (!plantId) {

        designState.plantId =
            null;

        designState.plantName =
            "";

        const info =
            document.getElementById(
                "plantInfo"
            );

        if (info) {
            info.innerHTML = "";
        }

        return;
    }

    designState.plantId =
        plantId;

    const selectedOption =
        event.target.options[
            event.target.selectedIndex
        ];

    /*
     * Set the plant name immediately.
     */
    designState.plantName =
        selectedOption.textContent.trim();

    try {

        const response =
            await fetch(
                `${API_BASE}/plants`
            );

        if (!response.ok) {
            throw new Error(
                "Unable to retrieve plant information."
            );
        }

        const data =
            await response.json();

        const plants =
            Array.isArray(data)
                ? data
                : data.plants || [];

        const plant =
            plants.find(
                item =>
                    Number(
                        item.plant_id
                    ) === plantId
            );

        if (plant) {

            designState.plantName =
                plant.scientific_name ||
                plant.common_name ||
                designState.plantName;

            displayPlantInfo(
                plant
            );
        }

    } catch (error) {

        console.error(
            "Plant information error:",
            error
        );
    }

    /*
     * Load stress options for the
     * selected plant.
     */
    await loadStressOptions();

    updateReview();

    console.log(
        "Selected plant:",
        designState.plantId,
        designState.plantName
    );
}


function displayPlantInfo(plant) {

    const info =
        document.getElementById(
            "plantInfo"
        );

    if (!info) {
        return;
    }

    info.innerHTML = `
        <strong>
            ${escapeHtml(
                plant.scientific_name ||
                plant.common_name ||
                "Selected plant"
            )}
        </strong>

        <span>
            ${escapeHtml(
                plant.common_name || ""
            )}
        </span>

        ${
            plant.crop_type
            ? `
                <span>
                    Crop type:
                    ${escapeHtml(
                        plant.crop_type
                    )}
                </span>
            `
            : ""
        }

        ${
            plant.description
            ? `
                <p>
                    ${escapeHtml(
                        plant.description
                    )}
                </p>
            `
            : ""
        }
    `;
}


// ============================================================
// STRESS OPTIONS
// ============================================================

async function loadStressOptions() {

    const container =
        document.getElementById(
            "stressOptions"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading">
            Loading stress conditions...
        </div>
    `;

    try {

        const response =
            await fetch(
                `${API_BASE}/drought-response`
            );

        if (!response.ok) {
            throw new Error(
                "Unable to load stress data."
            );
        }

        const data =
            await response.json();

        console.log(
            "Drought response data:",
            data
        );

        /*
         * Current EndoConsort AI project
         * is specifically designed for
         * drought resilience.
         */
        const stresses = [
            "Drought resilience"
        ];

        container.innerHTML = "";

        stresses.forEach(
            stress => {

                const card =
                    document.createElement(
                        "button"
                    );

                card.type = "button";

                card.className =
                    "option-card";

                card.dataset.value =
                    stress;

                card.innerHTML = `
                    <span class="option-icon">
                        ◈
                    </span>

                    <span class="option-title">
                        ${escapeHtml(
                            stress
                        )}
                    </span>

                    <span class="option-description">
                        Evaluate bacterial consortium
                        candidates for drought resilience.
                    </span>
                `;

                card.addEventListener(
                    "click",
                    () =>
                        selectStress(
                            stress,
                            card
                        )
                );

                container.appendChild(
                    card
                );
            }
        );

    } catch (error) {

        console.error(
            "Stress loading error:",
            error
        );

        /*
         * Even if drought-response
         * endpoint fails, show the
         * project's defined stress.
         */
        container.innerHTML = `
            <button
                type="button"
                class="option-card"
                onclick="selectStress(
                    'Drought resilience',
                    this
                )"
            >

                <span class="option-icon">
                    ◈
                </span>

                <span class="option-title">
                    Drought resilience
                </span>

                <span class="option-description">
                    Evaluate bacterial consortium
                    candidates for drought resilience.
                </span>

            </button>
        `;
    }
}


// ============================================================
// SELECT STRESS
// ============================================================

function selectStress(
    stress,
    selectedElement
) {

    designState.stress =
        stress;

    document
        .querySelectorAll(
            "#stressOptions .option-card"
        )
        .forEach(card => {

            card.classList.remove(
                "selected"
            );
        });

    if (selectedElement) {

        selectedElement.classList.add(
            "selected"
        );
    }

    updateReview();

    console.log(
        "Selected stress:",
        stress
    );
}


// ============================================================
// LOAD DESIGN OPTIONS
// ============================================================

async function loadDesignOptions() {

    try {

        const response =
            await fetch(
                `${API_BASE}/design/options`
            );

        if (!response.ok) {

            throw new Error(
                "Unable to load design options."
            );
        }

        const data =
            await response.json();

        console.log(
            "Design options:",
            data
        );

        renderTraitOptions(
            data.traits || []
        );

        renderStrainOptions(
            data.strains || []
        );

    } catch (error) {

        console.error(
            "Design options error:",
            error
        );

        /*
         * Fallback endpoints
         */
        await loadTraitsFallback();

        await loadStrainsFallback();
    }
}


// ============================================================
// TRAITS
// ============================================================

function renderTraitOptions(
    traits
) {

    const container =
        document.getElementById(
            "traitOptions"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    traits.forEach(
        trait => {

            const id =
                trait.trait_id ??
                trait.id;

            const name =
                trait.trait_name ??
                trait.name;

            if (!name) {
                return;
            }

            const label =
                document.createElement(
                    "label"
                );

            label.className =
                "checkbox-card";

            label.innerHTML = `
                <input
                    type="checkbox"
                    value="${escapeHtml(
                        String(name)
                    )}"
                    data-id="${escapeHtml(
                        String(
                            id ?? ""
                        )
                    )}"
                    data-name="${escapeHtml(
                        String(name)
                    )}"
                >

                <span class="checkbox-content">

                    <strong>
                        ${escapeHtml(
                            name
                        )}
                    </strong>

                </span>
            `;

            const checkbox =
                label.querySelector(
                    "input"
                );

            checkbox.addEventListener(
                "change",
                handleTraitChange
            );

            container.appendChild(
                label
            );
        }
    );

    updateTraitSummary();
}


function handleTraitChange(
    event
) {

    const checkbox =
        event.target;

    const id =
        Number(
            checkbox.dataset.id
        );

    const name =
        checkbox.dataset.name;

    if (checkbox.checked) {

        if (
            !designState.traitIds.includes(
                id
            )
        ) {

            designState.traitIds.push(
                id
            );

            designState.traitNames.push(
                name
            );
        }

    } else {

        designState.traitIds =
            designState.traitIds.filter(
                item =>
                    item !== id
            );

        designState.traitNames =
            designState.traitNames.filter(
                item =>
                    item !== name
            );
    }

    updateTraitSummary();

    updateReview();
}


function selectAllTraits() {

    const checkboxes =
        document.querySelectorAll(
            "#traitOptions input[type='checkbox']"
        );

    designState.traitIds = [];

    designState.traitNames = [];

    checkboxes.forEach(
        checkbox => {

            checkbox.checked =
                true;

            const id =
                Number(
                    checkbox.dataset.id
                );

            const name =
                checkbox.dataset.name;

            if (
                !Number.isNaN(id)
            ) {

                designState.traitIds.push(
                    id
                );
            }

            if (name) {

                designState.traitNames.push(
                    name
                );
            }
        }
    );

    updateTraitSummary();

    updateReview();
}


function clearAllTraits() {

    const checkboxes =
        document.querySelectorAll(
            "#traitOptions input[type='checkbox']"
        );

    checkboxes.forEach(
        checkbox => {

            checkbox.checked =
                false;
        }
    );

    designState.traitIds = [];

    designState.traitNames = [];

    updateTraitSummary();

    updateReview();
}


function updateTraitSummary() {

    const summary =
        document.getElementById(
            "traitSelectionSummary"
        );

    if (!summary) {
        return;
    }

    const count =
        designState.traitIds.length;

    summary.textContent =
        `${count} trait${
            count === 1 ? "" : "s"
        } selected`;
}


// ============================================================
// STRAINS
// ============================================================

function renderStrainOptions(
    strains
) {

    const container =
        document.getElementById(
            "strainOptions"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    strains.forEach(
        strain => {

            const id =
                strain.strain_id ??
                strain.id;

            const name =
                strain.strain_name ??
                strain.name;

            if (!name) {
                return;
            }

            const label =
                document.createElement(
                    "label"
                );

            label.className =
                "checkbox-card strain-card";

            label.innerHTML = `
                <input
                    type="checkbox"
                    value="${escapeHtml(
                        String(name)
                    )}"
                    data-id="${escapeHtml(
                        String(
                            id ?? ""
                        )
                    )}"
                    data-name="${escapeHtml(
                        String(name)
                    )}"
                >

                <span class="checkbox-content">

                    <strong>
                        ${escapeHtml(
                            name
                        )}
                    </strong>

                    ${
                        strain.species
                        ? `
                            <small>
                                ${escapeHtml(
                                    strain.species
                                )}
                            </small>
                        `
                        : ""
                    }

                </span>
            `;

            const checkbox =
                label.querySelector(
                    "input"
                );

            checkbox.addEventListener(
                "change",
                handleStrainChange
            );

            container.appendChild(
                label
            );
        }
    );

    updateStrainSummary();
}


function handleStrainChange(
    event
) {

    const checkbox =
        event.target;

    const id =
        Number(
            checkbox.dataset.id
        );

    const name =
        checkbox.dataset.name;

    if (checkbox.checked) {

        if (
            !designState.strainIds.includes(
                id
            )
        ) {

            designState.strainIds.push(
                id
            );

            designState.strainNames.push(
                name
            );
        }

    } else {

        designState.strainIds =
            designState.strainIds.filter(
                item =>
                    item !== id
            );

        designState.strainNames =
            designState.strainNames.filter(
                item =>
                    item !== name
            );
    }

    updateStrainSummary();

    updateReview();
}


function selectAllStrains() {

    const checkboxes =
        document.querySelectorAll(
            "#strainOptions input[type='checkbox']"
        );

    designState.strainIds = [];

    designState.strainNames = [];

    checkboxes.forEach(
        checkbox => {

            checkbox.checked =
                true;

            const id =
                Number(
                    checkbox.dataset.id
                );

            const name =
                checkbox.dataset.name;

            if (
                !Number.isNaN(id)
            ) {

                designState.strainIds.push(
                    id
                );
            }

            if (name) {

                designState.strainNames.push(
                    name
                );
            }
        }
    );

    updateStrainSummary();

    updateReview();
}


function clearAllStrains() {

    const checkboxes =
        document.querySelectorAll(
            "#strainOptions input[type='checkbox']"
        );

    checkboxes.forEach(
        checkbox => {

            checkbox.checked =
                false;
        }
    );

    designState.strainIds = [];

    designState.strainNames = [];

    updateStrainSummary();

    updateReview();
}


function updateStrainSummary() {

    const summary =
        document.getElementById(
            "strainSelectionSummary"
        );

    if (!summary) {
        return;
    }

    const count =
        designState.strainIds.length;

    summary.textContent =
        `${count} strain${
            count === 1 ? "" : "s"
        } selected`;
}


// ============================================================
// FALLBACK TRAITS
// ============================================================

async function loadTraitsFallback() {

    try {

        const response =
            await fetch(
                `${API_BASE}/bacterial-traits`
            );

        if (!response.ok) {
            throw new Error(
                "Trait endpoint failed."
            );
        }

        const data =
            await response.json();

        const records =
            Array.isArray(data)
                ? data
                : data.traits || [];

        const unique = [];

        const seen =
            new Set();

        records.forEach(
            item => {

                const name =
                    item.trait_name;

                if (
                    name &&
                    !seen.has(name)
                ) {

                    seen.add(
                        name
                    );

                    unique.push({
                        trait_id:
                            item.trait_id,

                        trait_name:
                            name
                    });
                }
            }
        );

        renderTraitOptions(
            unique
        );

    } catch (error) {

        console.error(
            "Trait fallback failed:",
            error
        );
    }
}


// ============================================================
// FALLBACK STRAINS
// ============================================================

async function loadStrainsFallback() {

    try {

        const response =
            await fetch(
                `${API_BASE}/bacteria`
            );

        if (!response.ok) {
            throw new Error(
                "Bacteria endpoint failed."
            );
        }

        const data =
            await response.json();

        const strains =
            Array.isArray(data)
                ? data
                : data.strains || [];

        renderStrainOptions(
            strains
        );

    } catch (error) {

        console.error(
            "Strain fallback failed:",
            error
        );
    }
}


// ============================================================
// CONSORTIUM SIZE
// ============================================================

function setDefaultConsortiumSize() {

    designState.consortiumSize =
        2;

    const defaultCard =
        document.querySelector(
            '.size-card[data-size="2"]'
        );

    if (defaultCard) {

        document
            .querySelectorAll(
                ".size-card"
            )
            .forEach(
                card => {

                    card.classList.remove(
                        "selected"
                    );
                }
            );

        defaultCard.classList.add(
            "selected"
        );
    }

    updateSizeSummary();

    updateReview();
}


function selectConsortiumSize(
    size
) {

    const value =
        Number(size);

    if (!value) {
        return;
    }

    designState.consortiumSize =
        value;

    document
        .querySelectorAll(
            ".size-card"
        )
        .forEach(
            card => {

                card.classList.remove(
                    "selected"
                );
            }
        );

    const selected =
        document.querySelector(
            `.size-card[data-size="${value}"]`
        );

    if (selected) {

        selected.classList.add(
            "selected"
        );
    }

    updateSizeSummary();

    updateReview();
}


function updateSizeSummary() {

    const summary =
        document.getElementById(
            "sizeSummary"
        );

    if (!summary) {
        return;
    }

    summary.textContent =
        `${designState.consortiumSize}-strain consortium`;
}


// ============================================================
// WEIGHTS
// ============================================================

function updateWeights() {

    const traitSlider =
        document.getElementById(
            "traitWeight"
        );

    const compatibilitySlider =
        document.getElementById(
            "compatibilityWeight"
        );

    const droughtSlider =
        document.getElementById(
            "droughtWeight"
        );

    const literatureSlider =
        document.getElementById(
            "literatureWeight"
        );

    if (traitSlider) {

        designState.weights.trait =
            Number(
                traitSlider.value
            );
    }

    if (compatibilitySlider) {

        designState.weights.compatibility =
            Number(
                compatibilitySlider.value
            );
    }

    if (droughtSlider) {

        designState.weights.drought =
            Number(
                droughtSlider.value
            );
    }

    if (literatureSlider) {

        designState.weights.literature =
            Number(
                literatureSlider.value
            );
    }

    updateWeightDisplay();

    updateReview();
}


function updateWeightDisplay() {

    const traitValue =
        document.getElementById(
            "traitWeightValue"
        );

    const compatibilityValue =
        document.getElementById(
            "compatibilityWeightValue"
        );

    const droughtValue =
        document.getElementById(
            "droughtWeightValue"
        );

    const literatureValue =
        document.getElementById(
            "literatureWeightValue"
        );

    const totalElement =
        document.getElementById(
            "weightTotal"
        );

    if (traitValue) {

        traitValue.textContent =
            `${designState.weights.trait}%`;
    }

    if (compatibilityValue) {

        compatibilityValue.textContent =
            `${designState.weights.compatibility}%`;
    }

    if (droughtValue) {

        droughtValue.textContent =
            `${designState.weights.drought}%`;
    }

    if (literatureValue) {

        literatureValue.textContent =
            `${designState.weights.literature}%`;
    }

    const total =
        designState.weights.trait +
        designState.weights.compatibility +
        designState.weights.drought +
        designState.weights.literature;

    if (totalElement) {

        totalElement.textContent =
            `${total}%`;

        if (total === 100) {

            totalElement.classList.remove(
                "invalid"
            );

        } else {

            totalElement.classList.add(
                "invalid"
            );
        }
    }
}


// ============================================================
// NAVIGATION
// ============================================================

function nextStep(step) {

    step =
        Number(step);

    console.log(
        "Next button clicked:",
        step
    );

    /*
     * Special handling for STEP 1.
     * Read directly from select so that
     * the state is definitely synchronized.
     */
    if (step === 1) {

        const plantSelect =
            document.getElementById(
                "plantSelect"
            );

        if (
            !plantSelect ||
            !plantSelect.value
        ) {

            showError(
                "Please select a target plant."
            );

            return;
        }

        designState.plantId =
            Number(
                plantSelect.value
            );

        const selectedOption =
            plantSelect.options[
                plantSelect.selectedIndex
            ];

        designState.plantName =
            selectedOption.textContent.trim();

        console.log(
            "Selected plant:",
            designState.plantId,
            designState.plantName
        );
    }

    /*
     * Validate current step.
     */
    if (
        !validateStep(step)
    ) {
        return;
    }

    /*
     * Move to next step.
     */
    const next =
        step + 1;

    console.log(
        "Opening step:",
        next
    );

    showStep(
        next
    );
}


function previousStep(step) {

    step =
        Number(step);

    if (step <= 1) {
        return;
    }

    showStep(
        step - 1
    );
}


function showStep(step) {

    const targetStep =
        Number(step);

    console.log(
        "showStep():",
        targetStep
    );

    if (
        targetStep < 1 ||
        targetStep > 7
    ) {
        console.error(
            "Invalid step:",
            targetStep
        );

        return;
    }

    /*
     * Hide every step.
     */
    document
        .querySelectorAll(
            ".wizard-step"
        )
        .forEach(
            section => {

                section.classList.remove(
                    "active"
                );
            }
        );

    /*
     * Find correct ID:
     * step1, step2, step3...
     */
    const selectedStep =
        document.getElementById(
            `step${targetStep}`
        );

    if (!selectedStep) {

        console.error(
            `Step ${targetStep} not found in HTML.`
        );

        return;
    }

    selectedStep.classList.add(
        "active"
    );

    /*
     * Update progress indicator.
     */
    document
        .querySelectorAll(
            ".progress-step"
        )
        .forEach(
            item => {

                const itemStep =
                    Number(
                        item.dataset.step
                    );

                item.classList.remove(
                    "active",
                    "completed"
                );

                if (
                    itemStep ===
                    targetStep
                ) {

                    item.classList.add(
                        "active"
                    );

                } else if (
                    itemStep <
                    targetStep
                ) {

                    item.classList.add(
                        "completed"
                    );
                }
            }
        );

    currentStep =
        targetStep;

    updateReview();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================================================
// VALIDATION
// ============================================================

function validateStep(step) {

    switch (
        Number(step)
    ) {

        case 1:

            if (
                !designState.plantId
            ) {

                showError(
                    "Please select a target plant."
                );

                return false;
            }

            return true;


        case 2:

            if (
                !designState.stress
            ) {

                showError(
                    "Please select a stress condition."
                );

                return false;
            }

            return true;


        case 3:

            if (
                designState
                    .traitNames
                    .length === 0
            ) {

                showError(
                    "Please select at least one required trait."
                );

                return false;
            }

            return true;


        case 4:

            if (
                designState
                    .strainIds
                    .length <
                designState.consortiumSize
            ) {

                showError(
                    `Please select at least ${designState.consortiumSize} bacterial strains.`
                );

                return false;
            }

            return true;


        case 5:

            if (
                !designState.consortiumSize
            ) {

                showError(
                    "Please select consortium size."
                );

                return false;
            }

            return true;


        case 6: {

            const total =
                designState.weights.trait +
                designState.weights.compatibility +
                designState.weights.drought +
                designState.weights.literature;

            if (
                total !== 100
            ) {

                showError(
                    "Priority weights must add up to 100%."
                );

                return false;
            }

            return true;
        }


        case 7:

            return true;


        default:

            return true;
    }
}


// ============================================================
// REVIEW
// ============================================================

function updateReview() {

    const plant =
        document.getElementById(
            "reviewPlant"
        );

    const stress =
        document.getElementById(
            "reviewStress"
        );

    const traits =
        document.getElementById(
            "reviewTraits"
        );

    const strains =
        document.getElementById(
            "reviewStrains"
        );

    const size =
        document.getElementById(
            "reviewSize"
        );

    const weights =
        document.getElementById(
            "reviewWeights"
        );

    if (plant) {

        plant.textContent =
            designState.plantName ||
            "Not selected";
    }

    if (stress) {

        stress.textContent =
            designState.stress ||
            "Not selected";
    }

    if (traits) {

        traits.textContent =
            designState
                .traitNames
                .length
                ? designState.traitNames.join(
                    ", "
                )
                : "None selected";
    }

    if (strains) {

        strains.textContent =
            designState
                .strainNames
                .length
                ? designState.strainNames.join(
                    ", "
                )
                : "None selected";
    }

    if (size) {

        size.textContent =
            `${designState.consortiumSize}-strain`;
    }

    if (weights) {

        weights.textContent =
            `Traits ${designState.weights.trait}% · ` +
            `Compatibility ${designState.weights.compatibility}% · ` +
            `Drought ${designState.weights.drought}% · ` +
            `Literature ${designState.weights.literature}%`;
    }
}


// ============================================================
// CUSTOM DESIGN ANALYSIS
// ============================================================

async function runCustomDesign() {

    if (
        !validateAllSteps()
    ) {
        return;
    }

    const button =
        document.getElementById(
            "designButton"
        );

    const loading =
        document.getElementById(
            "analysisLoading"
        );

    const resultBox =
        document.getElementById(
            "analysisResult"
        );

    if (button) {

        button.disabled =
            true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Running Analysis...";
    }

    if (loading) {

        loading.classList.remove(
            "hidden"
        );
    }

    if (resultBox) {

        resultBox.classList.add(
            "hidden"
        );

        resultBox.innerHTML =
            "";
    }

    hideReport();

    try {

        const payload =
            buildDesignPayload();

        console.log(
            "Custom design payload:",
            payload
        );

        const response =
            await fetch(
                `${API_BASE}/consortium-design/custom`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        const data =
            await response.json();

        console.log(
            "Custom design response:",
            data
        );

        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "Design analysis failed."
            );
        }

        renderAnalysisResult(
            data
        );

        /*
         * Scientific literature
         */
        await loadScientificEvidence();

        showReportSection();

    } catch (error) {

        console.error(
            "Design analysis error:",
            error
        );

        if (resultBox) {

            resultBox.classList.remove(
                "hidden"
            );

            resultBox.innerHTML = `
                <div class="error-box">

                    <strong>
                        Analysis failed
                    </strong>

                    <p>
                        ${escapeHtml(
                            error.message ||
                            "Unable to complete analysis."
                        )}
                    </p>

                </div>
            `;
        }

    } finally {

        if (loading) {

            loading.classList.add(
                "hidden"
            );
        }

        if (button) {

            button.disabled =
                false;

            button.textContent =
                button.dataset.originalText ||
                "Design Consortium";
        }
    }
}


// ============================================================
// BUILD PAYLOAD
// ============================================================

function buildDesignPayload() {

    return {

        plant_id:
            Number(
                designState.plantId
            ),

        stress:
            designState.stress,

        selected_traits:
            designState.traitNames,

        selected_strains:
            designState.strainIds,

        consortium_size:
            Number(
                designState.consortiumSize
            ),

        trait_coverage_weight:
            Number(
                designState.weights.trait
            ),

        compatibility_weight:
            Number(
                designState.weights.compatibility
            ),

        drought_evidence_weight:
            Number(
                designState.weights.drought
            ),

        literature_evidence_weight:
            Number(
                designState.weights.literature
            )
    };
}


// ============================================================
// VALIDATE ALL STEPS
// ============================================================

function validateAllSteps() {

    for (
        let step = 1;
        step <= 6;
        step++
    ) {

        if (
            !validateStep(step)
        ) {

            showStep(step);

            return false;
        }
    }

    return true;
}


// ============================================================
// ANALYSIS RESULT
// ============================================================

function renderAnalysisResult(
    data
) {

    const resultBox =
        document.getElementById(
            "analysisResult"
        );

    if (!resultBox) {
        return;
    }

    resultBox.classList.remove(
        "hidden"
    );

    const best =
        data.best_consortium ||
        data.best ||
        null;

    const candidates =
        data.all_candidates ||
        data.candidates ||
        [];

    const score =
        best?.computational_score ??
        best?.score ??
        0;

    const coverage =
        best?.trait_coverage_percent ??
        best?.trait_coverage ??
        0;

    const compatibility =
        best?.compatibility_score ??
        0;

    const droughtRecords =
        best?.drought_response_records ??
        0;

    const strainNames =
        best?.strains ||
        best?.strain_names ||
        [];

    resultBox.innerHTML = `

        <div class="analysis-launch">

            <span class="analysis-status">
                COMPUTATION COMPLETE
            </span>

            <h3>
                Consortium Design Result
            </h3>

            <p>
                The selected parameters were
                evaluated using database-derived
                trait coverage, compatibility and
                drought-response evidence.
            </p>

        </div>


        ${
            best
            ? `
                <div class="result-highlight">

                    <div class="result-heading">

                        <span>
                            TOP-RANKED CONSORTIUM
                        </span>

                        <strong>
                            ${escapeHtml(
                                formatBestStrains(
                                    best,
                                    strainNames
                                )
                            )}
                        </strong>

                    </div>


                    <div class="metrics-grid">

                        <div class="metric">

                            <span>
                                Computational Score
                            </span>

                            <strong>
                                ${formatNumber(
                                    score
                                )}
                            </strong>

                        </div>


                        <div class="metric">

                            <span>
                                Trait Coverage
                            </span>

                            <strong>
                                ${formatNumber(
                                    coverage
                                )}%
                            </strong>

                        </div>


                        <div class="metric">

                            <span>
                                Compatibility
                            </span>

                            <strong>
                                ${formatNumber(
                                    compatibility
                                )}
                            </strong>

                        </div>


                        <div class="metric">

                            <span>
                                Drought Records
                            </span>

                            <strong>
                                ${formatNumber(
                                    droughtRecords
                                )}
                            </strong>

                        </div>

                    </div>

                </div>
            `
            : ""
        }


        ${
            candidates.length
            ? `
                <div class="candidate-section">

                    <h4>
                        Ranked Candidates
                    </h4>

                    <div class="candidate-list">

                        ${
                            candidates
                                .map(
                                    (
                                        candidate,
                                        index
                                    ) =>
                                        renderCandidate(
                                            candidate,
                                            index
                                        )
                                )
                                .join("")
                        }

                    </div>

                </div>
            `
            : ""
        }


        <div class="scientific-notice">

            <strong>
                Scientific interpretation
            </strong>

            <p>
                This platform provides a
                computational ranking based on
                available database evidence.
                The ranking does not establish
                experimental biological efficacy,
                strain interaction, greenhouse
                performance or field performance.
                Experimental validation is required.
            </p>

        </div>

    `;

    resultBox.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ============================================================
// CANDIDATE RENDERING
// ============================================================

function renderCandidate(
    candidate,
    index
) {

    const strains =
        candidate.strains ||
        candidate.strain_names ||
        candidate.members ||
        [];

    const score =
        candidate.computational_score ??
        candidate.score ??
        0;

    const coverage =
        candidate.trait_coverage_percent ??
        candidate.trait_coverage ??
        0;

    const compatibility =
        candidate.compatibility_score ??
        0;

    return `

        <div class="candidate-card">

            <div class="candidate-rank">

                ${String(
                    index + 1
                ).padStart(2, "0")}

            </div>


            <div class="candidate-content">

                <strong>
                    ${escapeHtml(
                        formatCandidateStrains(
                            candidate,
                            strains
                        )
                    )}
                </strong>


                <div class="candidate-meta">

                    <span>
                        Score:
                        ${formatNumber(
                            score
                        )}
                    </span>

                    <span>
                        Coverage:
                        ${formatNumber(
                            coverage
                        )}%
                    </span>

                    <span>
                        Compatibility:
                        ${formatNumber(
                            compatibility
                        )}
                    </span>

                </div>

            </div>

        </div>

    `;
}


// ============================================================
// STRAIN NAME FORMATTING
// ============================================================

function formatBestStrains(
    best,
    strainNames
) {

    if (
        Array.isArray(
            strainNames
        ) &&
        strainNames.length
    ) {

        return strainNames.join(
            " + "
        );
    }

    if (
        typeof best.strains ===
        "string"
    ) {

        return best.strains;
    }

    if (
        Array.isArray(
            best.strains
        )
    ) {

        return best.strains.join(
            " + "
        );
    }

    return "Selected bacterial consortium";
}


function formatCandidateStrains(
    candidate,
    strains
) {

    if (
        Array.isArray(strains) &&
        strains.length
    ) {

        return strains.join(
            " + "
        );
    }

    if (
        typeof candidate.strains ===
        "string"
    ) {

        return candidate.strains;
    }

    return "Candidate consortium";
}


// ============================================================
// SCIENTIFIC EVIDENCE
// ============================================================

async function loadScientificEvidence() {

    const evidenceBox =
        document.getElementById(
            "scientificEvidence"
        );

    const evidenceLoading =
        document.getElementById(
            "evidenceLoading"
        );

    const evidenceList =
        document.getElementById(
            "evidenceList"
        );

    if (
        !evidenceBox ||
        !evidenceList
    ) {
        return;
    }

    evidenceBox.classList.remove(
        "hidden"
    );

    if (evidenceLoading) {

        evidenceLoading.classList.remove(
            "hidden"
        );
    }

    evidenceList.innerHTML =
        "";

    /*
     * General query
     */
    const queries = [
        {
            strain: null,
            trait: null
        }
    ];

    /*
     * Selected strains
     */
    designState
        .strainNames
        .slice(0, 3)
        .forEach(
            strain => {

                queries.push({
                    strain: strain,
                    trait: null
                });
            }
        );

    /*
     * Selected traits
     */
    designState
        .traitNames
        .slice(0, 3)
        .forEach(
            trait => {

                queries.push({
                    strain: null,
                    trait: trait
                });
            }
        );

    /*
     * Remove duplicate queries
     */
    const uniqueQueries = [];

    const seenQueries =
        new Set();

    queries.forEach(
        item => {

            const key =
                `${item.strain || ""}|${
                    item.trait || ""
                }`;

            if (
                !seenQueries.has(key)
            ) {

                seenQueries.add(
                    key
                );

                uniqueQueries.push(
                    item
                );
            }
        }
    );

    const allPapers = [];

    const seenPapers =
        new Set();

    try {

        for (
            const query
            of uniqueQueries
        ) {

            const params =
                new URLSearchParams();

            params.set(
                "plant",
                designState.plantName ||
                "Vigna radiata"
            );

            params.set(
                "stress",
                designState.stress ||
                "Drought resilience"
            );

            if (query.strain) {

                params.set(
                    "strain",
                    query.strain
                );
            }

            if (query.trait) {

                params.set(
                    "trait",
                    query.trait
                );
            }

            params.set(
                "page_size",
                "5"
            );

            const response =
                await fetch(
                    `${API_BASE}/literature/search?${params.toString()}`
                );

            if (!response.ok) {
                continue;
            }

            const data =
                await response.json();

            const papers =
                data.papers || [];

            papers.forEach(
                paper => {

                    const key =
                        paper.doi ||
                        paper.pmid ||
                        paper.title;

                    if (
                        key &&
                        !seenPapers.has(
                            key
                        )
                    ) {

                        seenPapers.add(
                            key
                        );

                        allPapers.push(
                            paper
                        );
                    }
                }
            );

            if (
                allPapers.length >=
                8
            ) {
                break;
            }
        }

        if (evidenceLoading) {

            evidenceLoading.classList.add(
                "hidden"
            );
        }

        if (
            allPapers.length === 0
        ) {

            evidenceList.innerHTML = `
                <div class="empty-state">

                    No relevant publications were
                    found for the current selection.

                    <br><br>

                    The computational analysis can
                    still be viewed using the project's
                    curated database.

                </div>
            `;

            return;
        }

        evidenceList.innerHTML =
            allPapers
                .slice(0, 8)
                .map(
                    (
                        paper,
                        index
                    ) =>
                        renderEvidenceCard(
                            paper,
                            index
                        )
                )
                .join("");

    } catch (error) {

        console.error(
            "Scientific evidence error:",
            error
        );

        if (evidenceLoading) {

            evidenceLoading.classList.add(
                "hidden"
            );
        }

        evidenceList.innerHTML = `
            <div class="error-box">

                Unable to retrieve scientific
                literature.

                <br><br>

                Please check that the backend
                server is running and that
                internet access is available
                to the backend.

            </div>
        `;
    }
}


// ============================================================
// EVIDENCE CARD
// ============================================================

function renderEvidenceCard(
    paper,
    index
) {

    const title =
        escapeHtml(
            paper.title ||
            "Untitled publication"
        );

    const authors =
        escapeHtml(
            paper.authors ||
            "Authors unavailable"
        );

    const journal =
        escapeHtml(
            paper.journal ||
            "Journal unavailable"
        );

    const year =
        escapeHtml(
            String(
                paper.year ||
                "Year unavailable"
            )
        );

    const doi =
        escapeHtml(
            paper.doi ||
            ""
        );

    const abstract =
        escapeHtml(
            paper.abstract ||
            "Abstract not available."
        );

    return `

        <article class="evidence-card">

            <div class="evidence-number">

                ${String(
                    index + 1
                ).padStart(2, "0")}

            </div>


            <div class="evidence-content">

                <h4>
                    ${title}
                </h4>


                <p class="evidence-authors">
                    ${authors}
                </p>


                <div class="evidence-meta">

                    <span>
                        ${journal}
                    </span>

                    <span>
                        ${year}
                    </span>

                </div>


                <p class="evidence-abstract">

                    ${abstract}

                </p>


                ${
                    doi
                    ? `
                        <div class="evidence-doi">

                            DOI:
                            ${doi}

                        </div>
                    `
                    : ""
                }

            </div>

        </article>

    `;
}


// ============================================================
// REPORT SECTION
// ============================================================

function showReportSection() {

    const section =
        document.getElementById(
            "reportSection"
        );

    if (!section) {
        return;
    }

    section.classList.remove(
        "hidden"
    );
}


function hideReport() {

    const section =
        document.getElementById(
            "reportSection"
        );

    if (!section) {
        return;
    }

    section.classList.add(
        "hidden"
    );
}


// ============================================================
// DOWNLOAD PDF REPORT
// ============================================================

async function downloadReport() {

    if (
        !validateAllSteps()
    ) {
        return;
    }

    const button =
        document.querySelector(
            "#reportSection button"
        );

    const originalText =
        button
            ? button.textContent
            : "";

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Generating PDF...";
    }

    try {

        const payload =
            buildDesignPayload();

        console.log(
            "PDF payload:",
            payload
        );

        const response =
            await fetch(
                `${API_BASE}/report/pdf`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        if (!response.ok) {

            let message =
                "Unable to generate PDF report.";

            try {

                const data =
                    await response.json();

                message =
                    data.detail ||
                    data.message ||
                    message;

            } catch (error) {
                // Ignore JSON parsing failure
            }

            throw new Error(
                message
            );
        }

        const blob =
            await response.blob();

        const url =
            window.URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href =
            url;

        link.download =
            "EndoConsort_AI_Consortium_Report.pdf";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
            url
        );

    } catch (error) {

        console.error(
            "PDF generation error:",
            error
        );

        showError(
            error.message ||
            "Unable to generate PDF report."
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                originalText ||
                "Download PDF Report";
        }
    }
}


// ============================================================
// ERROR MESSAGE
// ============================================================

function showError(
    message
) {

    console.warn(
        message
    );

    const existing =
        document.querySelector(
            ".global-error"
        );

    if (existing) {

        existing.textContent =
            message;

        return;
    }

    const error =
        document.createElement(
            "div"
        );

    error.className =
        "global-error";

    error.textContent =
        message;

    document.body.appendChild(
        error
    );

    setTimeout(
        () => {

            error.remove();

        },
        4000
    );
}


// ============================================================
// HTML ESCAPING
// ============================================================

function escapeHtml(
    value
) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


// ============================================================
// NUMBER FORMAT
// ============================================================

function formatNumber(
    value
) {

    const number =
        Number(value);

    if (
        Number.isNaN(number)
    ) {

        return "0";
    }

    return Number.isInteger(
        number
    )
        ? String(number)
        : number.toFixed(1);
}


// ============================================================
// EXPORT STATE FOR DEBUGGING
// ============================================================

window.EndoConsortAI = {

    state:
        designState,

    nextStep,

    previousStep,

    showStep,

    selectStress,

    selectConsortiumSize,

    selectAllTraits,

    clearAllTraits,

    selectAllStrains,

    clearAllStrains,

    updateWeights,

    runCustomDesign,

    downloadReport,

    loadScientificEvidence
};


console.log(
    "EndoConsort AI frontend loaded successfully."
);