"""CAD service entry point. Phase 0 exposes only health information; DXF generation arrives in phase 5."""

from importlib.metadata import version

from fastapi import FastAPI

app = FastAPI(title="Colomer-Rifà CAD service", version="0.1.0")


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "libraries": {name: version(name) for name in ("ezdxf", "shapely", "trimesh")},
        # ezdxf cannot write ACIS 3DSOLID entities; "solids" will be delivered as closed meshes.
        "capabilities": {"acis_solids": False, "dwg_export": False},
    }
