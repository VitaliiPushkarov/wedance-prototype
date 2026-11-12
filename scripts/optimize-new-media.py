"""Prepare the November studio photos and LINE DANCE recording for Pages."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import os,shutil,subprocess,json
ROOT=Path(__file__).resolve().parents[1];A=ROOT/'dist/assets'
FF=os.environ.get('FFMPEG') or shutil.which('ffmpeg')
if not FF:
 import imageio_ffmpeg
 FF=imageio_ffmpeg.get_ffmpeg_exe()
photos={'DSC06335':'ballroom-partnership','DSC06345':'ballroom-demonstration','DSC06359':'young-dancers-training','DSC06369':'studio-workshop','DSC06438':'group-floor','DSC06446':'latin-coaching','_DSC5171':'solo-expression','_DSC5187':'dance-practice','_DSC5285':'partner-training','_DSC5295':'latin-expression','_DSC5329':'shared-floor','_DSC5345':'future-dancers'}
(A/'photos').mkdir(exist_ok=True)
report=[]
for src,name in photos.items():
 source=A/(src+'.jpg');target=A/'photos'/(name+'.webp')
 subprocess.run([FF,'-hide_banner','-loglevel','error','-y','-i',str(source),'-vf','scale=w=min(iw\\,1440):h=min(ih\\,1440):force_original_aspect_ratio=decrease','-c:v','libwebp','-quality','80',str(target)],check=True)
 report.append({'source':source.name,'file':target.relative_to(ROOT).as_posix(),'source_bytes':source.stat().st_size,'bytes':target.stat().st_size})
def encode(job):
 mobile,preview=job;limit=480 if mobile else 720
 target=A/'video'/('line-dance'+('-preview' if preview else '')+('-mobile' if mobile else '')+'.mp4')
 cmd=[FF,'-hide_banner','-loglevel','error','-y']
 if preview:cmd+=['-ss','5']
 cmd+=['-i',str(A/'LINE DANCE.mp4')]
 if preview:cmd+=['-t','12']
 cmd+=['-vf',f'scale=w=min(iw\\,{limit}):h=min(ih\\,{limit}):force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,fps=24','-c:v','libx264','-preset','medium','-crf','32' if mobile else '30','-pix_fmt','yuv420p','-profile:v','main','-g','48','-movflags','+faststart']
 cmd+=['-an'] if preview else ['-c:a','aac','-b:a','64k']
 subprocess.run(cmd+[str(target)],check=True)
 return {'source':'LINE DANCE.mp4','file':target.relative_to(ROOT).as_posix(),'source_bytes':(A/'LINE DANCE.mp4').stat().st_size,'bytes':target.stat().st_size}
with ThreadPoolExecutor(max_workers=2) as pool:report+=list(pool.map(encode,[(False,False),(True,False),(False,True),(True,True)]))
subprocess.run([FF,'-hide_banner','-loglevel','error','-y','-ss','8','-i',str(A/'LINE DANCE.mp4'),'-frames:v','1','-vf','scale=540:-2','-c:v','libwebp','-quality','78',str(A/'posters/line-dance.webp')],check=True)
(ROOT/'NEW-MEDIA-REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
