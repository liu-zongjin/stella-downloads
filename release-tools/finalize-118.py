import json,subprocess

def run(*a):subprocess.run(a,check=True)
def data(*a):return json.loads(subprocess.check_output(a,text=True))
for tag in ['v1.1.8-2026102804','v1.1.8-2026102805','windows-v1.1.8-2026102803']:
 assert not data('gh','release','view',tag,'--json','isDraft')['isDraft']
run('gh','release','edit','windows-v1.1.8-2026102803','--prerelease','--latest=false')
run('gh','release','edit','v1.1.8-2026102804','--latest')
# Only abandoned drafts created during this release, never public releases.
allowed={'https://github.com/liu-zongjin/stella-downloads/releases/untagged-7bfc3b8fb3a47d98da86','https://github.com/liu-zongjin/stella-downloads/releases/untagged-609ccf4ac7135feef690','https://github.com/liu-zongjin/stella-downloads/releases/tag/untagged-7bfc3b8fb3a47d98da86','https://github.com/liu-zongjin/stella-downloads/releases/tag/untagged-609ccf4ac7135feef690'}
for release in data('gh','api','repos/liu-zongjin/stella-downloads/releases?per_page=100'):
 if release['draft'] and release['html_url'] in allowed:
  run('gh','api','--method','DELETE','repos/liu-zongjin/stella-downloads/releases/'+str(release['id']))
  print('Removed abandoned private draft',release['id'])
print('FINAL_RELEASE_LABELS_VERIFIED')
