from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from database.db_connection import test_connection, get_connection
from backend.literature_service import search_drought_evidence
from backend.report_service import generate_report_pdf

from itertools import combinations
from typing import List
from datetime import datetime, timezone


# =========================================================
# APP CONFIGURATION
# =========================================================

app = FastAPI(
    title="EndoConsort AI API",
    description=(
        "Database-driven computational platform for designing "
        "indigenous multi-strain endophytic bacterial consortia "
        "for drought resilience in Vigna radiata."
    ),
    version="2.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# CONSTANTS
# =========================================================

DEFAULT_STRESS = "Drought resilience"

DEFAULT_TRAIT_WEIGHTS = {
    "trait_coverage": 50,
    "compatibility": 30,
    "drought_evidence": 15,
    "literature_evidence": 5
}


# =========================================================
# REQUEST MODEL
# =========================================================

class CustomDesignRequest(BaseModel):

    plant_id: int

    stress: str = DEFAULT_STRESS

    selected_traits: List[str] = Field(
        default_factory=list
    )

    selected_strains: List[int] = Field(
        default_factory=list
    )

    consortium_size: int = Field(
        default=2,
        ge=2,
        le=3
    )

    trait_coverage_weight: float = 50

    compatibility_weight: float = 30

    drought_evidence_weight: float = 15

    literature_evidence_weight: float = 5


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "project": "EndoConsort AI",
        "status": "running",
        "version": "2.0.0",
        "mode": "interactive_computational_design"
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "version": "2.0.0"
    }


# =========================================================
# DATABASE
# =========================================================

@app.get("/database")
def database_check():

    try:

        database_name = test_connection()

        return {
            "status": "connected",
            "database": database_name
        }

    except Exception as error:

        return {
            "status": "error",
            "message": str(error)
        }


# =========================================================
# PLANTS
# =========================================================

@app.get("/plants")
def get_plants():

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    plant_id,
                    scientific_name,
                    common_name,
                    crop_type,
                    description,
                    created_at
                FROM plants
                ORDER BY plant_id;
            """)

            rows = cur.fetchall()

            plants = []

            for row in rows:

                plants.append({
                    "plant_id": row[0],
                    "scientific_name": row[1],
                    "common_name": row[2],
                    "crop_type": row[3],
                    "description": row[4],
                    "created_at": row[5]
                })

            return {
                "count": len(plants),
                "plants": plants
            }

    finally:

        conn.close()


# =========================================================
# BACTERIA
# =========================================================

@app.get("/bacteria")
def get_bacteria():

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    strain_id,
                    strain_name,
                    species,
                    genus,
                    source,
                    isolation_location,
                    isolation_year,
                    gram_type,
                    notes,
                    created_at
                FROM bacterial_strains
                ORDER BY strain_id;
            """)

            rows = cur.fetchall()

            bacteria = []

            for row in rows:

                bacteria.append({
                    "strain_id": row[0],
                    "strain_name": row[1],
                    "species": row[2],
                    "genus": row[3],
                    "source": row[4],
                    "isolation_location": row[5],
                    "isolation_year": row[6],
                    "gram_type": row[7],
                    "notes": row[8],
                    "created_at": row[9]
                })

            return {
                "count": len(bacteria),
                "bacteria": bacteria
            }

    finally:

        conn.close()


# =========================================================
# BACTERIAL TRAITS
# =========================================================

