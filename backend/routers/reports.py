import io
import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse

from core.dependencies import get_current_user
from models.report import Report
from services.firestore import firestore_service
from services.storage import storage_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _fix_report_datetimes(data: dict) -> None:
    """Convert Firestore Timestamp objects to ISO strings."""
    if hasattr(data.get("generated_at"), "isoformat"):
        data["generated_at"] = data["generated_at"].isoformat()


@router.get("/reports/{report_id}", summary="Get a report by id")
async def get_report(
    report_id: str,
    uid: Annotated[str, Depends(get_current_user)],
):
    """Return a full coaching report."""
    report_data = await firestore_service.get_report(report_id)
    if report_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    _fix_report_datetimes(report_data)
    return Report(**report_data).model_dump(mode="json")


@router.post("/reports/{report_id}/generate-pdf", summary="Generate a PDF for a report")
async def generate_report_pdf(
    report_id: str,
    uid: Annotated[str, Depends(get_current_user)],
):
    """
    Generate a PDF version of a report and upload it to GCS.
    Returns a signed download URL valid for 24 hours.
    """
    report_data = await firestore_service.get_report(report_id)
    if report_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    _fix_report_datetimes(report_data)
    report = Report(**report_data)

    try:
        pdf_bytes = _build_pdf(report)
        pdf_url = await storage_service.upload_report_pdf(pdf_bytes, report_id)
        # Persist the URL back to Firestore
        await firestore_service.save_report({**report_data, "pdf_url": pdf_url})
    except Exception as e:
        logger.error(f"generate_report_pdf error for {report_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF.")

    return {"pdf_url": pdf_url}


@router.get("/reports/{report_id}/download", summary="Download the PDF for a report")
async def download_report_pdf(
    report_id: str,
    uid: Annotated[str, Depends(get_current_user)],
):
    """
    Redirect to a signed GCS URL for downloading the report PDF.
    Returns 404 if the PDF has not been generated yet.
    """
    report_data = await firestore_service.get_report(report_id)
    if report_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    pdf_url = report_data.get("pdf_url")
    if not pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF not yet generated. Call POST /reports/{report_id}/generate-pdf first.",
        )

    # If the stored URL is a GCS gs:// path, generate a fresh signed URL
    if pdf_url.startswith("gs://"):
        blob_path = pdf_url.split("/", 3)[-1]  # strip "gs://bucket/"
        try:
            pdf_url = await storage_service.get_signed_url(blob_path, expiration_hours=1)
        except Exception as e:
            logger.error(f"Signed URL generation error for {report_id}: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to generate download link.")

    return RedirectResponse(url=pdf_url, status_code=302)



# PDF builder

def _build_pdf(report: Report) -> bytes:
    """Build a PDF report using fpdf2. Returns raw PDF bytes."""
    try:
        from fpdf import FPDF
    except ImportError:
        raise RuntimeError("fpdf2 is not installed. Run: pip install fpdf2")

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 12, "Speakprime Coaching Report", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    generated_str = (
        report.generated_at.strftime("%B %d, %Y %H:%M UTC")
        if isinstance(report.generated_at, datetime)
        else str(report.generated_at)
    )
    pdf.cell(0, 8, f"Generated: {generated_str}", ln=True, align="C")
    pdf.ln(6)

    # Scores section
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "Performance Scores", ln=True)
    pdf.set_font("Helvetica", "", 11)

    scores = report.scores
    score_rows = [
        ("Overall", scores.overall),
        ("Clarity", scores.clarity),
        ("Confidence", scores.confidence),
        ("Pacing", scores.pacing),
        ("Eye Contact", scores.eye_contact),
        ("Filler Words", scores.filler_words),
        ("Answer Structure", scores.answer_structure),
    ]
    for label, value in score_rows:
        bar = "█" * (value // 10) + "░" * (10 - value // 10)
        pdf.cell(60, 7, label, border=0)
        pdf.cell(80, 7, bar, border=0)
        pdf.cell(20, 7, f"{value}/100", ln=True)
    pdf.ln(4)

    # Filler words
    if report.filler_word_breakdown:
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Filler Word Usage", ln=True)
        pdf.set_font("Helvetica", "", 11)
        for fw in report.filler_word_breakdown:
            pdf.cell(0, 7, f'  "{fw.word}": {fw.count} time(s)', ln=True)
        pdf.ln(4)

    # Recommendations
    if report.recommendations:
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Recommendations", ln=True)
        pdf.set_font("Helvetica", "", 11)
        for i, rec in enumerate(report.recommendations, 1):
            priority_label = f"[{rec.priority.upper()}]"
            pdf.set_font("Helvetica", "B", 11)
            pdf.cell(0, 7, f"{i}. {rec.category} {priority_label}", ln=True)
            pdf.set_font("Helvetica", "", 11)
            pdf.multi_cell(0, 6, f"   {rec.tip}")
        pdf.ln(4)

    # Slide reports (presentation mode)
    if report.slide_reports:
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Slide Analysis", ln=True)
        pdf.set_font("Helvetica", "", 11)
        for slide in report.slide_reports:
            pdf.set_font("Helvetica", "B", 11)
            pdf.cell(
                0, 7, f"Slide {slide.slide_number}  [{slide.status.upper()}]", ln=True)
            pdf.set_font("Helvetica", "", 11)
            pdf.multi_cell(0, 6, f"   {slide.feedback}")
        pdf.ln(4)

    return bytes(pdf.output())
