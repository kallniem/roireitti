"""Generate evenly distributed preview images from an MP4 video."""

import argparse
from pathlib import Path

import cv2


def extract_frames(input_path, output_dir, image_count, prefix, width=None, height=None):
	"""Extract image_count frames spanning the entire video."""
	capture = cv2.VideoCapture(str(input_path))
	if not capture.isOpened():
		raise RuntimeError(f"Could not open video: {input_path}")

	try:
		frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
		if frame_count < 1:
			raise RuntimeError(f"Video contains no frames: {input_path}")

		output_dir.mkdir(parents=True, exist_ok=True)
		last_frame = frame_count - 1
		if image_count == 1:
			frame_positions = [last_frame // 2]
		else:
			frame_positions = [
				round(last_frame * index / (image_count - 1))
				for index in range(image_count)
			]

		image_paths = []
		for image_index, frame_position in enumerate(frame_positions, start=1):
			capture.set(cv2.CAP_PROP_POS_FRAMES, frame_position)
			success, frame = capture.read()
			if not success:
				raise RuntimeError(
					f"Could not read frame {frame_position} from {input_path}"
				)
			if width is not None:
				frame = cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)

			image_path = output_dir / f"{prefix}_{image_index:03d}.jpg"
			if not cv2.imwrite(str(image_path), frame):
				raise RuntimeError(f"Could not write image: {image_path}")
			image_paths.append(image_path)

		return image_paths
	finally:
		capture.release()


def parse_args():
	parser = argparse.ArgumentParser(
		description="Create evenly distributed JPEG preview images from an MP4."
	)
	parser.add_argument("input", type=Path, help="Input MP4 file")
	parser.add_argument(
		"-o",
		"--output",
		type=Path,
		default=Path("preview-images"),
		help="Output directory (default: preview-images)",
	)
	parser.add_argument(
		"-n",
		"--count",
		type=int,
		default=12,
		help="Number of images to create (default: 12)",
	)
	parser.add_argument(
		"--prefix",
		default="preview",
		help="Output filename prefix (default: preview)",
	)
	parser.add_argument(
		"--width",
		type=int,
		help="Output image width in pixels (must be used with --height)",
	)
	parser.add_argument(
		"--height",
		type=int,
		help="Output image height in pixels (must be used with --width)",
	)
	return parser.parse_args()


def main():
	args = parse_args()
	if not args.input.is_file():
		raise SystemExit(f"Input file does not exist: {args.input}")
	if args.count < 1:
		raise SystemExit("--count must be at least 1")
	if (args.width is None) != (args.height is None):
		raise SystemExit("--width and --height must be provided together")
	if args.width is not None and (args.width < 1 or args.height < 1):
		raise SystemExit("--width and --height must be at least 1")

	image_paths = extract_frames(
		args.input, args.output, args.count, args.prefix, args.width, args.height
	)
	print(f"Created {len(image_paths)} images in {args.output}")


if __name__ == "__main__":
	main()