@app.get("/bacterial-traits")
def get_bacterial_traits():

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    bs.strain_id,
                    bs.strain_name,
                    bs.species,
                    st.trait_id,
                    st.trait_name,
                    st.trait_value,
                    st.measurement_unit,
                    st.evidence_level,
                    st.notes
                FROM strain_traits st
                JOIN bacterial_strains bs
                    ON bs.strain_id = st.strain_id
                ORDER BY
                    bs.strain_id,
                    st.trait_id;
            """)

            rows = cur.fetchall()

            traits = []

            for row in rows:

                traits.append({
                    "strain_id": row[0],
                    "strain_name": row[1],
                    "species": row[2],
                    "trait_id": row[3],
                    "trait_name": row[4],
                    "trait_value": row[5],
                    "measurement_unit": row[6],
                    "evidence_level": row[7],
                    "notes": row[8]
                })

            return {
                "count": len(traits),
                "bacterial_traits": traits
            }

    finally:

        conn.close()


# =========================================================
# SINGLE STRAIN TRAITS
# =========================================================

@app.get("/bacteria/{strain_id}/traits")
def get_strain_traits(strain_id: int):

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    bs.strain_id,
                    bs.strain_name,
                    bs.species,
                    st.trait_id,
                    st.trait_name,
                    st.trait_value,
                    st.measurement_unit,
                    st.evidence_level,
                    st.notes
                FROM bacterial_strains bs
                LEFT JOIN strain_traits st
                    ON bs.strain_id = st.strain_id
                WHERE bs.strain_id = %s
                ORDER BY st.trait_id;
            """, (strain_id,))

            rows = cur.fetchall()

            if not rows:

                raise HTTPException(
                    status_code=404,
                    detail="Bacterial strain not found."
                )

            traits = []

            for row in rows:

                if row[3] is not None:

                    traits.append({
                        "trait_id": row[3],
                        "trait_name": row[4],
                        "trait_value": row[5],
                        "measurement_unit": row[6],
                        "evidence_level": row[7],
                        "notes": row[8]
                    })

            return {
                "strain_id": rows[0][0],
                "strain_name": rows[0][1],
                "species": rows[0][2],
                "trait_count": len(traits),
                "traits": traits
            }

    finally:

        conn.close()


# =========================================================
# DROUGHT RESPONSE
# =========================================================

@app.get("/drought-response")
def get_drought_response():

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT *
                FROM drought_response
                ORDER BY 1;
            """)

            rows = cur.fetchall()

            columns = [
                description[0]
                for description in cur.description
            ]

            records = []

            for row in rows:

                records.append({
                    column: row[index]
                    for index, column in enumerate(columns)
                })

            return {
                "count": len(records),
                "records": records
            }

    finally:

        conn.close()


# =========================================================
# COMPATIBILITY
# =========================================================

@app.get("/compatibility")
def get_compatibility():

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    compatibility_id,
                    strain_a_id,
                    strain_b_id,
                    compatibility_score,
                    interaction_type,
                    evidence_level,
                    notes
                FROM strain_compatibility
                ORDER BY compatibility_id;
            """)

            rows = cur.fetchall()

            records = []

            for row in rows:

                records.append({
                    "compatibility_id": int(row[0]),
                    "strain_a_id": int(row[1]),
                    "strain_b_id": int(row[2]),
                    "compatibility_score": float(row[3]),
                    "interaction_type": row[4],
                    "evidence_level": row[5],
                    "notes": row[6]
                })

            return {
                "count": len(records),
                "records": records
            }

    finally:

        conn.close()


# =========================================================
# EVIDENCE
# =========================================================

