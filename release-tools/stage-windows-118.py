"""Assemble only the immutable, tested, clean CI candidate; verify before publication."""
import base64,hashlib,json,shutil,subprocess,tarfile,zipfile
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
SOURCE='6993a9a03f26da20823809763ed06e3706140990'
TAG='windows-v1.1.8-2026102803'
def run(*a,**kw):return subprocess.run(a,check=True,**kw)
def out(*a):return subprocess.check_output(a,text=True).strip()
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
root=Path('.windows-release');root.mkdir(exist_ok=True)
repo=root/'candidate';run('git','init',str(repo));run('git','-C',str(repo),'remote','add','origin','https://github.com/liu-zongjin/apex-legal-os.git')
run('git','-C',str(repo),'fetch','--depth=1','origin','ci/windows-production-artifacts-40668066858')
transport=out('git','-C',str(repo),'rev-parse','FETCH_HEAD')
manifest=json.loads(out('git','-C',str(repo),'show',transport+':manifest.json'));assert manifest['source']==SOURCE
archive=root/'components.tar'
with archive.open('wb') as dest:
 for p in manifest['parts']:
  part=root/'part'
  with part.open('wb') as f:run('git','-C',str(repo),'show',transport+':'+p['name'],stdout=f)
  assert part.stat().st_size==p['bytes'] and sha(part)==p['sha256']
  with part.open('rb') as f:shutil.copyfileobj(f,dest,1048576)
assert archive.stat().st_size==manifest['archive_bytes'] and sha(archive)==manifest['archive_sha256']
files=root/'files';files.mkdir()
with tarfile.open(archive) as t:
 for p in t:
  assert p.isfile() and Path(p.name).name==p.name
 t.extractall(files)
envelope=json.loads(Path('release-tools/windows-118-catalog.json').read_text());trust=json.loads(Path('release-tools/windows-118-trust.json').read_text())
raw=base64.b64decode(envelope['payload']);Ed25519PublicKey.from_public_bytes(base64.b64decode(trust['public_key'])).verify(base64.b64decode(envelope['signature']),raw)
payload=json.loads(raw);assert payload==json.loads((files/'catalog-payload.json').read_text())
check=json.loads((files/'FULL-INSTALL-VERIFICATION.json').read_text());assert check['pass'] and check['full_offline_install'] and check['recipient_attachment_preserved']
run('git','-C',str(repo),'fetch','--depth=1','origin',SOURCE)
for name in ['LICENSE','THIRD_PARTY_NOTICES.md']:
 with (root/name).open('wb') as f:run('git','-C',str(repo),'show',SOURCE+':'+name,stdout=f)
run('7z','x','-y','-o'+str(root/'installer'),str(files/'Stella-Windows-1.1.8-setup.exe'),'resources/bootstrap-engine.exe')
worker=root/'installer/resources/bootstrap-engine.exe';assert worker.is_file()
package=files/'Stella-Windows-1.1.8-offline.zip'
run('python3','release-tools/build-windows-118.py',str(files),'release-tools/windows-118-catalog.json',str(worker),str(package),str(root/'LICENSE'),str(root/'THIRD_PARTY_NOTICES.md'))
with zipfile.ZipFile(package) as z:assert z.testzip() is None
shutil.copy2('release-tools/windows-118-catalog.json',files/'catalog.json')
shutil.copy2(root/'LICENSE',files/'LICENSE-Windows.txt');shutil.copy2(root/'THIRD_PARTY_NOTICES.md',files/'THIRD_PARTY_NOTICES.md')
assets=[files/n for n in ['Stella-Windows-1.1.8-offline.zip','Stella-Windows-1.1.8-setup.exe','server.zip','browser.zip','ocr.zip','converter.zip','catalog.json','LICENSE-Windows.txt','THIRD_PARTY_NOTICES.md','FULL-INSTALL-VERIFICATION.json','UPSTREAM-SOURCES.json']]
checks=files/'SHA256-Windows-1.1.8.txt';checks.write_text(''.join(sha(p)+'  '+p.name+'\n' for p in assets));assets.append(checks)
exists=subprocess.run(['gh','release','view',TAG,'--json','isDraft'],capture_output=True,text=True)
if exists.returncode:run('gh','release','create',TAG,'--target','main','--draft','--title','Stella 1.1.8 · Windows 完整离线测试版','--notes','包含智能立案、当事人创建修复、AI 读取资源优化与知识表格。完整解压后运行开始安装.cmd。Windows Server 2022 环境通过安装、首次启动及保留资料的升级测试；尚未完成实体 Windows 10/11 电脑验证。源码 '+SOURCE+'。原有 Windows 平台差异仍适用。')
else:assert json.loads(exists.stdout)['isDraft'],'Do not replace a published release'
api=json.loads(out('gh','release','view',TAG,'--json','apiUrl'))['apiUrl']
for p in assets:
 data=json.loads(out('gh','api',api));item=next((a for a in data['assets'] if a['name']==p.name),None)
 if item:assert item['size']==p.stat().st_size and item.get('digest')=='sha256:'+sha(p)
 else:run('gh','release','upload',TAG,str(p))
data=json.loads(out('gh','api',api))
for p in assets:
 item=next(a for a in data['assets'] if a['name']==p.name);assert item['size']==p.stat().st_size and item.get('digest')=='sha256:'+sha(p)
print('WINDOWS_DRAFT_ASSETS_VERIFIED',flush=True)
print('OFFLINE_VERIFIED_SHA256',sha(package),'BYTES',package.stat().st_size,flush=True)
# Mac drafts were independently built, signed and verified from the same runtime source.
macs=json.loads(Path('release-tools/mac-118-manifest.json').read_text())
for tag in ['v1.1.8-2026102804','v1.1.8-2026102805']:
 api=json.loads(out('gh','release','view',tag,'--json','apiUrl'))['apiUrl'];data=json.loads(out('gh','api',api))
 for a in [a for a in macs if a['tag']==tag]:
  item=next(x for x in data['assets'] if x['name']==a['name']);assert item['size']==a['bytes'] and item.get('digest')=='sha256:'+a['sha256']
for tag in ['v1.1.8-2026102804','v1.1.8-2026102805',TAG]:
 run('gh','release','edit',tag,'--draft=false','--latest=false')
 assert not json.loads(out('gh','release','view',tag,'--json','isDraft'))['isDraft']
print('ALL_THREE_RELEASES_PUBLIC_AND_VERIFIED',flush=True)
