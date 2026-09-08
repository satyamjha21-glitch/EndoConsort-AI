from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db_connection import test_connection, get_connection
from itertools import combinations


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
    version="1.0.0"
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
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "project": "EndoConsort AI",
        "status": "running",
        "version": "1.0.0"
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


# =========================================================
# DATABASE CHECK
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
# BACTERIAL STRAINS
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
# ALL BACTERIAL TRAITS
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
# TRAITS OF ONE STRAIN
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

                return {
                    "strain_id": strain_id,
                    "traits": []
                }

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

                record = {}

                for index, column in enumerate(columns):

                    record[column] = row[index]

                records.append(record)

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
                    "compatibility_id": row[0],
                    "strain_a_id": row[1],
                    "strain_b_id": row[2],
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

                source = {}

                for index, column in enumerate(columns):

                    source[column] = row[index]

                sources.append(source)

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
# CONSORTIUM SUMMARY
# =========================================================

@app.get("/consortium-summary")
def consortium_summary():

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            cur.execute(
                "SELECT COUNT(*) FROM plants;"
            )
            plants = cur.fetchone()[0]

            cur.execute(
                "SELECT COUNT(*) FROM bacterial_strains;"
            )
            bacteria = cur.fetchone()[0]

            cur.execute(
                "SELECT COUNT(*) FROM strain_traits;"
            )
            traits = cur.fetchone()[0]

            cur.execute(
                "SELECT COUNT(*) FROM drought_response;"
            )
            drought_records = cur.fetchone()[0]

            cur.execute(
                "SELECT COUNT(*) FROM evidence_sources;"
            )
            evidence_sources = cur.fetchone()[0]

            cur.execute(
                "SELECT COUNT(*) FROM strain_compatibility;"
            )
            compatibility_records = cur.fetchone()[0]

            return {
                "status": "success",
                "project": "EndoConsort AI",
                "target_crop": "Vigna radiata",
                "target_stress": "Drought resilience",
                "database_summary": {
                    "plants": plants,
                    "bacterial_strains": bacteria,
                    "strain_traits": traits,
                    "drought_response": drought_records,
                    "evidence_sources": evidence_sources,
                    "strain_compatibility": compatibility_records
                }
            }

    finally:

        conn.close()


# =========================================================
# CONSORTIUM DESIGN
# =========================================================

@app.get("/consortium-design")
def consortium_design():

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            # ==========================================
            # 1. GET BACTERIAL STRAINS
            # ==========================================

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


            # ==========================================
            # 2. GET TRAITS
            # ==========================================

            strain_data = {}

            for strain in strains:

                strain_id = strain[0]

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


                # ==========================================
                # 3. DROUGHT RESPONSE
                # ==========================================

                cur.execute("""
                    SELECT *
                    FROM drought_response
                    WHERE strain_id = %s
                    ORDER BY 1;
                """, (strain_id,))

                drought_rows = cur.fetchall()

                strain_data[strain_id] = {

                    "strain_id": strain_id,

                    "strain_name": strain[1],

                    "species": strain[2],

                    "genus": strain[3],

                    "source": strain[4],

                    "isolation_location": strain[5],

                    "gram_type": strain[6],

                    "traits": traits,

                    "drought_records": [
                        list(row)
                        for row in drought_rows
                    ]
                }


            # ==========================================
            # 4. EXACT COMPATIBILITY DATA
            # ==========================================

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

                strain_a = int(row[1])

                strain_b = int(row[2])

                score = float(row[3])

                key = tuple(
                    sorted((strain_a, strain_b))
                )

                compatibility_map[key] = score


            # ==========================================
            # 5. REQUIRED TRAITS
            # ==========================================

            required_traits = set()

            for data in strain_data.values():

                for trait in data["traits"]:

                    trait_name = trait["trait_name"]

                    if trait_name:

                        required_traits.add(
                            trait_name
                        )

            required_traits = sorted(
                required_traits
            )


            # ==========================================
            # 6. GENERATE COMBINATIONS
            # ==========================================

            strain_ids = list(
                strain_data.keys()
            )

            combinations_to_test = []

            # Two-strain combinations
            if len(strain_ids) >= 2:

                combinations_to_test.extend(
                    combinations(
                        strain_ids,
                        2
                    )
                )

            # Three-strain combination
            if len(strain_ids) >= 3:

                combinations_to_test.extend(
                    combinations(
                        strain_ids,
                        3
                    )
                )


            consortium_results = []


            # ==========================================
            # 7. EVALUATE EACH CONSORTIUM
            # ==========================================

            for combo in combinations_to_test:

                combo_traits = set()

                drought_records = 0


                # --------------------------------------
                # Collect combined traits
                # --------------------------------------

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


                # --------------------------------------
                # Trait coverage
                # --------------------------------------

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


                # --------------------------------------
                # Compatibility
                # --------------------------------------

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


                # --------------------------------------
                # Drought evidence score
                # --------------------------------------

                drought_score = min(
                    drought_records * 10,
                    100
                )


                # ======================================
                # FINAL COMPUTATIONAL SCORE
                #
                # Trait coverage    = 50%
                # Compatibility     = 40%
                # Drought evidence  = 10%
                # ======================================

                final_score = (

                    trait_coverage * 0.50

                    + compatibility_score * 0.40

                    + drought_score * 0.10
                )


                # --------------------------------------
                # Consortium object
                # --------------------------------------

                consortium_results.append({

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
                        round(score, 2)
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


            # ==========================================
            # 8. RANK CONSORTIUMS
            # ==========================================

            consortium_results.sort(

                key=lambda x: (
                    x["computational_score"],
                    x["trait_coverage_percent"],
                    x["compatibility_score"]
                ),

                reverse=True
            )


            # ==========================================
            # 9. BEST CONSORTIUM
            # ==========================================

            best_consortium = (

                consortium_results[0]

                if consortium_results

                else None
            )


            # ==========================================
            # 10. CLOSE CONNECTION
            # ==========================================

            return {

                "status": "computed",

                "project":
                    "EndoConsort AI",

                "target_crop":
                    "Vigna radiata",

                "target_stress":
                    "Drought resilience",

                "method":
                    (
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

                "note":
                    (
                        "Consortiums are computationally "
                        "ranked using recorded trait coverage, "
                        "drought-response records and database "
                        "compatibility scores. This ranking "
                        "does not establish experimental "
                        "biological efficacy, microbial "
                        "interaction, greenhouse performance "
                        "or field performance. Experimental "
                        "validation is required."
                    )
            }

    except Exception as error:

        return {

            "status": "error",

            "error": str(error)
        }

    finally:

        conn.close()