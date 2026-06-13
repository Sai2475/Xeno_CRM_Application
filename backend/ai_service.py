from groq import Groq
import os
import json

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    # We will raise a RuntimeError or warning if initialization is attempted without a key
    print("Warning: GROQ_API_KEY environment variable is not set.")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
MODEL = "llama-3.3-70b-versatile"

def generate_mongo_query(query: str) -> dict:
    prompt = f"""
    Convert the following natural language query into a MongoDB filter object for a CRM audience.
    Available fields in customers collection: 
    - last_purchase_date (string, ISO format)
    - total_spent (float)
    - purchase_count (int)
    - email (string)
    - phone (string)
    
    Example Natural Language: "Customers who spent more than $5000"
    Example MongoDB Query: {{"total_spent": {{"$gt": 5000}}}}
    
    Return ONLY valid JSON.
    
    Query: "{query}"
    """
    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"},
            timeout=10.0
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error in generate_mongo_query: {e}")
        return {} # Return empty filter as fallback

def generate_campaign_content(objective: str) -> dict:
    prompt = f"""
    Generate a campaign based on the objective: "{objective}".
    Return a JSON object containing:
    1. "title": string
    2. "recommended_channel": string (sms, email, or web_push)
    3. "reasoning": string
    4. "variants": array of objects with "tone" and "message"
    
    Example Output:
    {{
        "title": "Win Back Offer",
        "recommended_channel": "sms",
        "reasoning": "High engagement for win-backs",
        "variants": [
            {{"tone": "Friendly", "message": "Hi {{first_name}}! We missed you..."}}
        ]
    }}
    Return ONLY valid JSON.
    """
    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"},
            timeout=10.0
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error in generate_campaign_content: {e}")
        return {
            "title": "Fallback Campaign",
            "recommended_channel": "sms",
            "reasoning": "Fallback generation due to API timeout.",
            "variants": [
                {"tone": "Direct", "message": "Hi, don't miss our latest offers!"}
            ]
        }

def chat_with_agent(message: str) -> str:
    prompt = f"""
    You are Xeno AI, a marketing copilot for a D2C CRM. 
    Help the user make marketing decisions based on their request.
    Keep your response concise, professional, and actionable.
    
    User: {message}
    """
    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            timeout=10.0
        )
        return completion.choices[0].message.content
    except Exception as e:
        return "I'm currently experiencing high latency. How else can I help?"
