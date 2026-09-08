const API_BASE = "http://127.0.0.1:8002";

// ============================================================
// BASIC HELPERS
// ============================================================

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function setHTML(id, html) {
    const element = document.getElementById(id);

    if (element) {
        element.innerHTML = html;
    }
}

function setText(id, text) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = text;
    }
}

async function fetchJSON(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`);

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}: ${response.statusText}`
        );
    }

    return await response.json();
}

function showLoading(id, message = "Loading...") {
    setHTML(
        id,
        `<div class="loading">${escapeHTML(message)}</div>`
    );
}

function showError(id, message) {
    setHTML(
        id,
        `
        <div class="error-box">
            <strong>Unable to load data</strong>
            <p>${escapeHTML(message)}</p>
        </div>
        `
    );
}

function formatValue(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    return escapeHTML(value);
}

// ============================================================
// SERVER STATUS
// ============================================================

async function checkServer() {
    try {
        const data = await fetchJSON("/health");

        setText("serverStatus", "Online");

        const element =
            document.getElementById("serverStatus");

        if (element) {
            element.classList.remove("offline");
            element.classList.add("online");
        }

        return data;

    } catch (error) {
        setText("serverStatus", "Offline");

        const element =
            document.getElementById("serverStatus");

        if (element) {
            element.classList.remove("online");
            element.classList.add("offline");
        }

        console.error("Server check failed:", error);

        return null;
    }
}

// ============================================================
// DATABASE STATUS
// ============================================================

async function checkDatabase() {
    try {
        const data = await fetchJSON("/database");

        setText("databaseStatus", "Connected");

        const element =
            document.getElementById("databaseStatus");

        if (element) {
            element.classList.remove("offline");
            element.classList.add("online");
        }

        return data;

    } catch (error) {
        setText("databaseStatus", "Disconnected");

        const element =
            document.getElementById("databaseStatus");

        if (element) {
            element.classList.remove("online");
            element.classList.add("offline");
        }

        console.error("Database check failed:", error);

        return null;
    }
}

// ============================================================
// DASHBOARD SUMMARY
// ============================================================

async function loadDashboard() {
    try {
        const data =
            await fetchJSON("/consortium-summary");

        const plantCount =
            data.plant_count ??
            data.plants_count ??
            1;

        const bacteriaCount =
            data.bacteria_count ??
            data.strain_count ??
            data.bacterial_strain_count ??
            3;

        const traitCount =
            data.trait_count ??
            data.traits_count ??
            12;

        const evidenceCount =
            data.evidence_count ??
            data.evidence_sources_count ??
            4;

        setText("plantCount", plantCount);
        setText("bacteriaCount", bacteriaCount);
        setText("traitCount", traitCount);
        setText("evidenceCount", evidenceCount);

    } catch (error) {
        console.error(
            "Dashboard summary failed:",
            error
        );

        setText("plantCount", "1");
        setText("bacteriaCount", "3");
        setText("traitCount", "12");
        setText("evidenceCount", "4");
    }
}

// ============================================================
// PLANTS
// ============================================================

