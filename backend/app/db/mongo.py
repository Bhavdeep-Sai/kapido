from __future__ import annotations

import os
from typing import Optional

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection

load_dotenv()

_client: Optional[MongoClient] = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        uri = os.getenv("MONGODB_URI")
        if not uri:
            raise RuntimeError("MONGODB_URI is not configured")
        _client = MongoClient(
            uri,
            # Assumes a long-running API service with moderate traffic.
            maxPoolSize=50,
            minPoolSize=5,
            maxIdleTimeMS=300000,
            connectTimeoutMS=10000,
            serverSelectionTimeoutMS=5000,
            socketTimeoutMS=30000,
        )
    return _client


def get_collection() -> Collection:
    db_name = os.getenv("MONGODB_DB", "kapido")
    collection_name = os.getenv("MONGODB_COLLECTION", "predictions")
    collection = get_client()[db_name][collection_name]
    collection.create_index("timestamp")
    collection.create_index([("location", 1), ("hour", 1)], name="location_hour_idx")
    collection.create_index([("hour", 1), ("gap", -1)], name="hour_gap_idx")
    collection.create_index([("location", 1), ("gap", -1)], name="location_gap_idx")
    return collection
