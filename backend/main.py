import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

app = FastAPI(
    title="ORCHEVRA Backend",
    description="Production-grade FastAPI pipeline graph parsing engine for ORCHEVRA AI Workflow Studio",
    version="1.0.0"
)

def get_allowed_origins() -> List[str]:
    env_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if env_origins.strip():
        return [origin.strip() for origin in env_origins.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "https://orchevra.onrender.com",
    ]


# Enable CORS for frontend connection (production configuration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas for validation
class NodeModel(BaseModel):
    id: str
    type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class EdgeModel(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class PipelineRequest(BaseModel):
    nodes: List[NodeModel]
    edges: List[EdgeModel]

class PipelineResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool


class WorkflowGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)


class WorkflowGenerationResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

def is_directed_acyclic_graph(nodes: List[NodeModel], edges: List[EdgeModel]) -> bool:
    """
    Validate that the pipeline graph is a Directed Acyclic Graph (DAG) using
    Kahn's Algorithm for topological sorting.
    """
    from collections import deque
    
    node_ids = {node.id for node in nodes}
    for edge in edges:
        node_ids.add(edge.source)
        node_ids.add(edge.target)

    if not node_ids:
        return True

    # Build adjacency list and map in-degrees
    adj: Dict[str, List[str]] = {node_id: [] for node_id in node_ids}
    in_degree: Dict[str, int] = {node_id: 0 for node_id in node_ids}

    for edge in edges:
        adj[edge.source].append(edge.target)
        in_degree[edge.target] += 1

    # Queue of nodes with in-degree 0
    queue = deque([node_id for node_id in node_ids if in_degree[node_id] == 0])
    
    visited_count = 0
    while queue:
        node = queue.popleft()
        visited_count += 1
        
        for neighbor in adj[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    # If the number of visited nodes equals the number of unique nodes, there are no cycles.
    return visited_count == len(node_ids)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "ORCHEVRA Pipeline Orchestrator API",
        "version": "1.0.0"
    }

@app.post("/api/pipelines/parse", response_model=PipelineResponse)
def parse_pipeline(payload: PipelineRequest):
    """
    Analyzes the structure of a given flow canvas:
    - Counts active graph nodes and edges
    - Determines whether the workflow is a valid Directed Acyclic Graph (DAG)
    """
    try:
        nodes = payload.nodes
        edges = payload.edges
        
        num_nodes = len(nodes)
        num_edges = len(edges)
        
        is_dag = is_directed_acyclic_graph(nodes, edges)
        
        return PipelineResponse(
            num_nodes=num_nodes,
            num_edges=num_edges,
            is_dag=is_dag
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline parsing execution failed: {str(e)}")


@app.post("/api/gemini/generate-workflow", response_model=WorkflowGenerationResponse)
def generate_workflow(payload: WorkflowGenerationRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="Gemini API Key is missing. Please configure GEMINI_API_KEY inside your Render environment settings.",
        )

    request_body = {
        "contents": [{"parts": [{"text": payload.prompt}]}],
        "systemInstruction": {
            "parts": [
                {
                    "text": (
                        "You generate workflow JSON for a visual DAG editor. "
                        "Return JSON with keys: nodes (array), edges (array). "
                        "Each node must contain id, type, position {x,y}, and data. "
                        "Each edge must contain id, source, target, sourceHandle, targetHandle. "
                        "Never return markdown."
                    )
                }
            ]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2,
        },
    }

    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={api_key}"
    )

    try:
        req = Request(
            endpoint,
            data=json.dumps(request_body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=30) as response:
            raw = json.loads(response.read().decode("utf-8"))

        text = (
            raw.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        parsed = json.loads(text)
        if not isinstance(parsed.get("nodes"), list):
            raise ValueError("Invalid response payload: missing nodes array")
        if not isinstance(parsed.get("edges"), list):
            raise ValueError("Invalid response payload: missing edges array")
        return WorkflowGenerationResponse(nodes=parsed["nodes"], edges=parsed["edges"])
    except HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Gemini upstream error: HTTP {e.code}")
    except URLError:
        raise HTTPException(status_code=503, detail="Backend unavailable. Please try again.")
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=502, detail="Invalid response from Gemini API")
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to synthesize workflow")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=18080, reload=True)
