#!/usr/bin/env python3
"""
Migration script: Add scheduled_at field to tasks table.

This script adds a TIMESTAMP column to the public.tasks table to support
task scheduling and calendar features.

Usage:
    python src/scripts/add_scheduled_at_field.py
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

import psycopg2
import psycopg2.errors
from api.src.services.database.database import _get_conn, _put_conn


def migration():
    """Add scheduled_at column to tasks table if it doesn't exist."""
    conn = _get_conn()
    cur = None
    
    try:
        cur = conn.cursor()
        
        # Check if column already exists
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='tasks' AND column_name='scheduled_at'
            );
        """)
        column_exists = cur.fetchone()[0]
        
        if column_exists:
            print("✓ Column 'scheduled_at' already exists in tasks table")
            return True
        
        # Add the scheduled_at column
        cur.execute("""
            ALTER TABLE public.tasks 
            ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        """)
        
        conn.commit()
        print("✓ Successfully added 'scheduled_at' column to tasks table")
        
        # Add index for performance
        try:
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at 
                ON public.tasks(scheduled_at);
            """)
            conn.commit()
            print("✓ Created index on 'scheduled_at' column for performance")
        except psycopg2.errors.DuplicateObject:
            print("✓ Index already exists on 'scheduled_at' column")
        
        return True
        
    except psycopg2.errors.DuplicateColumn:
        print("✓ Column 'scheduled_at' already exists")
        return True
    except Exception as e:
        print(f"✗ Error during migration: {str(e)}")
        conn.rollback()
        return False
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)


if __name__ == "__main__":
    print("Starting database migration...")
    success = migration()
    
    if success:
        print("\n✓ Migration completed successfully!")
        sys.exit(0)
    else:
        print("\n✗ Migration failed!")
        sys.exit(1)