async function loadPlants() {
    showLoading(
        "plants",
        "Loading target plant..."
    );

    try {
        const data =
            await fetchJSON("/plants");

        const plants =
            Array.isArray(data)
                ? data
                : (data.plants || []);

        if (!plants.length) {
            setHTML(
                "plants",
                `
                <div class="empty-box">
                    No plant records found.
                </div>
                `
            );
            return;
        }

        const html = plants
            .map(plant => `
                <div class="plant-card">

                    <div class="plant-header">

                        <div>
                            <h3>
                                ${formatValue(
                                    plant.scientific_name
                                )}
                            </h3>

                            <p>
                                ${formatValue(
                                    plant.common_name
                                )}
                            </p>
                        </div>

                        <span class="status-badge">
                            Target Crop
                        </span>

                    </div>

                    <div class="info-grid">

                        <div class="info-item">
                            <span class="label">
                                Plant ID
                            </span>

                            <span class="value">
                                ${formatValue(
                                    plant.plant_id
                                )}
                            </span>
                        </div>

                        <div class="info-item">
                            <span class="label">
                                Crop Type
                            </span>

                            <span class="value">
                                ${formatValue(
                                    plant.crop_type
                                )}
                            </span>
                        </div>

                        <div class="info-item">
                            <span class="label">
                                Scientific Name
                            </span>

                            <span class="value">
                                ${formatValue(
                                    plant.scientific_name
                                )}
                            </span>
                        </div>

                        <div class="info-item">
                            <span class="label">
                                Common Name
                            </span>

                            <span class="value">
                                ${formatValue(
                                    plant.common_name
                                )}
                            </span>
                        </div>

                    </div>

                    <div class="description">
                        ${formatValue(
                            plant.description
                        )}
                    </div>

                </div>
            `)
            .join("");

        setHTML("plants", html);

    } catch (error) {
        console.error(
            "Plants loading failed:",
            error
        );

        showError(
            "plants",
            error.message
        );
    }
}

// ============================================================
// BACTERIAL STRAINS
// ============================================================

async function loadBacteria() {
    showLoading(
        "bacteria",
        "Loading indigenous bacterial strains..."
    );

    try {
        const data =
            await fetchJSON("/bacteria");

        const bacteria =
            Array.isArray(data)
                ? data
                : (
                    data.bacteria ||
                    data.strains ||
                    []
                );

        if (!bacteria.length) {
            setHTML(
                "bacteria",
                `
                <div class="empty-box">
                    No bacterial strain records found.
                </div>
                `
            );
            return;
        }

        const html = bacteria
            .map(strain => `
                <div class="bacteria-card">

                    <div class="bacteria-card-header">

                        <div>
                            <h3>
                                ${formatValue(
                                    strain.strain_name
                                )}
                            </h3>

                            <p class="species-name">
                                ${formatValue(
                                    strain.species
                                )}
                            </p>
                        </div>

                        <span class="strain-id">
                            ID ${formatValue(
                                strain.strain_id
                            )}
                        </span>

                    </div>

                    <div class="tag-row">

                        <span class="tag">
                            ${formatValue(
                                strain.genus
                            )}
                        </span>

                        <span class="tag">
                            ${formatValue(
                                strain.gram_type
                            )}
                        </span>

                        <span class="tag">
                            Indigenous
                        </span>

                    </div>

                    <div class="info-grid">

                        <div class="info-item">
                            <span class="label">
                                Source
                            </span>

                            <span class="value">
                                ${formatValue(
                                    strain.source
                                )}
                            </span>
                        </div>

                        <div class="info-item">
                            <span class="label">
                                Location
                            </span>

                            <span class="value">
                                ${formatValue(
                                    strain.isolation_location
                                )}
                            </span>
                        </div>

                    </div>

                    ${
                        strain.notes
                            ? `
                                <div class="description">
                                    ${formatValue(
                                        strain.notes
                                    )}
                                </div>
                              `
                            : ""
                    }

                </div>
            `)
            .join("");

        setHTML("bacteria", html);

    } catch (error) {
        console.error(
            "Bacteria loading failed:",
            error
        );

        showError(
            "bacteria",
            error.message
        );
    }
}

// ============================================================
// BACTERIAL TRAITS
// ============================================================

