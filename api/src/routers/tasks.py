from typing import List, Literal, Optional
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from api.src.services.database.database import _get_conn, _put_conn, SafeId
from api.src.services.database.tasks import db_create_task, db_update_task
from api.src.services.database.id_generator import _generator

router = APIRouter(prefix="/tasks", tags=["Tasks"])

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class TaskReviewItem(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    weight: int = Field(..., ge=1, le=8)
    type: Literal["CODE", "REQUIREMENT", "DESIGN", "OTHER"]
    assignee_id: Optional[SafeId] = None


class BatchReviewPayload(BaseModel):
    alert_id: SafeId
    project_id: SafeId
    tasks: List[TaskReviewItem] = Field(..., min_length=1)

class TaskUpdatePayload(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/batch-review", status_code=200)
def batch_review_tasks(payload: BatchReviewPayload):
    """
    Commit human-reviewed AI tasks to the database in a single transaction.

    Steps (all-or-nothing):
    1. Lock the ALERT row and reject if already resolved (409).
    2. Batch-insert tasks into public.tasks with bucket_id=1 and status='DRAFT'.
    3. Mark the alert as resolved.
    """
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # ------------------------------------------------------------------
        # Step 1: Lock the alert row; guard against double-processing
        # ------------------------------------------------------------------
        cur.execute(
            "SELECT is_resolved FROM public.alerts WHERE id = %s FOR UPDATE;",
            (payload.alert_id,),
        )
        alert_row = cur.fetchone()
        if alert_row is None:
            raise HTTPException(status_code=404, detail="Alert not found.")
        if alert_row["is_resolved"]:
            raise HTTPException(
                status_code=409,
                detail="Alert is already resolved. Tasks have already been committed.",
            )

        # ------------------------------------------------------------------
        # Step 1.5: Find the first bucket for the project
        # ------------------------------------------------------------------
        cur.execute(
            "SELECT id FROM public.buckets WHERE project_id = %s ORDER BY order_idx ASC LIMIT 1;",
            (payload.project_id,)
        )
        bucket_row = cur.fetchone()
        if bucket_row is None:
            raise HTTPException(status_code=400, detail="Project has no buckets to insert tasks into.")

        target_bucket_id = bucket_row["id"]

        # ------------------------------------------------------------------
        # Step 1.6: Find the max order_idx for the target bucket
        # ------------------------------------------------------------------
        cur.execute(
            "SELECT COALESCE(MAX(order_idx), -1) AS max_idx FROM public.tasks WHERE bucket_id = %s;",
            (target_bucket_id,)
        )
        max_idx_row = cur.fetchone()
        start_order_idx = max_idx_row["max_idx"] + 1

        # ------------------------------------------------------------------
        # Step 2: Batch-insert tasks (bucket_id=target_bucket_id, status=DRAFT)
        # ------------------------------------------------------------------
        insert_sql = """
            INSERT INTO public.tasks (
                id, project_id, bucket_id, lead_assignee_id,
                title, description, type, weight, status, order_idx
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        records = [
            (
                _generator.generate(),   # snowflake id
                payload.project_id,
                target_bucket_id,
                item.assignee_id,
                item.title,
                item.description,
                item.type,
                item.weight,
                "DRAFT",                  # forced: status
                start_order_idx + i,
            )
            for i, item in enumerate(payload.tasks)
        ]
        cur.executemany(insert_sql, records)

        # ------------------------------------------------------------------
        # Step 3: Resolve the alert
        # ------------------------------------------------------------------
        cur.execute(
            "UPDATE public.alerts SET is_resolved = TRUE WHERE id = %s;",
            (payload.alert_id,),
        )

        conn.commit()
        return {"status": "ok", "tasks_created": len(records)}

    except HTTPException:
        conn.rollback()
        raise
    except psycopg2.errors.ForeignKeyViolation as exc:
        # FK violation (e.g. invalid assignee_id) — transaction rolled back
        conn.rollback()
        raise HTTPException(
            status_code=422,
            detail=f"Foreign key constraint violation: {exc.diag.message_primary}",
        ) from exc
    except Exception as exc:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)

@router.get("/calendar/{project_id}")
def get_calendar_tasks(project_id: SafeId, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """
    Get tasks with scheduled dates for calendar view.
    
    Query parameters:
    - start_date: ISO format date string (YYYY-MM-DD) - defaults to first day of current month
    - end_date: ISO format date string (YYYY-MM-DD) - defaults to last day of current month
    """
    conn = _get_conn()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Parse dates or use current month
        today = datetime.now()
        if start_date:
            try:
                start = datetime.fromisoformat(start_date)
            except:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
        else:
            start = today.replace(day=1)
        
        if end_date:
            try:
                end = datetime.fromisoformat(end_date)
            except:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
        else:
            # Last day of current month
            if today.month == 12:
                end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        
        # Add 1 day to end_date to include the entire last day
        end = end + timedelta(days=1)
        
        # Query tasks with scheduled_at within the date range
        sql = """
            SELECT 
                t.id, t.project_id, t.title, t.description, 
                t.type, t.weight, t.scheduled_at, t.lead_assignee_id,
                t.bucket_id, b.state as status, b.name as bucket_name
            FROM public.tasks t
            LEFT JOIN public.buckets b ON t.bucket_id = b.id
            WHERE t.project_id = %s 
            AND t.scheduled_at IS NOT NULL
            AND t.scheduled_at >= %s
            AND t.scheduled_at < %s
            ORDER BY t.scheduled_at ASC;
        """
        
        cur.execute(sql, (project_id, start, end))
        rows = cur.fetchall()
        
        # Format results
        tasks = [dict(row) for row in rows]
        return {
            "project_id": project_id,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "tasks": tasks
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur is not None:
            cur.close()
        _put_conn(conn)
