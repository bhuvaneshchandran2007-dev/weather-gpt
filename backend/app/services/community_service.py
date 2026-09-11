import sqlite3
from datetime import datetime
from typing import List
from ..config import settings
from ..models.community import CommunityReport, CommunityReportCreate

class CommunityService:
    def __init__(self):
        self._init_db()

    def _get_conn(self):
        return sqlite3.connect(str(settings.DB_PATH))

    def _init_db(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS community_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_name TEXT NOT NULL,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                report_type TEXT NOT NULL,
                description TEXT NOT NULL,
                severity TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()

    def add_report(self, report_in: CommunityReportCreate) -> CommunityReport:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO community_reports (location_name, lat, lon, report_type, description, severity, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            report_in.location_name,
            report_in.lat,
            report_in.lon,
            report_in.report_type,
            report_in.description,
            report_in.severity,
            now_str
        ))
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return CommunityReport(
            id=new_id,
            location_name=report_in.location_name,
            lat=report_in.lat,
            lon=report_in.lon,
            report_type=report_in.report_type,
            description=report_in.description,
            severity=report_in.severity,
            created_at=now_str,
            is_verified=False,
            verification_label="UNVERIFIED COMMUNITY REPORT"
        )

    def get_reports(self, limit: int = 25) -> List[CommunityReport]:
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, location_name, lat, lon, report_type, description, severity, created_at
            FROM community_reports
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        conn.close()

        results = []
        for r in rows:
            results.append(CommunityReport(
                id=r[0],
                location_name=r[1],
                lat=r[2],
                lon=r[3],
                report_type=r[4],
                description=r[5],
                severity=r[6],
                created_at=r[7],
                is_verified=False,
                verification_label="UNVERIFIED COMMUNITY REPORT"
            ))
        return results

community_service = CommunityService()