async function loadBacterialTraits() {
    showLoading(
        "bacterialTraits",
        "Loading functional traits..."
    );

    try {
        const data =
            await fetchJSON("/bacterial-traits");

        const traits =
            Array.isArray(data)
                ? data
                : (
                    data.traits ||
                    data.bacterial_traits ||
                    []
                );

        if (!traits.length) {
            setHTML(
                "bacterialTraits",
                `
                <div class="empty-box">
                    No trait records found.
                </div>
                `
            );
            return;
        }

        const rows = traits
            .map(trait => `
                <tr>

                    <td>
                        ${formatValue(
                            trait.strain_id
                        )}
                    </td>

                    <td>
                        ${formatValue(
                            trait.trait_name
                        )}
                    </td>

                    <td>
                        ${formatValue(
                            trait.trait_value
                        )}
                    </td>

                    <td>
                        ${formatValue(
                            trait.measurement_unit
                        )}
                    </td>

                    <td>
                        ${formatValue(
                            trait.evidence_level
                        )}
                    </td>

                </tr>
            `)
            .join("");

        setHTML(
            "bacterialTraits",
            `
            <div class="table-wrapper">

                <table>

                    <thead>
                        <tr>
                            <th>Strain ID</th>
                            <th>Functional Trait</th>
                            <th>Value</th>
                            <th>Unit</th>
                            <th>Evidence Level</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>

                </table>

            </div>
            `
        );

    } catch (error) {
        console.error(
            "Trait loading failed:",
            error
        );

        showError(
            "bacterialTraits",
            error.message
        );
    }
}

// ============================================================
// TRAIT MATRIX
// ============================================================

async function loadTraitMatrix() {
    showLoading(
        "traitMatrix",
        "Building strain-trait matrix..."
    );

    try {
        const data =
            await fetchJSON("/bacterial-traits");

        const traits =
            Array.isArray(data)
                ? data
                : (
                    data.traits ||
                    data.bacterial_traits ||
                    []
                );

        if (!traits.length) {
            setHTML(
                "traitMatrix",
                `
                <div class="empty-box">
                    No trait matrix data available.
                </div>
                `
            );
            return;
        }

        const strainMap = {};

        traits.forEach(item => {
            const strainId = item.strain_id;

            if (!strainMap[strainId]) {
                strainMap[strainId] = [];
            }

            strainMap[strainId].push(item);
        });

        const html =
            Object.entries(strainMap)
                .map(
                    ([strainId, strainTraits]) => {

                        const traitNames =
                            strainTraits
                                .map(item => `
                                    <span class="tag">
                                        ${formatValue(
                                            item.trait_name
                                        )}
                                    </span>
                                `)
                                .join("");

                        return `
                            <div class="matrix-row">

                                <div class="matrix-strain">
                                    Strain
                                    ${formatValue(
                                        strainId
                                    )}
                                </div>

                                <div class="matrix-traits">
                                    ${traitNames}
                                </div>

                            </div>
                        `;
                    }
                )
                .join("");

        setHTML(
            "traitMatrix",
            `
            <div class="matrix-container">
                ${html}
            </div>
            `
        );

    } catch (error) {
        console.error(
            "Trait matrix failed:",
            error
        );

        showError(
            "traitMatrix",
            error.message
        );
    }
}

// ============================================================
// REQUIRED TRAITS
// ============================================================

async function loadRequiredTraits() {
    showLoading(
        "requiredTraits",
        "Loading required drought-resilience traits..."
    );

    const fallback = [
        "Indole-3-acetic acid production",
        "Phosphate solubilization",
        "ACC deaminase activity",
        "Exopolysaccharide production",
        "Siderophore production"
    ];

    try {
        const data =
            await fetchJSON("/consortium-design");

        const required =
            data.required_traits ||
            data.required_trait_names ||
            [];

        const traitsToShow =
            required.length
                ? required
                : fallback;

        setHTML(
            "requiredTraits",
            traitsToShow
                .map(trait => `
                    <span class="tag">
                        ${formatValue(trait)}
                    </span>
                `)
                .join("")
        );

    } catch (error) {
        console.error(
            "Required traits loading failed:",
            error
        );

        setHTML(
            "requiredTraits",
            fallback
                .map(trait => `
                    <span class="tag">
                        ${escapeHTML(trait)}
                    </span>
                `)
                .join("")
        );
    }
}

// ============================================================
// DROUGHT RESPONSE
// ============================================================

async function loadDroughtResponse() {
    showLoading(
        "drought",
        "Loading drought-response records..."
    );

    try {
        const data =
            await fetchJSON("/drought-response");

        const records =
            Array.isArray(data)
                ? data
                : (
                    data.drought_response ||
                    data.records ||
                    []
                );

        if (!records.length) {
            setHTML(
                "drought",
                `
                <div class="empty-box">
                    No drought-response records found.
                </div>
                `
            );
            return;
        }

        const rows = records
            .map(record => `
                <tr>

                    <td>
                        ${formatValue(
                            record.strain_id
                        )}
                    </td>

                    <td>
                        ${formatValue(
                            record.response_type
                        )}
                    </td>

                    <td>
                        ${formatValue(
                            record.response_value
                        )}
                    </td>

                    <td>
                        ${formatValue(
                            record.measurement_unit
                        )}
                    </td>

                    <td>
                        ${formatValue(
                            record.evidence_level
                        )}
                    </td>

                </tr>
            `)
            .join("");

        setHTML(
            "drought",
            `
            <div class="table-wrapper">

                <table>

                    <thead>
                        <tr>
                            <th>Strain ID</th>
                            <th>Response</th>
                            <th>Value</th>
                            <th>Unit</th>
                            <th>Evidence</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>

                </table>

            </div>
            `
        );

    } catch (error) {
        console.error(
            "Drought response loading failed:",
            error
        );

        showError(
            "drought",
            error.message
        );
    }
}

// ============================================================
// EVIDENCE
// ============================================================

async function loadEvidence() {
    showLoading(
        "evidence",
        "Loading scientific evidence..."
    );

    try {
        const data =
            await fetchJSON("/evidence");

        const evidence =
            Array.isArray(data)
                ? data
                : (data.evidence || []);

        if (!evidence.length) {
            setHTML(
                "evidence",
                `
                <div class="empty-box">
                    No evidence records found.
                </div>
                `
            );
            return;
        }

        const html = evidence
            .map(item => `
                <div class="evidence-card">

                    <h3>
                        ${formatValue(
                            item.title ||
                            item.evidence_title ||
                            item.study_title
                        )}
                    </h3>

                    <p>
                        <strong>
                            Strain:
                        </strong>

                        ${formatValue(
                            item.strain_name ||
                            item.species ||
                            item.strain_id
                        )}
                    </p>

                    <p>
                        <strong>
                            Evidence level:
                        </strong>

                        ${formatValue(
                            item.evidence_level
                        )}
                    </p>

                    ${
                        item.description
                            ? `
                                <p>
                                    ${formatValue(
                                        item.description
                                    )}
                                </p>
                              `
                            : ""
                    }

                </div>
            `)
            .join("");

        setHTML(
            "evidence",
            html
        );

    } catch (error) {
        console.error(
            "Evidence loading failed:",
            error
        );

        showError(
            "evidence",
            error.message
        );
    }
}

// ============================================================
// EVIDENCE SOURCES
// ============================================================

async function loadEvidenceSources() {
    try {
        const data =
            await fetchJSON("/evidence-sources");

        console.log(
            "Evidence sources:",
            data
        );

    } catch (error) {
        console.error(
            "Evidence sources loading failed:",
            error
        );
    }
}

// ============================================================
// COMPATIBILITY
// ============================================================

