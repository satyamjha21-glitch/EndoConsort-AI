import json
import urllib.parse
import urllib.request
from typing import Any


EUROPE_PMC_URL = (
    "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
)


def search_europe_pmc(
    query: str,
    page_size: int = 10
) -> dict[str, Any]:

    params = {
        "query": query,
        "format": "json",
        "pageSize": page_size,
        "resultType": "core",
    }

    url = (
        EUROPE_PMC_URL
        + "?"
        + urllib.parse.urlencode(params)
    )

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "EndoConsort-AI/1.0"
        },
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=20
        ) as response:

            data = json.loads(
                response.read().decode("utf-8")
            )

        return data

    except Exception as error:

        return {
            "error": str(error),
            "hitCount": 0,
            "resultList": {
                "result": []
            },
        }


def simplify_results(data: dict[str, Any]) -> list[dict]:

    results = (
        data
        .get("resultList", {})
        .get("result", [])
    )

    simplified = []

    for paper in results:

        simplified.append({
            "title": paper.get("title"),
            "authors": paper.get("authorString"),
            "journal": paper.get("journalTitle"),
            "year": paper.get("pubYear"),
            "doi": paper.get("doi"),
            "pmid": paper.get("pmid"),
            "pmcid": paper.get("pmcid"),
            "abstract": paper.get("abstractText"),
            "source": "Europe PMC",
        })

    return simplified


def build_drought_query(
    plant: str,
    stress: str,
    strain: str | None = None,
    trait: str | None = None,
) -> str:

    parts = [
        f'"{plant}"',
        f'"{stress}"',
    ]

    if strain:
        parts.append(f'"{strain}"')

    if trait:
        parts.append(f'"{trait}"')

    return " AND ".join(parts)


def search_drought_evidence(
    plant: str,
    stress: str,
    strain: str | None = None,
    trait: str | None = None,
    page_size: int = 10,
) -> dict:

    query = build_drought_query(
        plant=plant,
        stress=stress,
        strain=strain,
        trait=trait,
    )

    raw = search_europe_pmc(
        query=query,
        page_size=page_size,
    )

    return {
        "query": query,
        "total_results": raw.get(
            "hitCount",
            0
        ),
        "papers": simplify_results(raw),
        "source": "Europe PMC",
    }