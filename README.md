EndoConsort AI

Database-Driven Computational Design of an Indigenous Multi-Strain Endophytic Bacterial Consortium for Enhancing Drought Resilience in Vigna radiata

EndoConsort AI is a free-of-cost, database-driven computational platform designed to support the selection and ranking of multi-strain indigenous endophytic bacterial consortia for drought-resilience research in Vigna radiata (moong bean).

The platform integrates bacterial strain information, functional traits, drought-response records, compatibility information, and literature evidence to computationally rank potential bacterial consortia.

«Important: EndoConsort AI provides computational prioritization only. The results do not establish experimental biological efficacy, compatibility, greenhouse performance, or field performance. Experimental validation is required.»

---

🌱 Project Overview

Drought stress is an important constraint affecting crop productivity. Plant-associated beneficial bacteria may contribute to plant stress resilience through mechanisms such as:

- Indole-3-acetic acid (IAA) production
- Phosphate solubilization
- ACC deaminase activity
- Exopolysaccharide (EPS) production
- Siderophore production

EndoConsort AI uses these functional characteristics together with available drought-response and compatibility evidence to identify promising combinations of bacterial strains.

The system is designed around an indigenous endophytic bacterial consortium concept, with the current research target being:

Crop: Vigna radiata
Common name: Moong bean
Target stress: Drought resilience

---

🎯 Objectives

The main objectives of EndoConsort AI are to:

1. Maintain a structured database of indigenous bacterial strains.
2. Store functional bacterial traits and associated evidence.
3. Integrate drought-response information.
4. Evaluate computational compatibility between bacterial strains.
5. Identify combinations providing broad functional trait coverage.
6. Rank candidate multi-strain consortia computationally.
7. Provide literature evidence related to drought and bacterial traits.
8. Generate a downloadable computational analysis report.

---

🧬 Current Bacterial Strains

The current database contains three indigenous endophytic bacterial strains:

Strain| Species| Location| Gram Type
IND-01| Bacillus subtilis| Uttar Pradesh| Gram-positive
IND-02| Pseudomonas fluorescens| Uttar Pradesh| Gram-negative
IND-03| Bacillus velezensis| Uttar Pradesh| Gram-positive

---

🔬 Functional Traits

The platform currently works with five major functional traits:

- Indole-3-acetic acid production
- Phosphate solubilization
- ACC deaminase activity
- Exopolysaccharide production
- Siderophore production

These traits are used as computational criteria during consortium design.

---

🧠 Computational Design Approach

The platform evaluates candidate consortia using multiple computational factors:

1. Trait Coverage

Measures how many selected functional traits are represented by the candidate consortium.

2. Compatibility

Uses stored computational compatibility scores between bacterial strains.

3. Drought Evidence

Considers available drought-response records associated with the bacterial strains.

4. Literature Evidence

Uses literature retrieved from Europe PMC to provide additional scientific context.

Computational Ranking

Users can assign priorities to the different factors.

The system then calculates a computational ranking score and identifies the highest-ranked candidate consortium.

---

🗄️ Database

EndoConsort AI uses PostgreSQL for structured biological and computational data.

Main database entities

- "plants"
- "bacterial_strains"
- "strain_traits"
- "drought_response"
- "evidence"
- "evidence_sources"
- "strain_compatibility"

The production database is hosted using Supabase PostgreSQL.

---

⚙️ Technology Stack

Frontend

- HTML5
- CSS3
- JavaScript

Backend

- Python
- FastAPI
- Uvicorn

Database

- PostgreSQL
- Supabase

Scientific Literature

- Europe PMC API

Report Generation

- ReportLab

Deployment

- GitHub
- Render
- Supabase

All components are intended to operate using free-tier/free-of-cost services.

---

📁 Project Structure

EndoConsort-AI/
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── report_service.py
│   └── literature_service.py
│
├── database/
│   └── database-related files
│
├── bioinformatics/
│   └── computational analysis modules
│
├── datasets/
│   └── research datasets
│
├── notebooks/
│   └── analysis notebooks
│
├── tests/
│   └── project tests
│
├── docs/
│   └── project documentation
│
├── scripts/
│   └── utility scripts
│
├── reports/
│   └── generated reports
│
├── requirements.txt
└── README.md

---

🚀 Main Features

🌱 Plant Selection

The user selects the target plant from the available database.

💧 Stress Selection

The current platform focuses on:

Drought resilience