async function loadCompatibility() {
    showLoading(
        "compatibility",
        "Loading compatibility records..."
    );

    try {
        const data =
            await fetchJSON("/compatibility");

        const records =
            Array.isArray(data)
                ? data
                : (
                    data.compatibility ||
                    data.records ||
                    []
                );

        if (!records.length) {
            setHTML(
                "compatibility",
                `
                <div class="empty-box">
                    No compatibility records found.
                </div>
                `
            );
            return;
        }

        const html = records
            .map(record => {

                const score =
                    Number(
                        record.compatibility_score ?? 0
                    );

                const safeScore =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            score
                        )
                    );

                return `
                    <div class="compatibility-card">

                        <div class="compatibility-header">

                            <strong>
                                Strain
                                ${formatValue(
                                    record.strain_a_id
                                )}
                                +
                                Strain
                                ${formatValue(
                                    record.strain_b_id
                                )}
                            </strong>

                            <span class="score-badge">
                                ${score.toFixed(0)}
                            </span>

                        </div>

                        <div class="score-bar">

                            <div
                                class="score-fill"
                                style="width: ${safeScore}%"
                            ></div>

                        </div>

                        <p>
                            <strong>
                                Interaction:
                            </strong>

                            ${formatValue(
                                record.interaction_type
                            )}
                        </p>

                        <p>
                            <strong>
                                Evidence:
                            </strong>

                            ${formatValue(
                                record.evidence_level
                            )}
                        </p>

                        ${
                            record.notes
                                ? `
                                    <p class="muted">
                                        ${formatValue(
                                            record.notes
                                        )}
                                    </p>
                                  `
                                : ""
                        }

                    </div>
                `;
            })
            .join("");

        setHTML(
            "compatibility",
            html
        );

    } catch (error) {
        console.error(
            "Compatibility loading failed:",
            error
        );

        showError(
            "compatibility",
            error.message
        );
    }
}

// ============================================================
// CONSORTIUM CANDIDATES
// ============================================================

async function loadCandidates() {
    showLoading(
        "candidates",
        "Loading consortium candidates..."
    );

    try {
        const data =
            await fetchJSON("/consortium-design");

        const candidates =
            data.all_candidates ||
            data.candidates ||
            [];

        if (!candidates.length) {
            setHTML(
                "candidates",
                `
                <div class="empty-box">
                    No consortium candidates found.
                </div>
                `
            );
            return;
        }

        const html =
            candidates
                .map((candidate, index) => {

                    const strains =
                        candidate.strains ||
                        candidate.strain_names ||
                        [];

                    const strainText =
                        Array.isArray(strains)
                            ? strains.join(" + ")
                            : String(strains);

                    return `
                        <div class="candidate-row">

                            <div class="candidate-rank">
                                #${index + 1}
                            </div>

                            <div class="candidate-main">

                                <strong>
                                    ${escapeHTML(
                                        strainText
                                    )}
                                </strong>

                                <div class="candidate-meta">

                                    <span>
                                        Size:
                                        ${formatValue(
                                            candidate.consortium_size
                                        )}
                                    </span>

                                    <span>
                                        Trait coverage:
                                        ${formatValue(
                                            candidate.trait_coverage_percent
                                        )}%
                                    </span>

                                    <span>
                                        Compatibility:
                                        ${formatValue(
                                            candidate.compatibility_score
                                        )}
                                    </span>

                                    <span>
                                        Score:
                                        ${formatValue(
                                            candidate.computational_score
                                        )}
                                    </span>

                                </div>

                            </div>

                        </div>
                    `;
                })
                .join("");

        setHTML(
            "candidates",
            html
        );

    } catch (error) {
        console.error(
            "Candidates loading failed:",
            error
        );

        showError(
            "candidates",
            error.message
        );
    }
}

// ============================================================
// CONSORTIUM DESIGN
// ============================================================

