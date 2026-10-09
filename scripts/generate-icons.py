from pathlib import Path
from statistics import median

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "logo-source.jpg"
ICON = ASSETS / "icon.png"
ADAPTIVE = ASSETS / "adaptive-icon.png"
SIZE = 1024
ADAPTIVE_MARK_SIZE = 680
BACKGROUND_THRESHOLD = 12
FOREGROUND_THRESHOLD = 32


def sample_navy(image: Image.Image) -> tuple[int, int, int]:
    width, height = image.size
    points = []
    for x in range(width):
        points.extend((image.getpixel((x, 0)), image.getpixel((x, height - 1))))
    for y in range(height):
        points.extend((image.getpixel((0, y)), image.getpixel((width - 1, y))))
    return tuple(round(median(channel)) for channel in zip(*points))


def make_alpha(image: Image.Image, background: tuple[int, int, int]) -> Image.Image:
    bg = Image.new("RGB", image.size, background)
    difference = ImageChops.difference(image, bg)
    strongest = ImageChops.lighter(
        ImageChops.lighter(*difference.split()[:2]), difference.split()[2]
    )
    scale = 255 / (FOREGROUND_THRESHOLD - BACKGROUND_THRESHOLD)
    return strongest.point(
        lambda value: max(
            0,
            min(255, round((value - BACKGROUND_THRESHOLD) * scale)),
        )
    )


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    background = sample_navy(source)
    alpha = make_alpha(source, background)

    # Use a firm threshold for the crop bounds, avoiding JPEG noise at the edges.
    bounds_mask = alpha.point(lambda value: 255 if value >= 96 else 0)
    bounds = bounds_mask.getbbox()
    if bounds is None:
        raise RuntimeError("No owl foreground found in logo-source.jpg")

    cropped_rgb = source.crop(bounds)
    cropped_alpha = alpha.crop(bounds)
    mark = cropped_rgb.convert("RGBA")
    mark.putalpha(cropped_alpha)

    # App icon: retain the sampled navy and add a comfortable 10% margin.
    mark_width, mark_height = mark.size
    margin = round(max(mark_width, mark_height) * 0.10)
    square = max(mark_width, mark_height) + 2 * margin
    padded_mark = Image.new("RGBA", (square, square), (0, 0, 0, 0))
    padded_mark.alpha_composite(
        mark,
        ((square - mark_width) // 2, (square - mark_height) // 2),
    )
    icon_background = Image.new("RGBA", (SIZE, SIZE), (*background, 255))
    icon_background.alpha_composite(
        padded_mark.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    )
    icon_background.convert("RGB").save(ICON, format="PNG", optimize=True)

    # Android adaptive icon: fit the complete owl in the ~66% central safe zone.
    scale = ADAPTIVE_MARK_SIZE / max(mark_width, mark_height)
    adaptive_size = (round(mark_width * scale), round(mark_height * scale))
    adaptive_mark = mark.resize(adaptive_size, Image.Resampling.LANCZOS)
    adaptive = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    adaptive.alpha_composite(
        adaptive_mark,
        ((SIZE - adaptive_size[0]) // 2, (SIZE - adaptive_size[1]) // 2),
    )
    adaptive.save(ADAPTIVE, format="PNG", optimize=True)

    print(f"Sampled navy: #{background[0]:02X}{background[1]:02X}{background[2]:02X}")
    print(f"Detected owl bounds: {bounds} ({mark_width}x{mark_height})")
    print(f"Wrote {ICON} and {ADAPTIVE}")


if __name__ == "__main__":
    main()
