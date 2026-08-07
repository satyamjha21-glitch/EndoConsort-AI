from fastapi import FastAPI

app = FastAPI(
    title="EndoConsort AI API",
    description=(
        "Database-driven computational platform for "
        "designing indigenous multi-strain endophytic "
        "bacterial consortia for drought resilience in "
        "Vigna radiata."
    ),
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "project": "EndoConsort AI",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }