"""Build fullscreen hero delivery files from the untouched 1080p recording.
Run with FFMPEG=/path/to/ffmpeg or an installed imageio-ffmpeg package.
Only writes the new hero assets; never rebuilds HTML or other videos.
"""
from pathlib import Path
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
ffmpeg = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
if not ffmpeg:
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
source = ASSETS / 'home_banner_video_1.mp4'
for filename, filters in [
    ('hero-fullscreen-hd.mp4', 'setsar=1,fps=30'),
    # Keep the original vertical detail instead of scaling a 270px preview up.
    ('hero-fullscreen-mobile.mp4', 'crop=608:1080,setsar=1,fps=30'),
]:
    target = ASSETS / 'video' / filename
    subprocess.run([
        ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
        '-t', '12', '-map', '0:v:0', '-vf', filters,
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '19',
        '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-g', '60',
        '-movflags', '+faststart', '-an', str(target),
    ], check=True)
    print(f'{filename}: {target.stat().st_size:,} bytes', flush=True)
subprocess.run([
    ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
    '-frames:v', '1', '-c:v', 'libwebp', '-quality', '88',
    str(ASSETS / 'posters/hero-fullscreen.webp'),
], check=True)
