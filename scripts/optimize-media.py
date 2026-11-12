"""Create lightweight prototype media without changing the original recordings.
Run with an FFmpeg binary on PATH, or set FFMPEG to its absolute path.
An optional imageio-ffmpeg installation can supply the binary as well.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, os, shutil, subprocess
ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
FFMPEG = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
if not FFMPEG:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
VIDEO = ASSETS / 'video'
POSTERS = ASSETS / 'posters'
VIDEO.mkdir(exist_ok=True)
POSTERS.mkdir(exist_ok=True)
names = ['home_banner_video_1','home_banner_video_vert','social','coaching','latin','studio-film']
def encode(job):
    name, mobile = job
    src = ASSETS / (name + '.mp4')
    target = VIDEO / (name + ('-mobile' if mobile else '') + '.mp4')
    limit = 480 if mobile else 960
    vf = f'scale=trunc(iw*sar/2)*2:ih,setsar=1,scale=w=min(iw\\,{limit}):h=min(ih\\,{limit}):force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,fps=24'
    cmd = [FFMPEG,'-hide_banner','-loglevel','error','-y','-i',str(src)]
    if name in ['home_banner_video_1','coaching']:
        cmd += ['-t','12']
    cmd += ['-map','0:v:0','-vf',vf,'-c:v','libx264','-preset','medium','-crf','29' if mobile else '27','-pix_fmt','yuv420p','-profile:v','main','-g','48','-movflags','+faststart']
    if name == 'studio-film':
        cmd += ['-map','0:a?','-c:a','aac','-b:a','64k']
    else:
        cmd += ['-an']
    subprocess.run(cmd+[str(target)],check=True)
    return {'file':target.relative_to(ROOT).as_posix(),'source_bytes':src.stat().st_size,'bytes':target.stat().st_size}
with ThreadPoolExecutor(max_workers=2) as pool:
    report = list(pool.map(encode,[(name,mobile) for name in names for mobile in (False,True)]))
for name,src in [('hero-main',ASSETS/'poster_preload_video_1.png'),('hero-side',ASSETS/'home_banner_video_vert.mp4')]:
    subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-i',str(src),'-frames:v','1','-vf','scale=960:-2','-c:v','libwebp','-quality','78',str(POSTERS/(name+'.webp'))],check=True)
(ROOT/'MEDIA-REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
