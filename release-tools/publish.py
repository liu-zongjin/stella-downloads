"""Public artifact transport only. Contains no application sources or signing secrets."""
import hashlib,json,subprocess,tarfile
from pathlib import Path

def run(*args,**kwargs):return subprocess.run(args,check=True,**kwargs)
def output(*args):return subprocess.check_output(args,text=True).strip()
def checksum(path):
 h=hashlib.sha256()
 with path.open('rb') as source:
  for block in iter(lambda:source.read(1024*1024),b''):h.update(block)
 return h.hexdigest()
manifest=json.loads(Path('release-manifest.json').read_text())
folder=Path('.release');folder.mkdir()
archive=folder/'artifacts.tar'
with archive.open('wb') as destination:
 for part in manifest['transport_parts']:
  ref=part['ref'];assert ref.startswith('refs/heads/transport/stella-115-')
  run('git','fetch','--depth=1','origin',ref)
  path=folder/'part'
  with path.open('wb') as stream:run('git','show','FETCH_HEAD:part',stdout=stream)
  assert path.stat().st_size==part['bytes'] and checksum(path)==part['sha256']
  with path.open('rb') as stream:
   for block in iter(lambda:stream.read(1024*1024),b''):destination.write(block)
  path.unlink()
expected={a['name']:a for release in manifest['releases'] for a in release['assets']}
with tarfile.open(archive) as bundle:
 assert set(bundle.getnames())==set(expected)
 for member in bundle:
  assert member.isfile() and Path(member.name).name==member.name
  with bundle.extractfile(member) as source,(folder/member.name).open('wb') as target:
   for block in iter(lambda:source.read(1024*1024),b''):target.write(block)
archive.unlink()
for name,asset in expected.items():
 path=folder/name
 assert path.stat().st_size==asset['bytes'] and checksum(path)==asset['sha256'],name
for release in manifest['releases']:
 tag=release['tag']
 assert tag.startswith('v1.1.5-')
 existing=subprocess.run(['gh','release','view',tag,'--json','isDraft'],capture_output=True,text=True)
 if existing.returncode:
  run('gh','release','create',tag,'--target','distribute/public-v1.1.5-20261021','--draft','--title',release['title'],'--notes',release['notes'])
 else:assert json.loads(existing.stdout)['isDraft'],'Never replace a published release'
 for asset in release['assets']:
  # Resume a draft only when an existing asset has exactly the intended bytes.
  data=json.loads(output('gh','api','repos/{owner}/{repo}/releases/tags/'+tag))
  found=next((a for a in data['assets'] if a['name']==asset['name']),None)
  if found:assert found['size']==asset['bytes'] and found.get('digest')=='sha256:'+asset['sha256']
  else:run('gh','release','upload',tag,str(folder/asset['name']))
 data=json.loads(output('gh','api','repos/{owner}/{repo}/releases/tags/'+tag))
 for asset in release['assets']:
  found=next(a for a in data['assets'] if a['name']==asset['name'])
  assert found['size']==asset['bytes'] and found.get('digest')=='sha256:'+asset['sha256']
 run('gh','release','edit',tag,'--draft=false','--latest')
for part in manifest['transport_parts']:run('git','push','origin','--delete',part['ref'].removeprefix('refs/heads/'))
print('PUBLIC_ARTIFACTS_VERIFIED_AND_PUBLISHED')
