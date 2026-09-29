"""Dataset cleaning pipeline for kidney stone detection project.

This module performs production-grade dataset validation and cleaning
for the raw ultrasound image dataset used by the CNN.

Main features
-------------
- Validate raw dataset structure (class folders, supported extensions).
- Scan all images and detect:
  - unreadable/corrupted files
  - images with too-small resolution
  - unexpected number of channels or modes
- Generate class balance and image statistics report.
- Detect exact duplicate images using file hashes.
- Safely write a cleaned copy of the dataset to a separate directory
  without modifying the original `raw_dataset` by default.
- Command-line interface for easy use in preprocessing pipelines.

Typical usage
-------------
Run from project root (where this file lives in `src/`):

    python -m src.data_cleaning \
        --source-dir raw_dataset \
        --output-dir raw_dataset_clean \
        --min-width 128 --min-height 128

After cleaning, you can point your existing `preprocess.py` to the
cleaned directory instead of the original `raw_dataset` if desired.
"""

import argparse
import hashlib
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

from PIL import Image, UnidentifiedImageError


# ----------------------------
# Configuration dataclasses
# ----------------------------


@dataclass
class CleaningConfig:
    source_dir: Path
    output_dir: Path
    quarantine_dir: Path
    log_dir: Path
    min_width: int = 128
    min_height: int = 128
    valid_extensions: Tuple[str, ...] = (".jpg", ".jpeg", ".png")
    copy_mode: str = "copy"  # or "move"


@dataclass
class ImageRecord:
    path: Path
    class_name: str
    width: int
    height: int
    mode: str
    file_hash: str


@dataclass
class CleaningReport:
    total_images: int
    by_class: Dict[str, int]
    too_small: int
    corrupted: int
    invalid_mode: int
    duplicates: int
    kept: int


# ----------------------------
# Logging setup
# ----------------------------


def setup_logging(log_dir: Path) -> None:
    """Configure logging to console and file.

    Parameters
    ----------
    log_dir : Path
        Directory where log files will be written.
    """

    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "data_cleaning.log"

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Clear existing handlers (for repeated runs in same process)
    if logger.handlers:
        logger.handlers.clear()

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    # File handler
    fh = logging.FileHandler(log_file, encoding="utf-8")
    fh.setLevel(logging.INFO)
    fh.setFormatter(formatter)
    logger.addHandler(fh)

    logging.info("Logging initialized. Log file: %s", log_file)


# ----------------------------
# Core utilities
# ----------------------------


def validate_structure(config: CleaningConfig) -> List[str]:
    """Validate that the source directory has the expected structure.

    Returns
    -------
    List[str]
        List of discovered class names.
    """

    src = config.source_dir
    if not src.exists() or not src.is_dir():
        raise FileNotFoundError(
            f"Source directory not found: {src}\n"
            "Expected structure, for example:\n"
            "raw_dataset/\n"
            "  ├── stone/\n"
            "  └── no_stone/"
        )

    class_dirs: List[str] = []
    for entry in sorted(src.iterdir()):
        if entry.is_dir():
            class_dirs.append(entry.name)

    if not class_dirs:
        raise FileNotFoundError(
            f"No class subdirectories found in {src}.\n"
            "Expected at least e.g. 'stone' and 'no_stone' folders."
        )

    logging.info("Found %d class folders: %s", len(class_dirs), ", ".join(class_dirs))
    return class_dirs


def iter_image_files(
    root: Path, class_names: Iterable[str], valid_exts: Tuple[str, ...]
) -> Iterable[Tuple[str, Path]]:
    """Yield (class_name, image_path) pairs for all images under root.

    This only considers direct children of each class folder; if your
    dataset is nested deeper, you can extend this to walk subdirectories.
    """

    valid_exts = tuple(ext.lower() for ext in valid_exts)

    for cls in class_names:
        class_dir = root / cls
        if not class_dir.exists():
            logging.warning("Class folder %s does not exist. Skipping.", class_dir)
            continue

        for entry in class_dir.iterdir():
            if entry.is_file() and entry.suffix.lower() in valid_exts:
                yield cls, entry


def compute_file_hash(path: Path, chunk_size: int = 65536) -> str:
    """Compute MD5 hash of a file.

    This is used for duplicate detection. MD5 is sufficient for this
    purpose and faster than cryptographically stronger hashes.
    """

    hasher = hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(chunk_size), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def inspect_image(path: Path) -> Tuple[int, int, str]:
    """Open an image and return (width, height, mode).

    Raises
    ------
    UnidentifiedImageError
        If the image cannot be opened.
    OSError
        For other I/O related issues.
    """

    with Image.open(path) as img:
        img.load()  # Force actual read to catch more errors
        return img.width, img.height, img.mode


def scan_dataset(config: CleaningConfig, class_names: List[str]) -> Tuple[List[ImageRecord], CleaningReport]:
    """Scan the dataset and collect image metadata and quality issues."""

    records: List[ImageRecord] = []

    by_class: Dict[str, int] = {cls: 0 for cls in class_names}
    too_small = 0
    corrupted = 0
    invalid_mode = 0

    logging.info("Starting dataset scan in %s", config.source_dir)

    for cls, img_path in iter_image_files(config.source_dir, class_names, config.valid_extensions):
        try:
            width, height, mode = inspect_image(img_path)
        except (UnidentifiedImageError, OSError) as e:
            corrupted += 1
            logging.warning("Corrupted image skipped: %s (%s)", img_path, e)
            continue

        # Resolution check
        if width < config.min_width or height < config.min_height:
            too_small += 1
            logging.info(
                "Image below minimum size skipped: %s (%dx%d)", img_path, width, height
            )
            continue

        # Mode check (we expect grayscale or RGB; others will be converted later)
        if mode not in {"L", "RGB", "RGBA"}:
            invalid_mode += 1
            logging.info(
                "Image with unexpected mode skipped: %s (mode=%s)", img_path, mode
            )
            continue

        file_hash = compute_file_hash(img_path)

        records.append(
            ImageRecord(
                path=img_path,
                class_name=cls,
                width=width,
                height=height,
                mode=mode,
                file_hash=file_hash,
            )
        )
        by_class[cls] += 1

    total_images = sum(by_class.values())

    logging.info("Scan complete. Valid images: %d", total_images)
    for cls, count in by_class.items():
        logging.info("  - %s: %d images", cls, count)

    report = CleaningReport(
        total_images=total_images,
        by_class=by_class,
        too_small=too_small,
        corrupted=corrupted,
        invalid_mode=invalid_mode,
        duplicates=0,  # Filled later
        kept=0,  # Filled later
    )

    return records, report


def detect_duplicates(records: List[ImageRecord]) -> Tuple[List[ImageRecord], int]:
    """Detect duplicate images based on file hash.

    Returns
    -------
    Tuple[List[ImageRecord], int]
        - List of unique ImageRecord objects to keep
        - Number of duplicates found
    """

    hash_to_record: Dict[str, ImageRecord] = {}
    duplicates_count = 0

    for rec in records:
        if rec.file_hash in hash_to_record:
            duplicates_count += 1
            logging.info(
                "Duplicate detected: %s is duplicate of %s",
                rec.path,
                hash_to_record[rec.file_hash].path,
            )
        else:
            hash_to_record[rec.file_hash] = rec

    unique_records = list(hash_to_record.values())
    return unique_records, duplicates_count


def copy_or_move_image(
    rec: ImageRecord,
    dest_root: Path,
    copy_mode: str = "copy",
) -> Optional[Path]:
    """Copy or move a cleaned image to the destination directory.

    The image is re-saved using Pillow to enforce consistent format and
    color mode (RGB). Returns the destination path on success.
    """

    dest_class_dir = dest_root / rec.class_name
    dest_class_dir.mkdir(parents=True, exist_ok=True)

    dest_path = dest_class_dir / rec.path.name

    try:
        with Image.open(rec.path) as img:
            img = img.convert("RGB")
            if copy_mode == "move":
                # Save to destination then remove original
                img.save(dest_path)
                rec.path.unlink(missing_ok=True)
            else:
                img.save(dest_path)
    except Exception as e:  # pylint: disable=broad-except
        logging.warning("Failed to write image %s: %s", dest_path, e)
        return None

    return dest_path


