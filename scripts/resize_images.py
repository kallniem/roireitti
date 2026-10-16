"""Resize all images in a directory while preserving their aspect ratio."""

import argparse
from pathlib import Path

import cv2


IMAGE_EXTENSIONS = {".bmp", ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp"}


def resize_image(input_path, output_path, max_width, max_height, quality):
	"""Resize one image if it exceeds either maximum dimension."""
	image = cv2.imread(str(input_path), cv2.IMREAD_UNCHANGED)
	if image is None:
		raise RuntimeError(f"Could not read image: {input_path}")

	height, width = image.shape[:2]
	scale = min(max_width / width, max_height / height, 1)
	if scale < 1:
		new_size = (round(width * scale), round(height * scale))
		image = cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)

	output_path.parent.mkdir(parents=True, exist_ok=True)
	parameters = []
	if output_path.suffix.lower() in {".jpg", ".jpeg"}:
		parameters = [cv2.IMWRITE_JPEG_QUALITY, quality]
	elif output_path.suffix.lower() == ".webp":
		parameters = [cv2.IMWRITE_WEBP_QUALITY, quality]
	if not cv2.imwrite(str(output_path), image, parameters):
		raise RuntimeError(f"Could not write image: {output_path}")


def resize_directory(input_dir, output_dir, max_width, max_height, quality, recursive):
	"""Resize supported images and return the number processed and failures."""
	pattern = "**/*" if recursive else "*"
	image_paths = (
		path
		for path in input_dir.glob(pattern)
		if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
	)
	processed = 0
	failures = 0
	for input_path in image_paths:
		output_path = output_dir / input_path.relative_to(input_dir)
		try:
			resize_image(input_path, output_path, max_width, max_height, quality)
		except RuntimeError as error:
			print(f"Warning: {error}")
			failures += 1
		else:
			processed += 1
	return processed, failures


def parse_args():
	parser = argparse.ArgumentParser(
		description="Resize images in a directory without enlarging them."
	)
	parser.add_argument("input", type=Path, help="Input directory")
	parser.add_argument(
		"-o",
		"--output",
		type=Path,
		help="Output directory (default: <input>-resized)",
	)
	parser.add_argument(
		"--max-width",
		type=int,
		default=1920,
		help="Maximum output width in pixels (default: 1920)",
	)
	parser.add_argument(
		"--max-height",
		type=int,
		default=1920,
		help="Maximum output height in pixels (default: 1920)",
	)
	parser.add_argument(
		"--quality",
		type=int,
		default=95,
		help="JPEG/WebP quality from 0 to 100 (default: 95)",
	)
	parser.add_argument(
		"-r",
		"--recursive",
		action="store_true",
		help="Also process images in subdirectories",
	)
	return parser.parse_args()


def main():
	args = parse_args()
	if not args.input.is_dir():
		raise SystemExit(f"Input directory does not exist: {args.input}")
	if args.max_width < 1 or args.max_height < 1:
		raise SystemExit("--max-width and --max-height must be at least 1")
	if not 0 <= args.quality <= 100:
		raise SystemExit("--quality must be between 0 and 100")

	output_dir = args.output or args.input.parent / f"{args.input.name}-resized"
	processed, failures = resize_directory(
		args.input,
		output_dir,
		args.max_width,
		args.max_height,
		args.quality,
		args.recursive,
	)
	print(f"Processed {processed} images in {output_dir}")
	if failures:
		print(f"Skipped {failures} images due to errors")


if __name__ == "__main__":
	main()
