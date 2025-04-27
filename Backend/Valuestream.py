from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.tavily import TavilyTools
from agno.tools import tool
import csv
from io import StringIO
import json
from agno.memory.db.sqlite import SqliteMemoryDb
from agno.memory.agent import AgentMemory
from agno.memory.v2.memory import Memory
from rich.pretty import pprint
from agno.memory.v2.schema import UserMemory
from agno.storage.sqlite import SqliteStorage
import tempfile
import os
from typing import Generator
from dotenv import load_dotenv

# FastAPI imports
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()

# FastAPI app
app = FastAPI(title="Valuestream Agent API", 
              description="API for interacting with the Valuestream Agent")

# Request model
class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    user_input: str

# Database file path
db_file = "tmp/agent.db"

# Custom tool for generating CSV files
@tool
def generate_csv(table_data_json: str) -> str:
    """
    Generate a CSV file from table data provided as JSON and save it in a local ./output directory.
    Returns the absolute path to the saved CSV file.
    
    The input should be a valid JSON string representing an array of objects, where each object
    represents a row in the CSV file. For example:
    [{"Stage Name": "Stage 1", "Description": "Description 1"}, {"Stage Name": "Stage 2", "Description": "Description 2"}]
    """
    try:
        # For debugging, write the raw input to a file
        debug_dir = "./output/debug"
        os.makedirs(debug_dir, exist_ok=True)
        with open(os.path.join(debug_dir, "raw_json_input.txt"), 'w') as f:
            f.write(table_data_json)
        
        # Try to clean the JSON string before parsing
        # Remove any markdown formatting or extra text that might be present
        # Look for the first '[' and last ']' to extract just the JSON array
        start_idx = table_data_json.find('[')
        end_idx = table_data_json.rfind(']') + 1
        
        if start_idx >= 0 and end_idx > start_idx:
            # Extract what appears to be the JSON array
            cleaned_json = table_data_json[start_idx:end_idx]
            try:
                table_data = json.loads(cleaned_json)
            except json.JSONDecodeError as e:
                # If that fails, try the original string
                table_data = json.loads(table_data_json)
        else:
            # If we can't find brackets, try parsing the original string
            table_data = json.loads(table_data_json)
        
        # Define the output directory
        output_dir = "./output"
        os.makedirs(output_dir, exist_ok=True)  # Create directory if it doesn't exist
        
        # Define the CSV file path
        csv_file_path = os.path.join(output_dir, "value_stream.csv")
        
        # Write the CSV file
        with open(csv_file_path, 'w', newline='') as csv_file:
            if table_data and len(table_data) > 0:
                writer = csv.DictWriter(csv_file, fieldnames=table_data[0].keys())
                writer.writeheader()
                writer.writerows(table_data)
            else:
                # Handle empty or invalid data
                csv_file.write("No valid data provided")
        
        # Return the absolute file path
        return os.path.abspath(csv_file_path)
    
    except json.JSONDecodeError as e:
        # Log the error details
        error_msg = f"JSON parsing error: {str(e)}\n"
        error_msg += f"Error at position {e.pos}, line {e.lineno}, column {e.colno}\n"
        
        # Create error log directory
        error_dir = "./output/errors"
        os.makedirs(error_dir, exist_ok=True)
        
        # Write error details and the problematic JSON to a file
        error_file = os.path.join(error_dir, "json_error.log")
        with open(error_file, 'w') as f:
            f.write(error_msg)
            f.write("\n--- Raw JSON Input ---\n")
            f.write(table_data_json)
        
        # Return error message
        return f"Error parsing JSON data. Details saved to {error_file}"
    
    except Exception as e:
        # Handle any other exceptions
        return f"Error generating CSV: {str(e)}"

def initialize_agent(user_id: str, session_id: str):
    """Initialize the agent with the given user_id and session_id"""
    # Initialize memory
    memory = Memory(
        # Use any model for creating memories
        model=OpenAIChat(id="gpt-4.1"),
        db=SqliteMemoryDb(table_name="user_memories", db_file=db_file),
    )
    
    # Initialize storage
    storage = SqliteStorage(table_name="agent_sessions", db_file=db_file)
    
    # Create the value stream agent
    agent = Agent(
        model=OpenAIChat(id="gpt-4o-mini"),
        tools=[TavilyTools(api_key = os.getenv('TAVILY_API_KEY')), generate_csv],
        user_id=user_id,
        session_id=session_id,
        memory=memory,
        add_datetime_to_instructions=True,
        read_chat_history=True,
        storage=storage,
        description="""
        You are a value stream assistant. Your task is to help users map and manage their value streams. 
        When a user provides a name for a value stream, you should:
        1. Ask for the company that this value stream belongs to.
        2. Once you have the company, ask if the user has defined the stages for this value stream. 
           If not, offer to provide default stages or help define them. You can use web search to find 
           typical stages for similar value streams in that company or industry.
        3. After determining the stages, ask if the user wants to generate a table representing the 
           value stream with these stages.
        4. If the user wants the table, generate a markdown table with at least eight informations types for each values stage for the the user given value stream.
        5. Finally, ask if the user wants the table data in a CSV file. If yes, use the generate_csv tool 
           to create the CSV content and include it in your response.
        Remember to use the web_search_using_tavily tool when you need to find information about value streams or stages.
        """,
        add_history_to_messages=True,
        enable_agentic_memory=True,
        markdown=True,
        enable_user_memories=True,
        stream=True
    )
    
    return agent

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React app origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/valuestream/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Endpoint for chatting with the Valuestream agent.
    Returns a streaming response with the agent's replies.
    """
    try:
        # Initialize agent with the provided user_id and session_id
        agent = initialize_agent(request.user_id, request.session_id)
        
        # Create a generator function for streaming the response
        def response_generator() -> Generator[str, None, None]:
            chunks = agent.run(request.user_input, stream=True, show_full_reasoning=True, stream_intermediate_steps=False)
            for chunk in chunks:
                yield chunk.content
        
        # Return a streaming response
        return StreamingResponse(
            response_generator(),
            media_type="text/event-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# For testing purposes - this will be executed when the script is run directly
if _name_ == "_main_":
    uvicorn.run(app, host="127.0.0.1", port=8000)