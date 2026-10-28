"""Verify pre-audited immutable public assets and stage GitHub drafts."""
import hashlib,json,subprocess,time
from pathlib import Path

def run(*args,**kw): return subprocess.run(args,check=True,**kw)
def out(*args): return subprocess.check_output(args,text=True).strip()
def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
 return h.hexdigest()
assets=json.loads(Path('release-tools/mac-118-manifest.json').read_text())
assert {a['tag'] for a in assets} == {'v1.1.8-2026102804','v1.1.8-2026102805'}
refs={p['ref'] for a in assets for p in a['parts']}
for i in range(120):
 found={x.split()[1] for x in out('git','ls-remote','origin','refs/heads/transport/stella-118-*').splitlines()}
 if refs<=found: break
 print('Waiting for transport:',len(refs & found),'/',len(refs),flush=True); time.sleep(20)
else: raise RuntimeError('Transport incomplete')
staging=Path('.release');staging.mkdir(exist_ok=True)
for a in assets:
 target=staging/a['name']; assert target.name==a['name']
 with target.open('wb') as dest:
  for p in a['parts']:
   assert p['ref'].startswith('refs/heads/transport/stella-118-')
   run('git','fetch','--depth=1','origin',p['ref'])
   with (staging/'part').open('wb') as f:run('git','show','FETCH_HEAD:part',stdout=f)
   part=staging/'part'; assert part.stat().st_size==p['bytes'] and digest(part)==p['sha256']
   with part.open('rb') as f:
    for b in iter(lambda:f.read(1024*1024),b''):dest.write(b)
 assert target.stat().st_size==a['bytes'] and digest(target)==a['sha256']
for tag in sorted({a['tag'] for a in assets}):
 exists=subprocess.run(['gh','release','view',tag,'--json','isDraft'],capture_output=True,text=True)
 if exists.returncode:
  title='Stella 1.1.8 · '+('Apple 芯片 Mac' if tag.endswith('2804') else 'Intel 芯片 Mac')
  notes='智能立案、当事人档案修复、AI 阅读和知识表格。macOS 12+；本地签名，尚未经过 Apple 公证。应用源码版本 fb5fec762f869120ea9bbabca534c42a98837906。'
  run('gh','release','create',tag,'--target','main','--draft','--title',title,'--notes',notes)
 else: assert json.loads(exists.stdout)['isDraft'], 'Do not replace a published release'
 api=json.loads(out('gh','release','view',tag,'--json','apiUrl'))['apiUrl']
 for a in [x for x in assets if x['tag']==tag]:
  data=json.loads(out('gh','api',api)); existing=next((x for x in data['assets'] if x['name']==a['name']),None)
  if existing: assert existing['size']==a['bytes'] and existing.get('digest')=='sha256:'+a['sha256']
  else: run('gh','release','upload',tag,str(staging/a['name']))
 data=json.loads(out('gh','api',api))
 for a in [x for x in assets if x['tag']==tag]:
  item=next(x for x in data['assets'] if x['name']==a['name']); assert item['size']==a['bytes'] and item.get('digest')=='sha256:'+a['sha256']
print('MAC_DRAFT_ASSETS_VERIFIED')
