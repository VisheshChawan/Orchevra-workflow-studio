from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

app = FastAPI(
    title="VectorShift Flow Backend",
    description="Production-grade FastAPI pipeline graph parsing engine for VectorShift",
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
    Run cycle detection using a standard Depth First Search (DFS) 
    with 3-state node coloring:
    - 0: Unvisited (White)
    - 1: Visiting (Gray) - inside current recursion stack
    - 2: Visited (Black) - fully explored
    """
    # Build Adjacency List representing the directional edges
    adj: Dict[str, List[str]] = {node.id: [] for node in nodes}
    for edge in edges:
        if edge.source in adj:
            adj[edge.source].append(edge.target)
        else:
            # Handle edge connecting to/from undeclared nodes gracefully
            adj[edge.source] = [edge.target]

    state: Dict[str, int] = {node.id: 0 for node in nodes}

    def has_cycle(node_id: str) -> bool:
        state[node_id] = 1  # State = VISITING
        
        neighbors = adj.get(node_id, [])
        for neighbor in neighbors:
            neighbor_state = state.get(neighbor, 0)
            if neighbor_state == 1:
                return True  # Found active back-edge! Circle exists.
            elif neighbor_state == 0:
                if has_cycle(neighbor):
                    return True
                    
        state[node_id] = 2  # State = VISITED
        return False

    # Perform detection across all root nodes to cover disjointed subgraphs
    for node in nodes:
        if state.get(node.id, 0) == 0:
            if has_cycle(node.id):
                return False  # Not a DAG

    return True  # Is a DAG

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "VectorShift Pipeline Orchestrator API",
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
