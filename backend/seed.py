import asyncio
import random
from datetime import datetime, timedelta
from faker import Faker
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.database import customers_collection

fake = Faker()

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

    print("Seeding 300 Gym Members...")
    membership_types = ['Basic', 'Premium', 'VIP']
    classes = ['Yoga', 'CrossFit', 'HIIT', 'Pilates', 'Zumba', 'Spin']

    members = []
    now = datetime.utcnow()

    for _ in range(300):
        membership_type = random.choice(membership_types)
        join_date = fake.date_time_between(start_date='-2y', end_date='now')
        
        # Determine active vs inactive
        is_inactive = random.random() < 0.2 # 20% churn risk
        if is_inactive:
            last_visit_date = fake.date_time_between(start_date='-90d', end_date='-15d')
            cancellations = random.randint(1, 3)
            classes_attended = random.randint(0, 4)
        else:
            last_visit_date = fake.date_time_between(start_date='-14d', end_date='now')
            cancellations = 0
            classes_attended = random.randint(10, 50)

        favorite_class = random.choice(classes)
        total_spent = round(random.uniform(200, 2500), 2)
        purchase_count = random.randint(1, 24)
        
        # Membership expiry
        membership_expiry_date = join_date + timedelta(days=365)
        if membership_expiry_date < now:
            membership_expiry_date = now + timedelta(days=random.randint(5, 180))
            
        churn_risk_score = calculate_churn_risk(
            last_visit_date, cancellations, classes_attended, membership_expiry_date
        )

        members.append({
            "email": fake.email(),
            "phone": fake.phone_number(),
            "name": fake.name(),
            "membership_type": membership_type,
            "join_date": join_date.isoformat(),
            "last_visit_date": last_visit_date.isoformat(),
            "classes_attended": classes_attended,
            "favorite_class": favorite_class,
            "cancellations": cancellations,
            "total_spent": total_spent,
            "purchase_count": purchase_count,
            "membership_expiry_date": membership_expiry_date.isoformat(),
            "churn_risk_score": churn_risk_score,
            "created_at": join_date.isoformat()
        })

    await customers_collection.insert_many(members)
    print("Seed completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_database())
