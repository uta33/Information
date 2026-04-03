from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.source import Source
from app.schemas.source import SourceCreate, SourceOut, SourceUpdate
from app.services import scheduler as sched

router = APIRouter(prefix="/api/sources", tags=["sources"])


@router.get("", response_model=list[SourceOut])
async def list_sources(db: AsyncSession = Depends(get_db)):
    sources = (await db.execute(select(Source).order_by(Source.created_at))).scalars().all()
    return sources


@router.post("", response_model=SourceOut, status_code=201)
async def create_source(body: SourceCreate, db: AsyncSession = Depends(get_db)):
    source = Source(**body.model_dump())
    db.add(source)
    await db.commit()
    await db.refresh(source)
    await sched.register_source(source)
    return source


@router.patch("/{source_id}", response_model=SourceOut)
async def update_source(source_id: str, body: SourceUpdate, db: AsyncSession = Depends(get_db)):
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(source, field, value)

    await db.commit()
    await db.refresh(source)
    await sched.register_source(source)
    return source


@router.delete("/{source_id}", status_code=204)
async def delete_source(source_id: str, db: AsyncSession = Depends(get_db)):
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Not found")

    job_id = f"source_{source_id}"
    if sched.scheduler.get_job(job_id):
        sched.scheduler.remove_job(job_id)

    await db.delete(source)
    await db.commit()


@router.post("/{source_id}/fetch-now")
async def fetch_now(source_id: str, db: AsyncSession = Depends(get_db)):
    """Manually trigger a fetch for a source."""
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Not found")

    await sched._run_source(source.id, source.url, source.type, source.category)
    return {"ok": True}
