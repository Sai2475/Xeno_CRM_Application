from faker import Faker
import random
import uuid
from datetime import datetime, timedelta
import os
import sys

# Ensure backend module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.database import db, customers_table, orders_table, campaigns_table, communications_table

fake = Faker()

def calculate_health_score(total_spend, days_since_last):
    if days_since_last > 45 or total_spend < 1000:
        return 'Red'
    elif days_since_last > 20:
        return 'Yellow'
    return 'Green'

def seed_database():
    print("Clearing existing data...")
    db.truncate()

    print("Seeding Customers and Orders...")
    cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai']
    sources = ['Facebook', 'Instagram', 'Google Ads', 'Organic', 'Referral']
    categories = ['Electronics', 'Apparel', 'Home Decor', 'Beauty', 'Accessories']

    for _ in range(500):
        customer_id = str(uuid.uuid4())
        num_orders = random.randint(1, 10)
        total_spend = 0
        last_purchase_date = None

        for _ in range(num_orders):
            amount = round(random.uniform(200, 5000), 2)
            total_spend += amount
            purchase_date = fake.date_time_between(start_date='-60d', end_date='now').isoformat()
            
            if not last_purchase_date or purchase_date > last_purchase_date:
                last_purchase_date = purchase_date

            orders_table.insert({
                "order_id": str(uuid.uuid4()),
                "customer_id": customer_id,
                "amount": amount,
                "category": random.choice(categories),
                "purchase_date": purchase_date
            })

        days_since_last = (datetime.now() - datetime.fromisoformat(last_purchase_date)).days
        health_score = calculate_health_score(total_spend, days_since_last)

        customers_table.insert({
            "id": customer_id,
            "name": fake.name(),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "city": random.choice(cities),
            "age": random.randint(18, 65),
            "gender": random.choice(['Male', 'Female']),
            "acquisition_source": random.choice(sources),
            "total_spend": total_spend,
            "last_purchase_date": last_purchase_date,
            "health_score": health_score
        })

    print("Seed completed successfully.")

if __name__ == "__main__":
    seed_database()
