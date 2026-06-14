import asyncio
import csv
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.database import customers_collection

def calculate_churn_risk(last_visit_date, cancellations, classes_attended, membership_expiry_date):
    score = 0
    now = datetime.utcnow()
    
    # last_visit_date logic
    days_since_last_visit = (now - last_visit_date).days
    if days_since_last_visit > 30:
        score += 60
    elif days_since_last_visit > 14:
        score += 40

    # cancellations logic
    if cancellations > 0:
        score += 25

    # classes attended declining logic (simulated)
    if classes_attended < 5:
        score += 30

    # membership expiry logic
    days_until_expiry = (membership_expiry_date - now).days
    if days_until_expiry < 30:
        score += 20

    return min(score, 100)

async def seed_database():
    print("Clearing existing customers...")
    await customers_collection.delete_many({})

    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'gym_customers_sample.csv'))
    print(f"Seeding members from {csv_path}...")
    
    members = []
    
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                join_date = datetime.strptime(row['join_date'].strip(), '%d-%m-%Y')
                last_visit_date = datetime.strptime(row['last_visit_date'].strip(), '%d-%m-%Y')
                membership_expiry_date = datetime.strptime(row['membership_expiry_date'].strip(), '%d-%m-%Y')
            except ValueError:
                continue

            cancellations = int(row['cancellations'])
            classes_attended = int(row['classes_attended'])
            
            churn_risk_score = calculate_churn_risk(
                last_visit_date, cancellations, classes_attended, membership_expiry_date
            )

            members.append({
                "email": row['email'],
                "phone": row['phone'],
                "name": row['name'],
                "membership_type": row['membership_type'],
                "join_date": join_date.isoformat(),
                "last_visit_date": last_visit_date.isoformat(),
                "classes_attended": classes_attended,
                "favorite_class": row['favorite_class'],
                "cancellations": cancellations,
                "total_spent": float(row['total_spent']),
                "purchase_count": int(row['purchase_count']),
                "membership_expiry_date": membership_expiry_date.isoformat(),
                "churn_risk_score": churn_risk_score,
                "created_at": join_date.isoformat()
            })

    if members:
        await customers_collection.insert_many(members)
        print(f"Seed completed successfully with {len(members)} members.")
    else:
        print("No valid members found to seed.")

if __name__ == "__main__":
    asyncio.run(seed_database())
