from groq import Groq
import os
import json

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("Warning: GROQ_API_KEY environment variable is not set.")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
MODEL = "llama-3.3-70b-versatile"

def generate_mongo_query(query: str) -> dict:
    prompt = f"""
    Convert the following natural language query into a MongoDB filter object for FitFlow, a Gym CRM.
    Available fields in customers collection: 
    - membership_type (string)
    - last_visit_date (string, ISO format)
    - classes_attended (int)
    - favorite_class (string: e.g. "Yoga", "CrossFit", "HIIT")
    - cancellations (int)
    - churn_risk_score (int: 0 to 100, >70 is High Risk)
    - membership_expiry_date (string, ISO format)
    - total_spent (float)
    - email (string)
    
    Example Natural Language: "Show me members at risk of churning"
    Example MongoDB Query: {{"churn_risk_score": {{"$gte": 70}}}}

    Example Natural Language: "Gold members who love CrossFit"
    Example MongoDB Query: {{"membership_type": "Gold", "favorite_class": "CrossFit"}}
    
    STRICT RULE: Match exactly what the user asks for membership tiers. DO NOT use class attendance to define membership tiers.
    
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
        return {} 

def generate_campaign_content(objective: str, db_context: str = "") -> dict:
    prompt = f"""
    Generate a fitness campaign based on the objective: "{objective}".
    You are FitFlow AI, an expert Gym CRM marketer. 
    Analyze member class habits and recommend an optimal send time. 
    STRICT RULE: For morning/active members, recommend "5:30 AM (before 6 AM class)".
    
    Live Database Context (USE REAL NAMES/CLASSES FROM HERE):
    {db_context}
    
    CRITICAL INSTRUCTION FOR MESSAGE DRAFTING:
    - You are drafting a template that will be sent to MULTIPLE members in the segment.
    - DO NOT hardcode a specific member's name (like Arjun Reddy). You MUST use the exact placeholder {{{{name}}}}.
    - DO NOT hardcode a specific class (like Yoga) unless the objective explicitly targets that class. You MUST use the exact placeholder {{{{favorite_class}}}}.
    - DO NOT draft messages as if the recipients are instructors. Speak directly to the member.
    
    Return a JSON object containing:
    1. "title": string
    2. "recommended_channel": string (sms, email, or web_push)
    3. "optimal_send_time": string (e.g. "5:45 PM")
    4. "send_time_reasoning": string (e.g. "Expected open rate: 68% (+40% vs random time). Reasoning: Members are most active 5-7 PM.")
    5. "variants": array of exactly 3 objects. 
       - Variant 1 MUST have "tone": "Exclusive"
       - Variant 2 MUST have "tone": "Urgency"
       - Variant 3 MUST have "tone": "Personal"
       Each variant object must have "tone", "message", and "estimated_click_rate" (string, e.g. "12%").
    
    Example Output:
    {{
        "title": "Yoga Class Reminder",
        "recommended_channel": "sms",
        "optimal_send_time": "5:45 PM",
        "send_time_reasoning": "Expected open rate: 68% (+40% vs random time). Reasoning: Members are most active 5-7 PM.",
        "variants": [
            {{"tone": "Exclusive", "message": "VIP early access to our new class. Reserve your spot.", "estimated_click_rate": "15%"}},
            {{"tone": "Urgency", "message": "Only 3 spots left in the 6 PM HIIT class! Claim yours now.", "estimated_click_rate": "22%"}},
            {{"tone": "Personal", "message": "Based on your love of yoga, we think you'll enjoy this.", "estimated_click_rate": "18%"}}
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
            "title": "Fitness Motivation",
            "recommended_channel": "sms",
            "optimal_send_time": "12:00 PM",
            "send_time_reasoning": "Lunchtime motivation reminder.",
            "variants": [
                {"tone": "Exclusive", "message": "VIP access only today.", "estimated_click_rate": "10%"},
                {"tone": "Urgency", "message": "Don't skip your workout today! See you at the gym.", "estimated_click_rate": "15%"},
                {"tone": "Personal", "message": "We know you can do it.", "estimated_click_rate": "12%"}
            ]
        }

def chat_with_agent(message: str, db_context: str = "") -> str:
    prompt = f"""
    You are FitFlow AI, a marketing copilot for a Gym/Fitness Chain CRM.
    Your goal is to help the gym owner improve member retention, recommend classes, and prevent churn.

    Use Gym Context:
    - High Risk Churn: >70 churn score, hasn't visited in 30+ days. Recommend win-back offers.
    - Class Recommendations: E.g., "Members who love Yoga: 156. New Aerial Yoga class starting Tuesday. Estimated interest: 78%. Draft message..."
    - Class Capacity Alerts: E.g., "Your 6 PM CrossFit class is 85% full (17/20 spots). Send waitlist: 'Join our 6:30 AM class instead.' Predicted interest: 35%"
    - Membership Renewal: E.g., "12 memberships expiring this week. Draft: 'Hi {{{{name}}}}, your {{{{membership_type}}}} expires {{{{expiry_date}}}}. Renew now and lock in your current price forever.' Recommended channel: Email (highest open rate for renewals: 45%)"
    - Referral Campaign: E.g., "Your top members (10+ classes/month) are brand ambassadors. Send referral offer: 'Refer a friend, both get 1 month free' Estimated new members: 8-12. Revenue impact: $2,400-3,600"

    Tone: Motivational, Health-focused, Urgent (for class spots), Personal (use names, favorite classes). Never use generic salesy terms.
    
    STRICT RULE 1: NEVER hallucinate or invent member names. ONLY use the actual names provided in the Live Database Context below.
    STRICT RULE 2: Match exactly what the user asks for membership tiers.
    STRICT RULE 3: Do not use class attendance to define membership tiers unless explicitly asked.
    STRICT RULE 4: Answer naturally and directly. DO NOT say "Based on the live database context..." or "The query returned...". Just state the facts confidently as if you inherently know them.
    STRICT RULE 5: If the user asks "Who are..." or "Find members...", output a structured list of the top members using exactly this format (do not hallucinate stats, use exact stats provided!):
    Top Members:
    1. [Name]: [Classes] classes, [Tier]
    ...
    
    EXPERT CONSULTANT REPORTING FORMATS:
    - If asking about a Segment (e.g. "Find all VIP members"): Provide "Characteristics" (Avg LTV, Retention) before listing Top Members.
    - If asking for a Campaign Strategy (e.g. "Create a win-back strategy"): Structure exactly as: "SITUATION ANALYSIS", "RECOMMENDED CAMPAIGN" (Channel, Offer), "DRAFT MESSAGE", "TIMELINE", "PREDICTED RESULTS".
    - If asking for KPIs or Summary: Structure exactly as "FITFLOW GYM STATUS" (Current State, At-Risk Areas, Key Opportunities, Recommended Actions).
    - If asking for Retention or Class Performance: List out the exact percentages, LTVs, and attendance averages from the Analytics context.
    
    Live Database Context (Advanced Analytics Engine):
    {db_context}
    
    User Request: {message}

    Provide a concise, professional, and actionable response. 
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
        return "I'm currently experiencing high latency. How else can I help your gym?"
