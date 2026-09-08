"""Document text extraction and content cleaning service."""

import logging
import re
from pathlib import Path

logger = logging.getLogger("competiq.services.document")


class DocumentService:
    """Service handling multi-format document text extraction and content cleaning."""

    @classmethod
    def clean_text(cls, text: str) -> str:
        """Clean extracted document text by removing formatting artifacts while preserving structure."""
        if not text:
            return ""

        # Normalize line breaks
        cleaned = text.replace("\r\n", "\n").replace("\r", "\n")

        # Remove control characters except tab and newline
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", cleaned)

        # Replace multiple spaces/tabs with single space within a line
        cleaned = re.sub(r"[ \t]+", " ", cleaned)

        # Strip line edges
        lines = [line.strip() for line in cleaned.split("\n")]

        # Collapse more than two consecutive empty lines
        collapsed_lines = []
        consecutive_empty = 0
        for line in lines:
            if not line:
                consecutive_empty += 1
                if consecutive_empty <= 1:
                    collapsed_lines.append("")
            else:
                consecutive_empty = 0
                collapsed_lines.append(line)

        return "\n".join(collapsed_lines).strip()

    @classmethod
    def extract_text_from_pdf(cls, file_path: Path) -> str:
        """Extract text from all readable pages of a PDF document using pypdf."""
        try:
            from pypdf import PdfReader

            reader = PdfReader(str(file_path))
            if reader.is_encrypted:
                try:
                    # Attempt decrypt with empty password for public PDFs
                    reader.decrypt("")
                except Exception:
                    raise ValueError("PDF is encrypted or password-protected.")

            text_parts = []
            for i, page in enumerate(reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        text_parts.append(page_text.strip())
                except Exception as page_exc:
                    logger.warning(f"Failed extracting text from PDF page {i + 1}: {page_exc}")

            return "\n\n".join(text_parts)
        except Exception as exc:
            logger.error(f"PDF extraction error on {file_path}: {exc}")
            raise ValueError(f"Failed to extract text from PDF: {str(exc)}")

    @classmethod
    def extract_text_from_docx(cls, file_path: Path) -> str:
        """Extract paragraphs and tables from a Word DOCX document."""
        try:
            import docx

            doc = docx.Document(str(file_path))
            text_parts = []

            # Extract body paragraphs
            for p in doc.paragraphs:
                p_text = p.text.strip()
                if p_text:
                    text_parts.append(p_text)

            # Extract table cells
            for table in doc.tables:
                for row in table.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        text_parts.append(" | ".join(row_cells))

            return "\n\n".join(text_parts)
        except Exception as exc:
            logger.error(f"DOCX extraction error on {file_path}: {exc}")
            raise ValueError(f"Failed to extract text from DOCX: {str(exc)}")

    @classmethod
    def extract_text_from_pptx(cls, file_path: Path) -> str:
        """Extract slide titles and text frames from a PowerPoint PPTX presentation."""
        try:
            from pptx import Presentation

            prs = Presentation(str(file_path))
            text_parts = []

            for i, slide in enumerate(prs.slides):
                slide_texts = []
                for shape in slide.shapes:
                    if shape.has_text_frame:
                        for paragraph in shape.text_frame.paragraphs:
                            line = paragraph.text.strip()
                            if line:
                                slide_texts.append(line)

                if slide_texts:
                    slide_content = f"--- Slide {i + 1} ---\n" + "\n".join(slide_texts)
                    text_parts.append(slide_content)

            return "\n\n".join(text_parts)
        except Exception as exc:
            logger.error(f"PPTX extraction error on {file_path}: {exc}")
            raise ValueError(f"Failed to extract text from PPTX: {str(exc)}")

    @classmethod
    def extract_text_from_txt(cls, file_path: Path) -> str:
        """Extract plain text with automatic fallback for multiple character encodings."""
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
        for enc in encodings:
            try:
                with open(file_path, "r", encoding=enc) as f:
                    return f.read()
            except UnicodeDecodeError:
                continue

        # Final fallback with replacement
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()

    @classmethod
    def extract_text_from_document(cls, file_path_str: str, file_type: str) -> str:
        """Dispatch text extraction based on file extension and return cleaned text."""
        p = Path(file_path_str)
        if not p.exists() or not p.is_file():
            raise FileNotFoundError(f"Target document file not found at path: {file_path_str}")

        clean_type = file_type.lower().lstrip(".")

        if clean_type == "pdf":
            raw_text = cls.extract_text_from_pdf(p)
        elif clean_type in {"docx", "doc"}:
            raw_text = cls.extract_text_from_docx(p)
        elif clean_type in {"pptx", "ppt"}:
            raw_text = cls.extract_text_from_pptx(p)
        elif clean_type in {"txt", "csv", "tsv", "md"}:
            raw_text = cls.extract_text_from_txt(p)
        else:
            raise ValueError(f"Unsupported document format for text extraction: '{clean_type}'")

        cleaned = cls.clean_text(raw_text)
        if not cleaned:
            raise ValueError("Document contains no extractable or readable text.")

        return cleaned

    # Convenience alias
    extract_text = extract_text_from_document