🧪 Trait Selection

Users can select functional bacterial traits relevant to consortium design.

🦠 Strain Selection

Users can select bacterial strains from the database.

👥 Consortium Size

The platform supports computational evaluation of different consortium sizes.

⚖️ Priority Weights

Users can assign weights to:

- Trait coverage
- Compatibility
- Drought evidence
- Literature evidence

🧬 Consortium Analysis

The backend evaluates candidate combinations and ranks them according to the selected computational criteria.

📚 Literature Evidence

The platform can query Europe PMC for relevant scientific literature.

📄 PDF Report

The final computational analysis can be exported as a PDF report.

---

🔗 Live Application

EndoConsort AI:
https://endoconsort-ai-1.onrender.com

---

🔌 API

The backend provides REST API endpoints for interacting with the database and computational analysis system.

Important endpoints include:

GET  /
GET  /health
GET  /database
GET  /plants
GET  /bacteria
GET  /bacterial-traits
GET  /bacteria/{strain_id}/traits
GET  /drought-response
GET  /evidence
GET  /evidence-sources
GET  /compatibility
GET  /design/options
GET  /consortium-design
POST /consortium-design/custom
GET  /literature/search
GET  /report/data
POST /report/pdf

---

💻 Local Development

1. Clone the repository

git clone https://github.com/satyamjha21-glitch/EndoConsort-AI.git
cd EndoConsort-AI

2. Create a virtual environment

Windows:

python -m venv .venv

Activate it:

.venv\Scripts\activate

3. Install dependencies

pip install -r requirements.txt

4. Configure environment variables

Create a ".env" file and configure the PostgreSQL database connection.

Example:

DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

«Never commit real database passwords or other secrets to GitHub.»

5. Start the backend

python -m uvicorn backend.main:app --reload

The API will normally be available at:

http://127.0.0.1:8000

6. Open the frontend

Open:

frontend/index.html

or serve the frontend using a local web server.

---

📊 Example Computational Output

The current database can identify candidate consortia based on:

- Functional trait coverage
- Drought-response records
- Compatibility scores
- Computational ranking

For example, the current dataset identifies Bacillus subtilis IND-01 + Bacillus velezensis IND-03 as a highest-ranked candidate under the current computational weighting.

This result represents computational prioritization only and should not be interpreted as proof that the strains will work together biologically or improve drought tolerance experimentally.

---

📚 Scientific Evidence

The database incorporates scientific evidence related to bacterial traits and drought response, including literature concerning:

- Bacillus subtilis
- Pseudomonas fluorescens
- Bacillus velezensis
- ACC deaminase
- Exopolysaccharide production
- Plant drought tolerance

The platform distinguishes between literature-derived evidence and experimentally validated performance of the specific database strains.

---

⚠️ Scientific Limitations

EndoConsort AI is a computational research-support platform.

The computational ranking does not establish:

- Actual bacterial compatibility
- Synergistic interactions
- Plant colonization
- Greenhouse performance
- Field performance
- Drought tolerance of the selected consortium
- Agricultural efficacy
- Safety or biosafety suitability

All shortlisted combinations require appropriate laboratory and experimental validation before biological conclusions can be made.

---

🔒 Data & Security

Sensitive credentials should be stored using environment variables.

Do not upload:

.env
database passwords
API keys
private credentials

to GitHub.

A ".gitignore" file should include sensitive files such as:

.env
.venv/
__pycache__/
*.pyc

---

📌 Project Status

Status: Active Development / Research Prototype

Current capabilities include:

- Database integration
- Bacterial strain database
- Functional trait database
- Drought-response records
- Compatibility scoring
- Computational consortium ranking
- Literature search
- PDF report generation
- Public web deployment

---

👨‍💻 Author

Satyam Jha

B.Tech Biotechnology

---

📜 Disclaimer

EndoConsort AI is intended for computational research and educational purposes. Computational scores and rankings should not be considered experimental evidence or recommendations for agricultural application.

Experimental validation is necessary to determine the actual biological performance of any proposed bacterial consortium.

---

⭐ Future Development

Potential improvements within the existing project scope include:

- Expansion of the bacterial strain database
- Addition of more experimentally supported evidence
- Improved computational ranking
- Additional literature integration
- More detailed consortium reports
- Experimental validation data integration

---

📄 License

This project is intended as an academic and research project.

License terms can be added according to the project's intended distribution and institutional requirements.
