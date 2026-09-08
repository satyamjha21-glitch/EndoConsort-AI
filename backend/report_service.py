from io import BytesIO
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


def generate_report_pdf(report_data: dict) -> BytesIO:

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title="EndoConsort AI Computational Consortium Design Report",
        author="EndoConsort AI",
    )

    styles = getSampleStyleSheet()

    # =====================================================
    # STYLES
    # =====================================================

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=20,
        leading=24,
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["BodyText"],
        alignment=TA_CENTER,
        fontSize=11,
        leading=15,
        spaceAfter=12,
    )

    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=13,
        leading=17,
        spaceBefore=12,
        spaceAfter=7,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontSize=9.2,
        leading=13,
        spaceAfter=5,
    )

    small_style = ParagraphStyle(
        "Small",
        parent=styles["BodyText"],
        fontSize=7.5,
        leading=10,
    )

    table_text_style = ParagraphStyle(
        "TableText",
        parent=body_style,
        fontSize=8,
        leading=10,
    )

    # =====================================================
    # DATA
    # =====================================================

    analysis = report_data.get(
        "analysis",
        report_data
    )

    plant = analysis.get(
        "plant",
        {}
    )

    user_selection = analysis.get(
        "user_selection",
        {}
    )

    weights = analysis.get(
        "weights",
        {}
    )

    best = analysis.get(
        "best_consortium"
    )

    candidates = analysis.get(
        "all_candidates",
        analysis.get(
            "candidates",
            []
        )
    )

    # =====================================================
    # HELPERS
    # =====================================================

    def safe_text(value):

        if value is None:
            return ""

        return str(value)

    def get_strain_names(consortium):

        strains = consortium.get(
            "strains",
            []
        )

        names = []

        for strain in strains:

            if isinstance(
                strain,
                dict
            ):

                name = strain.get(
                    "strain_name",
                    ""
                )

                species = strain.get(
                    "species",
                    ""
                )

                if name and species:

                    names.append(
                        f"{name} ({species})"
                    )

                elif name:

                    names.append(
                        safe_text(name)
                    )

            else:

                names.append(
                    safe_text(strain)
                )

        return names

    def make_table(
        data,
        col_widths,
        header=True,
        font_size=8,
    ):

        table = Table(
            data,
            colWidths=col_widths,
            repeatRows=1 if header else 0,
        )

        commands = [

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.4,
                colors.grey,
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "TOP",
            ),

            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                5,
            ),

            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                5,
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                4,
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                4,
            ),

            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                font_size,
            ),
        ]

        if header:

            commands.extend([

                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.lightgrey,
                ),

                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),

            ])

        table.setStyle(
            TableStyle(commands)
        )

        return table

    story = []

    # =====================================================
    # TITLE
    # =====================================================

    story.append(
        Paragraph(
            "EndoConsort AI",
            title_style,
        )
    )

    story.append(
        Paragraph(
            "Database-Driven Computational Consortium Design Report",
            subtitle_style,
        )
    )

    generated = datetime.now(
        timezone.utc
    ).strftime(
        "%Y-%m-%d %H:%M UTC"
    )

    story.append(
        Paragraph(
            f"<b>Generated:</b> {generated}",
            body_style,
        )
    )

    story.append(
        Spacer(
            1,
            5
        )
    )

    # =====================================================
    # 1. PROJECT INFORMATION
    # =====================================================

    story.append(
        Paragraph(
            "1. Project Information",
            heading_style,
        )
    )

    project_data = [

        ["Parameter", "Value"],

        [
            "Project",
            "EndoConsort AI",
        ],

        [
            "Target crop",
            safe_text(
                plant.get(
                    "scientific_name",
                    "Vigna radiata"
                )
            ),
        ],

        [
            "Common name",
            safe_text(
                plant.get(
                    "common_name",
                    "Moong bean"
                )
            ),
        ],

        [
            "Target stress",
            safe_text(
                analysis.get(
                    "target_stress",
                    "Drought resilience"
                )
            ),
        ],

        [
            "Method",
            safe_text(
                analysis.get(
                    "method",
                    "Computational consortium ranking"
                )
            ),
        ],

    ]

    story.append(
        make_table(
            project_data,
            [
                45 * mm,
                130 * mm
            ]
        )
    )

    # =====================================================
    # 2. USER SELECTION
    # =====================================================

    story.append(
        Paragraph(
            "2. Analysis Selection",
            heading_style,
        )
    )

    selected_traits = user_selection.get(
        "selected_traits",
        []
    )

    selected_strain_ids = user_selection.get(
        "selected_strains",
        []
    )

    consortium_size = user_selection.get(
        "consortium_size",
        ""
    )

    traits_text = (
        ", ".join(
            safe_text(x)
            for x in selected_traits
        )
        if selected_traits
        else "Not specified"
    )

    strain_ids_text = (
        ", ".join(
            safe_text(x)
            for x in selected_strain_ids
        )
        if selected_strain_ids
        else "Not specified"
    )

    selection_data = [

        ["Parameter", "Selected value"],

        [
            "Selected traits",
            Paragraph(
                traits_text,
                table_text_style
            ),
        ],

        [
            "Selected strain IDs",
            strain_ids_text,
        ],

        [
            "Requested consortium size",
            safe_text(
                consortium_size
            ),
        ],

    ]

    story.append(
        make_table(
            selection_data,
            [
                55 * mm,
                120 * mm
            ]
        )
    )

    # =====================================================
    # 3. PRIORITY WEIGHTS
    # =====================================================

    story.append(
        Paragraph(
            "3. Analysis Priority Weights",
            heading_style,
        )
    )

    weights_data = [

        [
            "Criterion",
            "Weight",
        ],

        [
            "Trait coverage",
            f"{weights.get('trait_coverage', 0):.2f}%",
        ],

        [
            "Compatibility",
            f"{weights.get('compatibility', 0):.2f}%",
        ],

        [
            "Drought evidence",
            f"{weights.get('drought_evidence', 0):.2f}%",
        ],

        [
            "Literature evidence",
            f"{weights.get('literature_evidence', 0):.2f}%",
        ],

    ]

    story.append(
        make_table(
            weights_data,
            [
                120 * mm,
                55 * mm
            ]
        )
    )

    # =====================================================
    # 4. BEST CONSORTIUM
    # =====================================================

    if best:

        story.append(
            Paragraph(
                "4. Highest-Ranked Consortium",
                heading_style,
            )
        )

        best_names = get_strain_names(
            best
        )

        best_strains_text = (
            ", ".join(best_names)
            if best_names
            else "Not available"
        )

        best_data = [

            [
                "Parameter",
                "Result",
            ],

            [
                "Recommended strains",
                Paragraph(
                    best_strains_text,
                    table_text_style
                ),
            ],

            [
                "Consortium size",
                safe_text(
                    best.get(
                        "consortium_size",
                        ""
                    )
                ),
            ],

            [
                "Trait coverage",
                f"{best.get('trait_coverage_percent', 0)}%",
            ],

            [
                "Compatibility score",
                safe_text(
                    best.get(
                        "compatibility_score",
                        0
                    )
                ),
            ],

            [
                "Drought evidence score",
                safe_text(
                    best.get(
                        "drought_evidence_score",
                        0
                    )
                ),
            ],

            [
                "Literature evidence score",
                safe_text(
                    best.get(
                        "literature_evidence_score",
                        0
                    )
                ),
            ],

            [
                "Final computational score",
                safe_text(
                    best.get(
                        "computational_score",
                        0
                    )
                ),
            ],

            [
                "Drought response records",
                safe_text(
                    best.get(
                        "drought_response_records",
                        0
                    )
                ),
            ],

        ]

        story.append(
            make_table(
                best_data,
                [
                    65 * mm,
                    110 * mm
                ]
            )
        )

        covered = best.get(
            "covered_traits",
            []
        )

        missing = best.get(
            "missing_traits",
            []
        )

        story.append(
            Spacer(
                1,
                6
            )
        )

        story.append(
            Paragraph(
                "<b>Covered traits:</b> "
                + (
                    ", ".join(
                        safe_text(x)
                        for x in covered
                    )
                    if covered
                    else "None"
                ),
                body_style,
            )
        )

        story.append(
            Paragraph(
                "<b>Missing selected traits:</b> "
                + (
                    ", ".join(
                        safe_text(x)
                        for x in missing
                    )
                    if missing
                    else "None"
                ),
                body_style,
            )
        )

    # =====================================================
    # 5. RANKED CANDIDATES
    # =====================================================

    if candidates:

        story.append(
            Paragraph(
                "5. Ranked Consortium Candidates",
                heading_style,
            )
        )

        candidate_rows = [

            [
                "#",
                "Consortium",
                "Size",
                "Coverage",
                "Compatibility",
                "Drought",
                "Score",
            ]

        ]

        for index, candidate in enumerate(
            candidates,
            start=1
        ):

            names = get_strain_names(
                candidate
            )

            consortium_text = (
                ", ".join(names)
                if names
                else "Not available"
            )

            candidate_rows.append(

                [
                    str(index),

                    Paragraph(
                        consortium_text,
                        table_text_style
                    ),

                    safe_text(
                        candidate.get(
                            "consortium_size",
                            ""
                        )
                    ),

                    f"{candidate.get('trait_coverage_percent', 0)}%",

                    safe_text(
                        candidate.get(
                            "compatibility_score",
                            0
                        )
                    ),

                    safe_text(
                        candidate.get(
                            "drought_evidence_score",
                            0
                        )
                    ),

                    safe_text(
                        candidate.get(
                            "computational_score",
                            0
                        )
                    ),

                ]

            )

        candidate_table = Table(
            candidate_rows,
            colWidths=[
                8 * mm,
                57 * mm,
                12 * mm,
                22 * mm,
                25 * mm,
                22 * mm,
                24 * mm,
            ],
            repeatRows=1,
        )

        candidate_table.setStyle(
            TableStyle(
                [

                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.4,
                        colors.grey,
                    ),

                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.lightgrey,
                    ),

                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "Helvetica-Bold",
                    ),

                    (
                        "FONTSIZE",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),

                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),

                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),

                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),

                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        4,
                    ),

                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        4,
                    ),

                ]
            )
        )

        story.append(
            candidate_table
        )

    # =====================================================
    # 6. EXPLANATION
    # =====================================================

    story.append(
        Paragraph(
            "6. Computational Interpretation",
            heading_style,
        )
    )

    explanation = analysis.get(
        "explanation",
        []
    )

    if explanation:

        for item in explanation:

            story.append(
                Paragraph(
                    "• "
                    + safe_text(item),
                    body_style,
                )
            )

    else:

        story.append(
            Paragraph(
                "The consortium ranking was generated using "
                "database-recorded trait coverage, compatibility, "
                "drought-response records and literature-associated "
                "signals according to the selected priority weights.",
                body_style,
            )
        )

    # =====================================================
    # 7. SCIENTIFIC LIMITATION
    # =====================================================

    story.append(
        Paragraph(
            "7. Scientific Interpretation and Limitation",
            heading_style,
        )
    )

    note = analysis.get(
        "note"
    )

    if not note:

        note = (
            "This report represents a computational "
            "decision-support analysis based on database "
            "records. The ranking does not establish "
            "experimental biological efficacy, synergistic "
            "interaction, greenhouse performance or field "
            "performance. Experimental validation is required."
        )

    story.append(
        Paragraph(
            safe_text(note),
            body_style,
        )
    )

    story.append(
        Paragraph(
            "<b>Scientific efficacy claim:</b> "
            + safe_text(
                analysis.get(
                    "scientific_efficacy_claim",
                    False
                )
            ),
            body_style,
        )
    )

    # =====================================================
    # FOOTER
    # =====================================================

    story.append(
        Spacer(
            1,
            12
        )
    )

    story.append(
        Paragraph(
            "EndoConsort AI • Database-driven computational "
            "design platform for indigenous multi-strain "
            "endophytic bacterial consortium analysis",
            small_style,
        )
    )

    # =====================================================
    # BUILD PDF
    # =====================================================

    document.build(
        story
    )

    buffer.seek(0)

    return buffer