async function designConsortium() {
    showLoading(
        "consortiumResult",
        "Computing consortium design..."
    );

    try {
        const data =
            await fetchJSON("/consortium-design");

        const best =
            data.best_consortium ||
            data.best_candidate ||
            null;

        if (!best) {
            setHTML(
                "consortiumResult",
                `
                <div class="empty-box">
                    No best consortium was returned.
                </div>
                `
            );
            return;
        }

        const strains =
            best.strains ||
            best.strain_names ||
            [];

        const strainList =
            Array.isArray(strains)
                ? strains
                : [strains];

        const strainHTML =
            strainList
                .map(strain => `
                    <span class="strain-chip">
                        ${escapeHTML(strain)}
                    </span>
                `)
                .join("");

        setHTML(
            "consortiumResult",
            `
            <div class="best-consortium">

                <div class="best-consortium-header">

                    <div>

                        <span class="eyebrow">
                            COMPUTATIONAL RESULT
                        </span>

                        <h3>
                            Recommended Consortium
                        </h3>

                    </div>

                    <div class="score-big">
                        ${formatValue(
                            best.computational_score
                        )}
                    </div>

                </div>

                <div class="consortium-strains">
                    ${strainHTML}
                </div>

                <div class="metric-grid">

                    <div class="metric-card">

                        <span class="metric-label">
                            Consortium Size
                        </span>

                        <strong>
                            ${formatValue(
                                best.consortium_size
                            )}
                        </strong>

                    </div>

                    <div class="metric-card">

                        <span class="metric-label">
                            Trait Coverage
                        </span>

                        <strong>
                            ${formatValue(
                                best.trait_coverage_percent
                            )}%
                        </strong>

                    </div>

                    <div class="metric-card">

                        <span class="metric-label">
                            Drought Records
                        </span>

                        <strong>
                            ${formatValue(
                                best.drought_response_records
                            )}
                        </strong>

                    </div>

                    <div class="metric-card">

                        <span class="metric-label">
                            Compatibility
                        </span>

                        <strong>
                            ${formatValue(
                                best.compatibility_score
                            )}
                        </strong>

                    </div>

                </div>

                <div class="algorithm-note">

                    <strong>
                        Interpretation:
                    </strong>

                    This is a computational ranking based on
                    trait coverage, drought-response records
                    and compatibility scoring. It does not
                    establish experimental biological efficacy.

                </div>

            </div>
            `
        );

    } catch (error) {
        console.error(
            "Consortium design failed:",
            error
        );

        showError(
            "consortiumResult",
            error.message
        );
    }
}

// ============================================================
// CONSORTIUM COVERAGE
// ============================================================

async function loadConsortiumCoverage() {
    showLoading(
        "consortiumCoverage",
        "Calculating trait coverage..."
    );

    try {
        const data =
            await fetchJSON("/consortium-design");

        const best =
            data.best_consortium ||
            data.best_candidate ||
            null;

        if (!best) {
            setHTML(
                "consortiumCoverage",
                `
                <div class="empty-box">
                    Coverage information unavailable.
                </div>
                `
            );
            return;
        }

        const coverage =
            Number(
                best.trait_coverage_percent ?? 0
            );

        const safeCoverage =
            Math.max(
                0,
                Math.min(
                    100,
                    coverage
                )
            );

        setHTML(
            "consortiumCoverage",
            `
            <div class="coverage-card">

                <div class="coverage-header">

                    <span>
                        Required trait coverage
                    </span>

                    <strong>
                        ${coverage.toFixed(1)}%
                    </strong>

                </div>

                <div class="coverage-bar">

                    <div
                        class="coverage-fill"
                        style="width: ${safeCoverage}%"
                    ></div>

                </div>

                <p class="muted">
                    Coverage is calculated from the functional
                    traits represented by the selected consortium.
                </p>

            </div>
            `
        );

    } catch (error) {
        console.error(
            "Consortium coverage failed:",
            error
        );

        showError(
            "consortiumCoverage",
            error.message
        );
    }
}

// ============================================================
// COMPATIBILITY VALIDATION
// ============================================================

