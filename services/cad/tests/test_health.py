from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_libraries_and_known_limitations() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert set(body["libraries"]) == {"ezdxf", "shapely", "trimesh"}
    assert body["capabilities"] == {"acis_solids": False, "dwg_export": False}