def run_cleaning_pipeline(config: CleaningConfig) -> CleaningReport:
    """Run the full cleaning pipeline and return a report."""

    logging.info("\n=== DATA CLEANING PIPELINE STARTED ===")
    logging.info("Source directory: %s", config.source_dir)
    logging.info("Output directory: %s", config.output_dir)
    logging.info("Quarantine directory: %s", config.quarantine_dir)

    class_names = validate_structure(config)

    # Scan dataset
    records, report = scan_dataset(config, class_names)

    # Detect duplicates
    unique_records, dup_count = detect_duplicates(records)
    report.duplicates = dup_count

    if dup_count > 0:
        logging.info("Found %d duplicate images. Only unique images will be kept.", dup_count)

    # Prepare output directories
    if config.output_dir.exists() and any(config.output_dir.iterdir()):
        logging.warning(
            "Output directory %s is not empty. Cleaned dataset will be merged into it.",
            config.output_dir,
        )
    config.output_dir.mkdir(parents=True, exist_ok=True)
    config.quarantine_dir.mkdir(parents=True, exist_ok=True)

    kept = 0
    for rec in unique_records:
        dest = copy_or_move_image(rec, config.output_dir, config.copy_mode)
        if dest is not None:
            kept += 1

    report.kept = kept

    logging.info("\n=== DATA CLEANING SUMMARY ===")
    logging.info("Total valid images scanned: %d", report.total_images)
    for cls, count in report.by_class.items():
        logging.info("  - %s: %d", cls, count)
    logging.info("Too small images skipped: %d", report.too_small)
    logging.info("Corrupted images skipped: %d", report.corrupted)
    logging.info("Images with invalid mode skipped: %d", report.invalid_mode)
    logging.info("Duplicate images skipped: %d", report.duplicates)
    logging.info("Images kept and written to output: %d", report.kept)

    return report


# ----------------------------
# CLI interface
# ----------------------------


def parse_args(args: Optional[List[str]] = None) -> argparse.Namespace:
    """Parse command-line arguments."""

    parser = argparse.ArgumentParser(
        description="Dataset cleaning utility for kidney stone detection project.",
    )

    parser.add_argument(
        "--source-dir",
        type=str,
        default="raw_dataset",
        help="Path to the raw dataset directory (default: raw_dataset)",
    )

    parser.add_argument(
        "--output-dir",
        type=str,
        default="raw_dataset_clean",
        help=(
            "Path where the cleaned dataset will be written. "
            "Default: raw_dataset_clean"
        ),
    )

    parser.add_argument(
        "--quarantine-dir",
        type=str,
        default="quarantine",
        help="Directory for quarantined or problematic files (if used in future).",
    )

    parser.add_argument(
        "--min-width",
        type=int,
        default=128,
        help="Minimum acceptable image width (pixels). Default: 128",
    )

    parser.add_argument(
        "--min-height",
        type=int,
        default=128,
        help="Minimum acceptable image height (pixels). Default: 128",
    )

    parser.add_argument(
        "--copy-mode",
        type=str,
        choices=["copy", "move"],
        default="copy",
        help=(
            "Whether to copy or move images into the cleaned dataset. "
            "Default: copy"
        ),
    )

    parser.add_argument(
        "--log-dir",
        type=str,
        default="logs",
        help="Directory where logs will be stored (default: logs)",
    )

    return parser.parse_args(args=args)


def main(cli_args: Optional[List[str]] = None) -> int:
    """Entry point for command-line execution."""

    # Resolve project root as the directory two levels above this file if
    # used as a module under src/, otherwise fall back to CWD.
    here = Path(__file__).resolve()
    project_root = here.parent.parent

    args = parse_args(cli_args)

    source_dir = (project_root / args.source_dir).resolve()
    output_dir = (project_root / args.output_dir).resolve()
    quarantine_dir = (project_root / args.quarantine_dir).resolve()
    log_dir = (project_root / args.log_dir).resolve()

    setup_logging(log_dir)

    logging.info("Project root: %s", project_root)

    config = CleaningConfig(
        source_dir=source_dir,
        output_dir=output_dir,
        quarantine_dir=quarantine_dir,
        log_dir=log_dir,
        min_width=args.min_width,
        min_height=args.min_height,
    )

    try:
        report = run_cleaning_pipeline(config)
    except Exception as exc:  # pylint: disable=broad-except
        logging.exception("Data cleaning failed: %s", exc)
        return 1

    # Simple sanity check: ensure at least some images were kept
    if report.kept == 0:
        logging.warning("Cleaning completed but no images were kept. Check your thresholds.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
