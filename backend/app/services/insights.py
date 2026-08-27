from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import Dict, List, Tuple
from app.db.models.entry import Entry


def calculate_streak(db: Session, user_id: int) -> int:
    """Calculate the current streak of consecutive days with entries."""
    # Get all unique entry dates for the user, ordered by date descending
    entry_dates = db.query(Entry.date).filter(
        Entry.user_id == user_id
    ).distinct().order_by(Entry.date.desc()).all()
    
    if not entry_dates:
        return 0
    
    # Convert to list of dates
    dates = [row.date for row in entry_dates]
    
    # Check if today or yesterday has an entry
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    # A streak is live if it reaches today, or if it ended yesterday and today
    # simply has not been written yet.
    if today in dates:
        current_date = today
    elif yesterday in dates:
        current_date = yesterday
    else:
        return 0

    # The loop below counts the starting day itself, so streak starts at zero;
    # seeding it to 1 for the yesterday case double-counted that day.
    streak = 0
    
    # Count consecutive days
    for entry_date in dates:
        if entry_date == current_date:
            streak += 1
            current_date -= timedelta(days=1)
        elif entry_date < current_date:
            # Gap found, streak is broken
            break
    
    return streak


def get_mood_trend(db: Session, user_id: int, days: int = 30) -> List[Dict]:
    """Get mood trend data for the last N days."""
    today = date.today()
    # Include up to "tomorrow" so entries dated "today" in timezones ahead of server are included
    end_date = today + timedelta(days=1)
    start_date = today - timedelta(days=days)
    
    results = db.query(
        Entry.date,
        func.avg(Entry.mood).label('average_mood'),
        func.count(Entry.id).label('entry_count')
    ).filter(
        Entry.user_id == user_id,
        Entry.date >= start_date,
        Entry.date <= end_date
    ).group_by(Entry.date).order_by(Entry.date).all()
    
    return [
        {
            'date': row.date.isoformat(),
            'average_mood': float(row.average_mood) if row.average_mood else None,
            'entry_count': row.entry_count
        }
        for row in results
    ]


def get_summary(db: Session, user_id: int) -> Dict:
    """Get summary statistics for the user."""
    # Total entry count
    total_entries = db.query(func.count(Entry.id)).filter(
        Entry.user_id == user_id
    ).scalar()
    
    # Average mood (overall)
    avg_mood = db.query(func.avg(Entry.mood)).filter(
        Entry.user_id == user_id
    ).scalar()
    
    # Streak
    streak = calculate_streak(db, user_id)
    
    return {
        'total_entries': total_entries or 0,
        'average_mood': float(avg_mood) if avg_mood else None,
        'streak': streak
    }


