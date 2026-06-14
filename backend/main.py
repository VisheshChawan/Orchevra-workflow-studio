from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

app = FastAPI(
    title="ORCHEVRA Backend",
    description="Production-grade FastAPI pipeline graph parsing engine for ORCHEVRA AI Workflow Studio",
    version="1.0.0"
)

# Enable CORS for frontend connection (production configuration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=18080, reload=True)