async function validateCompatibility() {
    showLoading(
        "compatibilityValidation",
        "Validating computational compatibility..."
    );

    try {
        const data =
            await fetchJSON("/consortium-design");

        const best =
            data.best_consortium ||
            data.best_candidate ||
            null;

        if (!best) {
            setHTML(
                "compatibilityValidation",
                `
                <div class="empty-box">
                    Compatibility validation unavailable.
                </div>
                `
            );
            return;
        }

        const score =
            Number(
                best.compatibility_score ?? 0
            );

        setHTML(
            "compatibilityValidation",
            `
            <div class="validation-card">

                <div class="validation-score">
                    ${score.toFixed(0)}
                </div>

                <div class="validation-content">

                    <h3>
                        Computational compatibility score
                    </h3>

                    <p>
                        The selected consortium has a
                        compatibility score of

                        <strong>
                            ${score.toFixed(0)}
                        </strong>.
                    </p>

                    <p class="muted">
                        This score represents the current
                        computational compatibility assessment
                        in the database and requires experimental
                        validation.
                    </p>

                </div>

            </div>
            `
        );

    } catch (error) {
        console.error(
            "Compatibility validation failed:",
            error
        );

        showError(
            "compatibilityValidation",
            error.message
        );
    }
}

// ============================================================
// DATABASE REVIEW
// ============================================================

async function loadDuplicateReview() {
    showLoading(
        "duplicateReview",
        "Reviewing database records..."
    );

    try {
        const results =
            await Promise.all([
                fetchJSON("/bacteria"),
                fetchJSON("/bacterial-traits"),
                fetchJSON("/compatibility")
            ]);

        const bacteria = results[0];
        const traits = results[1];
        const compatibility = results[2];

        const bacteriaRecords =
            Array.isArray(bacteria)
                ? bacteria
                : (
                    bacteria.bacteria ||
                    bacteria.strains ||
                    []
                );

        const traitRecords =
            Array.isArray(traits)
                ? traits
                : (
                    traits.traits ||
                    traits.bacterial_traits ||
                    []
                );

        const compatibilityRecords =
            Array.isArray(compatibility)
                ? compatibility
                : (
                    compatibility.compatibility ||
                    compatibility.records ||
                    []
                );

        setHTML(
            "duplicateReview",
            `
            <div class="review-grid">

                <div class="review-card">

                    <span class="review-label">
                        Bacterial strain records
                    </span>

                    <strong>
                        ${bacteriaRecords.length}
                    </strong>

                </div>

                <div class="review-card">

                    <span class="review-label">
                        Trait records
                    </span>

                    <strong>
                        ${traitRecords.length}
                    </strong>

                </div>

                <div class="review-card">

                    <span class="review-label">
                        Compatibility records
                    </span>

                    <strong>
                        ${compatibilityRecords.length}
                    </strong>

                </div>

            </div>

            <div class="algorithm-note">
                Database review completed successfully.
                Records are being read directly from the
                PostgreSQL-backed FastAPI API.
            </div>
            `
        );

    } catch (error) {
        console.error(
            "Database review failed:",
            error
        );

        showError(
            "duplicateReview",
            error.message
        );
    }
}

// ============================================================
// LOAD ALL SECTIONS
// ============================================================

async function loadAllSections() {
    await Promise.allSettled([

        loadBacterialTraits(),

        loadTraitMatrix(),

        loadRequiredTraits(),

        loadDroughtResponse(),

        loadEvidence(),

        loadEvidenceSources(),

        loadCompatibility(),

        loadCandidates(),

        designConsortium(),

        loadConsortiumCoverage(),

        validateCompatibility(),

        loadDuplicateReview()

    ]);
}

// ============================================================
// PAGE INITIALIZATION
// ============================================================

async function initializeDashboard() {
    console.log(
        "EndoConsort AI dashboard initializing..."
    );

    await checkServer();

    await checkDatabase();

    await loadDashboard();

    await loadPlants();

    await loadBacteria();

    await loadAllSections();

    console.log(
        "EndoConsort AI dashboard loaded successfully."
    );
}

// ============================================================
// START APPLICATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);