@app.get("/evidence")
def get_evidence():

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT *
                FROM evidence_sources
                ORDER BY source_id;
            """)

            rows = cur.fetchall()

            columns = [
                description[0]
                for description in cur.description
            ]

            sources = []

            for row in rows:

                sources.append({
                    column: row[index]
                    for index, column in enumerate(columns)
                })

            return {
                "count": len(sources),
                "sources": sources
            }

    finally:

        conn.close()


# =========================================================
# EVIDENCE SOURCES
# =========================================================

@app.get("/evidence-sources")
def get_evidence_sources():

    return get_evidence()


# =========================================================
# DESIGN OPTIONS
# =========================================================

@app.get("/design/options")
def design_options():

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            # -------------------------------------------------
            # PLANTS
            # -------------------------------------------------

            cur.execute("""
                SELECT
                    plant_id,
                    scientific_name,
                    common_name,
                    crop_type
                FROM plants
                ORDER BY plant_id;
            """)

            plants = []

            for row in cur.fetchall():

                plants.append({
                    "plant_id": row[0],
                    "scientific_name": row[1],
                    "common_name": row[2],
                    "crop_type": row[3]
                })

            # -------------------------------------------------
            # UNIQUE TRAITS
            # -------------------------------------------------

            cur.execute("""
                SELECT
                    MIN(trait_id) AS trait_id,
                    trait_name
                FROM strain_traits
                WHERE trait_name IS NOT NULL
                GROUP BY trait_name
                ORDER BY MIN(trait_id);
            """)

            traits = []

            for row in cur.fetchall():

                traits.append({
                    "trait_id": row[0],
                    "trait_name": row[1]
                })

            # -------------------------------------------------
            # STRAINS
            # -------------------------------------------------

            cur.execute("""
                SELECT
                    strain_id,
                    strain_name,
                    species,
                    genus,
                    source,
                    isolation_location,
                    gram_type
                FROM bacterial_strains
                ORDER BY strain_id;
            """)

            strains = []

            for row in cur.fetchall():

                strains.append({
                    "strain_id": row[0],
                    "strain_name": row[1],
                    "species": row[2],
                    "genus": row[3],
                    "source": row[4],
                    "isolation_location": row[5],
                    "gram_type": row[6]
                })

            # -------------------------------------------------
            # STRESS OPTIONS
            # -------------------------------------------------

            stress_options = [
                {
                    "id": "drought",
                    "name": "Drought resilience"
                }
            ]

            # -------------------------------------------------
            # RESPONSE
            # -------------------------------------------------

            return {
                "status": "success",
                "plants": plants,
                "stresses": stress_options,
                "traits": traits,
                "strains": strains,
                "consortium_sizes": [2, 3],
                "default_weights": DEFAULT_TRAIT_WEIGHTS
            }

    finally:

        conn.close()


# =========================================================
# INTERNAL HELPERS
# =========================================================

def normalize_weights(
    trait_coverage,
    compatibility,
    drought_evidence,
    literature_evidence
):

    values = [
        max(float(trait_coverage), 0),
        max(float(compatibility), 0),
        max(float(drought_evidence), 0),
        max(float(literature_evidence), 0)
    ]

    total = sum(values)

    if total <= 0:

        return DEFAULT_TRAIT_WEIGHTS.copy()

    return {
        "trait_coverage": values[0] / total * 100,
        "compatibility": values[1] / total * 100,
        "drought_evidence": values[2] / total * 100,
        "literature_evidence": values[3] / total * 100
    }


def calculate_literature_score(
    strain_name,
    species,
    evidence_sources
):

    score = 0

    strain_text = str(strain_name).lower()
    species_text = str(species).lower()

    for source in evidence_sources:

        source_text = " ".join(
            str(value)
            for value in source.values()
            if value is not None
        ).lower()

        if species_text in source_text:
            score += 50

        if strain_text in source_text:
            score += 50

    return min(score, 100)


def calculate_pair_compatibility(
    combo,
    compatibility_map
):

    pair_scores = []
    missing_pairs = []

    for pair in combinations(combo, 2):

        key = tuple(sorted(pair))

        if key in compatibility_map:

            pair_scores.append(
                compatibility_map[key]
            )

        else:

            missing_pairs.append(
                list(pair)
            )

    if pair_scores:

        score = (
            sum(pair_scores)
            / len(pair_scores)
        )

    else:

        score = 0

    return (
        score,
        pair_scores,
        missing_pairs
    )


# =========================================================
# EVIDENCE HELPER
# =========================================================

def self_evidence_sources(cur):

    cur.execute("""
        SELECT *
        FROM evidence_sources
        ORDER BY source_id;
    """)

    rows = cur.fetchall()

    columns = [
        description[0]
        for description in cur.description
    ]

    sources = []

    for row in rows:

        sources.append({
            column: row[index]
            for index, column in enumerate(columns)
        })

    return sources


# =========================================================
# CUSTOM CONSORTIUM DESIGN
# =========================================================

@app.post("/consortium-design/custom")
def custom_consortium_design(
    request: CustomDesignRequest
):

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            # =================================================
            # 1. VERIFY PLANT
            # =================================================

            cur.execute("""
                SELECT
                    plant_id,
                    scientific_name,
                    common_name
                FROM plants
                WHERE plant_id = %s;
            """, (request.plant_id,))

            plant = cur.fetchone()

            if not plant:

                raise HTTPException(
                    status_code=404,
                    detail="Selected plant was not found."
                )

            # =================================================
            # 2. GET ALL STRAINS
            # =================================================

            cur.execute("""
                SELECT
                    strain_id,
                    strain_name,
                    species,
                    genus,
                    source,
                    isolation_location,
                    gram_type
                FROM bacterial_strains
                ORDER BY strain_id;
            """)

            strain_rows = cur.fetchall()

            if not strain_rows:

                return {
                    "status": "success",
                    "candidate_count": 0,
                    "message": "No bacterial strains available."
                }

            available_ids = {
                int(row[0])
                for row in strain_rows
            }

            # =================================================
            # 3. SELECT STRAINS
            # =================================================

            if request.selected_strains:

                selected_ids = [
                    int(x)
                    for x in request.selected_strains
                    if int(x) in available_ids
                ]

            else:

                selected_ids = list(available_ids)

            selected_ids = sorted(
                set(selected_ids)
            )

            if len(selected_ids) < request.consortium_size:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Number of selected bacterial strains "
                        "is smaller than the requested "
                        "consortium size."
                    )
                )

            # =================================================
            # 4. LOAD EVIDENCE SOURCES
            # =================================================

            evidence_sources = self_evidence_sources(cur)

            # =================================================
            # 5. BUILD STRAIN DATA
            # =================================================

            strain_data = {}

            for row in strain_rows:

                strain_id = int(row[0])

                if strain_id not in selected_ids:
                    continue

                # -------------------------------------------------
                # TRAITS
                # -------------------------------------------------

                cur.execute("""
                    SELECT
                        trait_id,
                        trait_name,
                        trait_value,
                        measurement_unit,
                        evidence_level,
                        notes
                    FROM strain_traits
                    WHERE strain_id = %s
                    ORDER BY trait_id;
                """, (strain_id,))

                trait_rows = cur.fetchall()

                traits = []

                for trait in trait_rows:

                    traits.append({
                        "trait_id": trait[0],
                        "trait_name": trait[1],
                        "trait_value": trait[2],
                        "measurement_unit": trait[3],
                        "evidence_level": trait[4],
                        "notes": trait[5]
                    })

                # -------------------------------------------------
                # DROUGHT RESPONSE
                # -------------------------------------------------

                cur.execute("""
                    SELECT *
                    FROM drought_response
                    WHERE strain_id = %s
                    ORDER BY 1;
                """, (strain_id,))

                drought_rows = cur.fetchall()

                strain_data[strain_id] = {
                    "strain_id": strain_id,
                    "strain_name": row[1],
                    "species": row[2],
                    "genus": row[3],
                    "source": row[4],
                    "isolation_location": row[5],
                    "gram_type": row[6],
                    "traits": traits,
                    "drought_records": len(drought_rows)
                }

            # =================================================
            # 6. COMPATIBILITY MAP
            # =================================================

            cur.execute("""
                SELECT
                    strain_a_id,
                    strain_b_id,
                    compatibility_score
                FROM strain_compatibility;
            """)

            compatibility_map = {}

            for row in cur.fetchall():

                key = tuple(
                    sorted(
                        (
                            int(row[0]),
                            int(row[1])
                        )
                    )
                )

                compatibility_map[key] = float(row[2])

            # =================================================
            # 7. REQUIRED TRAITS
            # =================================================

            if request.selected_traits:

                required_traits = set(
                    request.selected_traits
                )

            else:

                required_traits = set()

                for data in strain_data.values():

                    for trait in data["traits"]:

                        if trait["trait_name"]:

                            required_traits.add(
                                trait["trait_name"]
                            )

            # =================================================
            # 8. NORMALIZE WEIGHTS
            # =================================================

            weights = normalize_weights(
                request.trait_coverage_weight,
                request.compatibility_weight,
                request.drought_evidence_weight,
                request.literature_evidence_weight
            )

            # =================================================
            # 9. GENERATE COMBINATIONS
            # =================================================

            combinations_to_test = list(
                combinations(
                    selected_ids,
                    request.consortium_size
                )
            )

            results = []

            # =================================================
            # 10. ANALYZE EACH COMBINATION
            # =================================================

            for combo in combinations_to_test:

                combo_traits = set()

                drought_records = 0

                literature_scores = []

                for strain_id in combo:

                    data = strain_data[strain_id]

                    # -----------------------------------------
                    # TRAITS
                    # -----------------------------------------

                    for trait in data["traits"]:

                        if trait["trait_name"]:

                            combo_traits.add(
                                trait["trait_name"]
                            )

                    # -----------------------------------------
                    # DROUGHT
                    # -----------------------------------------

                    drought_records += (
                        data["drought_records"]
                    )

                    # -----------------------------------------
                    # LITERATURE
                    # -----------------------------------------

                    literature_scores.append(
                        calculate_literature_score(
                            data["strain_name"],
                            data["species"],
                            evidence_sources
                        )
                    )

                # =================================================
                # TRAIT COVERAGE
                # =================================================

                if required_traits:

                    covered_traits = (
                        combo_traits.intersection(
                            required_traits
                        )
                    )

                    missing_traits = (
                        required_traits
                        - combo_traits
                    )

                    trait_coverage = (
                        len(covered_traits)
                        / len(required_traits)
                    ) * 100

                else:

                    covered_traits = set()

                    missing_traits = set()

                    trait_coverage = 0

                # =================================================
                # DROUGHT SCORE
                # =================================================

                drought_score = min(
                    drought_records * 10,
                    100
                )

                # =================================================
                # COMPATIBILITY
                # =================================================

                (
                    compatibility_score,
                    pair_scores,
                    missing_pairs
                ) = calculate_pair_compatibility(
                    combo,
                    compatibility_map
                )

                # =================================================
                # LITERATURE SCORE
                # =================================================

                if literature_scores:

                    literature_score = (
                        sum(literature_scores)
                        / len(literature_scores)
                    )

                else:

                    literature_score = 0

                # =================================================
                # FINAL COMPUTATIONAL SCORE
                # =================================================

                final_score = (

                    trait_coverage
                    * weights["trait_coverage"]
                    / 100

                    +

                    compatibility_score
                    * weights["compatibility"]
                    / 100

                    +

                    drought_score
                    * weights["drought_evidence"]
                    / 100

                    +

                    literature_score
                    * weights["literature_evidence"]
                    / 100
                )

                # =================================================
                # RESULT
                # =================================================

                results.append({

                    "strain_ids": list(combo),

                    "strains": [

                        {
                            "strain_id":
                                strain_data[s]["strain_id"],

                            "strain_name":
                                strain_data[s]["strain_name"],

                            "species":
                                strain_data[s]["species"]
                        }

                        for s in combo
                    ],

                    "consortium_size":
                        len(combo),

                    "covered_traits":
                        sorted(covered_traits),

                    "missing_traits":
                        sorted(missing_traits),

                    "trait_coverage_percent":
                        round(
                            trait_coverage,
                            2
                        ),

                    "drought_response_records":
                        drought_records,

                    "drought_evidence_score":
                        round(
                            drought_score,
                            2
                        ),

                    "compatibility_score":
                        round(
                            compatibility_score,
                            2
                        ),

                    "pair_compatibility_scores": [

                        round(
                            score,
                            2
                        )

                        for score in pair_scores
                    ],

                    "missing_compatibility_pairs":
                        missing_pairs,

                    "literature_evidence_score":
                        round(
                            literature_score,
                            2
                        ),

                    "computational_score":
                        round(
                            final_score,
                            2
                        )
                })

            # =================================================
            # 11. SORT RESULTS
            # =================================================

            results.sort(
                key=lambda x: (
                    x["computational_score"],
                    x["trait_coverage_percent"],
                    x["compatibility_score"],
                    x["drought_evidence_score"]
                ),
                reverse=True
            )

            # =================================================
            # 12. BEST CONSORTIUM
            # =================================================

            best = (
                results[0]
                if results
                else None
            )

            # =================================================
            # 13. EXPLANATION
            # =================================================

            explanation = []

            if best:

                explanation.append(
                    f"The highest-ranked consortium "
                    f"contains {best['consortium_size']} strains."
                )

                explanation.append(
                    f"It covers "
                    f"{best['trait_coverage_percent']}% "
                    f"of the selected traits."
                )

                explanation.append(
                    f"Its recorded compatibility score "
                    f"is {best['compatibility_score']}."
                )

                explanation.append(
                    f"The computational score is "
                    f"{best['computational_score']}."
                )

                if best["missing_traits"]:

                    explanation.append(
                        "Some selected traits are not covered: "
                        + ", ".join(
                            best["missing_traits"]
                        )
                    )

                else:

                    explanation.append(
                        "All selected traits are covered "
                        "within the database records."
                    )

            # =================================================
            # 14. FINAL RESPONSE
            # =================================================

            return {

                "status": "computed",

                "project": "EndoConsort AI",

                "plant": {

                    "plant_id": plant[0],

                    "scientific_name":
                        plant[1],

                    "common_name":
                        plant[2]
                },

                "target_stress":
                    request.stress,

                "user_selection": {

                    "selected_traits":
                        sorted(required_traits),

                    "selected_strains":
                        selected_ids,

                    "consortium_size":
                        request.consortium_size
                },

                "weights":
                    weights,

                "candidate_count":
                    len(results),

                "best_consortium":
                    best,

                "all_candidates":
                    results,

                "explanation":
                    explanation,

                "scientific_efficacy_claim":
                    False,

                "note": (
                    "This is a computational "
                    "decision-support ranking based "
                    "on database-recorded traits, "
                    "drought-response records, "
                    "compatibility scores and "
                    "literature-associated signals. "
                    "It does not establish experimental "
                    "biological efficacy or guarantee "
                    "greenhouse or field performance. "
                    "Experimental validation is required."
                ),

                "generated_at":
                    datetime.now(timezone.utc).isoformat()
            }

    except HTTPException:

        raise

    except Exception as error:

        return {
            "status": "error",
            "error": str(error)
        }

    finally:

        conn.close()


# =========================================================
# ORIGINAL CONSORTIUM DESIGN
# =========================================================

@app.get("/consortium-design")
def consortium_design():

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            # -------------------------------------------------
            # STRAINS
            # -------------------------------------------------

            cur.execute("""
                SELECT
                    strain_id,
                    strain_name,
                    species,
                    genus,
                    source,
                    isolation_location,
                    gram_type
                FROM bacterial_strains
                ORDER BY strain_id;
            """)

            strains = cur.fetchall()

            if not strains:

                return {
                    "status": "success",
                    "candidate_count": 0,
                    "message": "No bacterial strains found."
                }

            strain_data = {}

            # -------------------------------------------------
            # STRAIN DATA
            # -------------------------------------------------

            for strain in strains:

                strain_id = strain[0]

                # ---------------------------------------------
                # TRAITS
                # ---------------------------------------------

                cur.execute("""
                    SELECT
                        trait_id,
                        trait_name,
                        trait_value,
                        measurement_unit,
                        evidence_level
                    FROM strain_traits
                    WHERE strain_id = %s
                    ORDER BY trait_id;
                """, (strain_id,))

                trait_rows = cur.fetchall()

                traits = []

                for row in trait_rows:

                    traits.append({
                        "trait_id": row[0],
                        "trait_name": row[1],
                        "trait_value": row[2],
                        "measurement_unit": row[3],
                        "evidence_level": row[4]
                    })

                # ---------------------------------------------
                # DROUGHT
                # ---------------------------------------------

                cur.execute("""
                    SELECT *
                    FROM drought_response
                    WHERE strain_id = %s
                    ORDER BY 1;
                """, (strain_id,))

                drought_rows = cur.fetchall()

                strain_data[strain_id] = {

                    "strain_id":
                        strain_id,

                    "strain_name":
                        strain[1],

                    "species":
                        strain[2],

                    "genus":
                        strain[3],

                    "source":
                        strain[4],

                    "isolation_location":
                        strain[5],

                    "gram_type":
                        strain[6],

                    "traits":
                        traits,

                    "drought_records":
                        [
                            list(row)
                            for row in drought_rows
                        ]
                }

            # -------------------------------------------------
            # COMPATIBILITY
            # -------------------------------------------------

            cur.execute("""
                SELECT
                    compatibility_id,
                    strain_a_id,
                    strain_b_id,
                    compatibility_score,
                    interaction_type,
                    evidence_level,
                    notes
                FROM strain_compatibility
                ORDER BY compatibility_id;
            """)

            compatibility_rows = cur.fetchall()

            compatibility_map = {}

            for row in compatibility_rows:

                key = tuple(
                    sorted(
                        (
                            int(row[1]),
                            int(row[2])
                        )
                    )
                )

                compatibility_map[key] = float(row[3])

            # -------------------------------------------------
            # REQUIRED TRAITS
            # -------------------------------------------------

            required_traits = set()

            for data in strain_data.values():

                for trait in data["traits"]:

                    if trait["trait_name"]:

                        required_traits.add(
                            trait["trait_name"]
                        )

            required_traits = sorted(
                required_traits
            )

            # -------------------------------------------------
            # COMBINATIONS
            # -------------------------------------------------

            strain_ids = list(
                strain_data.keys()
            )

            combinations_to_test = []

            if len(strain_ids) >= 2:

                combinations_to_test.extend(
                    combinations(
                        strain_ids,
                        2
                    )
                )

            if len(strain_ids) >= 3:

                combinations_to_test.extend(
                    combinations(
                        strain_ids,
                        3
                    )
                )

            consortium_results = []

            # -------------------------------------------------
            # EVALUATION
            # -------------------------------------------------

            for combo in combinations_to_test:

                combo_traits = set()

                drought_records = 0

                for strain_id in combo:

                    data = strain_data[strain_id]

                    for trait in data["traits"]:

                        if trait["trait_name"]:

                            combo_traits.add(
                                trait["trait_name"]
                            )

                    drought_records += len(
                        data["drought_records"]
                    )

                # ---------------------------------------------
                # TRAIT COVERAGE
                # ---------------------------------------------

                if required_traits:

                    covered_traits = (
                        combo_traits.intersection(
                            set(required_traits)
                        )
                    )

                    trait_coverage = (
                        len(covered_traits)
                        / len(required_traits)
                    ) * 100

                else:

                    covered_traits = set()

                    trait_coverage = 0

                # ---------------------------------------------
                # COMPATIBILITY
                # ---------------------------------------------

                pair_scores = []

                missing_pairs = []

                for pair in combinations(
                    combo,
                    2
                ):

                    key = tuple(
                        sorted(pair)
                    )

                    if key in compatibility_map:

                        pair_scores.append(
                            compatibility_map[key]
                        )

                    else:

                        missing_pairs.append(
                            list(pair)
                        )

                if pair_scores:

                    compatibility_score = (
                        sum(pair_scores)
                        / len(pair_scores)
                    )

                else:

                    compatibility_score = 0

                # ---------------------------------------------
                # DROUGHT SCORE
                # ---------------------------------------------

                drought_score = min(
                    drought_records * 10,
                    100
                )

                # ---------------------------------------------
                # FINAL SCORE
                # ---------------------------------------------

                final_score = (

                    trait_coverage * 0.50

                    +

                    compatibility_score * 0.40

                    +

                    drought_score * 0.10
                )

                # ---------------------------------------------
                # RESULT
                # ---------------------------------------------

                consortium_results.append({

                    "strain_ids":
                        list(combo),

                    "strains": [

                        {
                            "strain_id":
                                strain_data[s]["strain_id"],

                            "strain_name":
                                strain_data[s]["strain_name"],

                            "species":
                                strain_data[s]["species"]
                        }

                        for s in combo
                    ],

                    "consortium_size":
                        len(combo),

                    "covered_traits":
                        sorted(covered_traits),

                    "trait_coverage_percent":
                        round(
                            trait_coverage,
                            2
                        ),

                    "drought_response_records":
                        drought_records,

                    "compatibility_score":
                        round(
                            compatibility_score,
                            2
                        ),

                    "pair_compatibility_scores": [

                        round(
                            score,
                            2
                        )

                        for score in pair_scores
                    ],

                    "missing_compatibility_pairs":
                        missing_pairs,

                    "computational_score":
                        round(
                            final_score,
                            2
                        )
                })

            # -------------------------------------------------
            # SORT
            # -------------------------------------------------

            consortium_results.sort(
                key=lambda x: (
                    x["computational_score"],
                    x["trait_coverage_percent"],
                    x["compatibility_score"]
                ),
                reverse=True
            )

            best_consortium = (
                consortium_results[0]
                if consortium_results
                else None
            )

            # -------------------------------------------------
            # RESPONSE
            # -------------------------------------------------

            return {

                "status":
                    "computed",

                "project":
                    "EndoConsort AI",

                "target_crop":
                    "Vigna radiata",

                "target_stress":
                    "Drought resilience",

                "method": (
                    "multi_strain_trait_coverage_"
                    "compatibility_and_drought_"
                    "record_ranking"
                ),

                "scientific_efficacy_claim":
                    False,

                "available_strains":
                    len(strains),

                "required_trait_count":
                    len(required_traits),

                "required_traits":
                    required_traits,

                "tested_consortium_count":
                    len(consortium_results),

                "best_consortium":
                    best_consortium,

                "all_consortium_candidates":
                    consortium_results,

                "compatibility_records": [

                    {
                        "compatibility_id":
                            int(row[0]),

                        "strain_a_id":
                            int(row[1]),

                        "strain_b_id":
                            int(row[2]),

                        "compatibility_score":
                            float(row[3]),

                        "interaction_type":
                            row[4],

                        "evidence_level":
                            row[5],

                        "notes":
                            row[6]
                    }

                    for row in compatibility_rows
                ],

                "note": (
                    "Consortiums are computationally "
                    "ranked using recorded trait "
                    "coverage, drought-response "
                    "records and database compatibility "
                    "scores. This ranking does not "
                    "establish experimental biological "
                    "efficacy, microbial interaction, "
                    "greenhouse performance or field "
                    "performance. Experimental validation "
                    "is required."
                )
            }

    except Exception as error:

        return {
            "status": "error",
            "error": str(error)
        }

    finally:

        conn.close()


# =========================================================
# LIVE LITERATURE SEARCH
# =========================================================

@app.get("/literature/search")
def literature_search(
    plant: str,
    stress: str,
    strain: str | None = None,
    trait: str | None = None,
    page_size: int = 10
):

    page_size = min(
        max(page_size, 1),
        20
    )

    try:

        result = search_drought_evidence(
            plant=plant,
            stress=stress,
            strain=strain,
            trait=trait,
            page_size=page_size
        )

        return {
            "status": "success",
            **result
        }

    except Exception as error:

        return {
            "status": "error",
            "query": None,
            "total_results": 0,
            "papers": [],
            "source": "Europe PMC",
            "message": str(error)
        }


# =========================================================
# REPORT DATA
# =========================================================

@app.post("/report/data")
def report_data(
    request: CustomDesignRequest
):

    result = custom_consortium_design(
        request
    )

    if result.get("status") != "computed":

        return result

    return {

        "status":
            "ready",

        "report_type":
            "EndoConsort AI Computational Consortium Design Report",

        "generated_at":
            datetime.now(timezone.utc).isoformat(),

        "project":
            "EndoConsort AI",

        "analysis":
            result
    }


# =========================================================
# PDF REPORT
# =========================================================

@app.post("/report/pdf")
def report_pdf(
    request: CustomDesignRequest
):

    result = custom_consortium_design(
        request
    )

    if result.get("status") != "computed":

        return result

    report_data = {

        "status":
            "ready",

        "generated_at":
            datetime.now(timezone.utc).isoformat(),

        "project":
            "EndoConsort AI",

        "analysis":
            result
    }

    pdf_buffer = generate_report_pdf(
        report_data
    )

    return StreamingResponse(

        pdf_buffer,

        media_type="application/pdf",

        headers={
            "Content-Disposition":
                "attachment; filename=EndoConsort_AI_Report.pdf"
        }
    )