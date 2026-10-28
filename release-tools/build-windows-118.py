"""Assemble a deterministic offline package from the verified CI candidate."""
import hashlib,json,subprocess,sys,zipfile
from pathlib import Path
candidate=Path(sys.argv[1]); catalog=Path(sys.argv[2]); worker=Path(sys.argv[3]); out=Path(sys.argv[4]); license_file=Path(sys.argv[5]); notices=Path(sys.argv[6]); source='6993a9a03f26da20823809763ed06e3706140990'
payload=json.loads((candidate/'catalog-payload.json').read_text(encoding='utf-8'))
assert payload['build']==2026102803 and payload['version']=='1.1.8'
check=json.loads((candidate/'FULL-INSTALL-VERIFICATION.json').read_text(encoding='utf-8'));assert check['pass'] and check['full_offline_install'] and check['recipient_attachment_preserved']
def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
files={}
for comp in payload['components']:
 p=candidate/(comp['id']+'.zip');assert p.stat().st_size==comp['bytes'] and sha(p)==comp['sha256'];files[p.name]=p
for name,path in [('catalog.json',catalog),('bootstrap-engine.exe',worker),('Stella-Windows-1.1.8-setup.exe',candidate/'Stella-Windows-1.1.8-setup.exe'),('LICENSE-Windows.txt',license_file),('THIRD_PARTY_NOTICES.md',notices)]:files[name]=path
readme='''Stella Windows 1.1.8 · 完整离线安装包\r\n\r\n支持 Windows 10 1809+ / Windows 11 的 Intel 或 AMD 64 位电脑。\r\n先完整解压 ZIP，然后双击“开始安装.cmd”。安装前正常退出 Stella，建议备份重要资料。\r\n组件从本地安装；WebView2 和后续使用的联网服务可能需要网络。已有资料独立保存。\r\nWindows Server 构建环境通过安装和升级测试，实体 Windows 10/11 桌面仍需验证。\r\n源码： https://github.com/liu-zongjin/apex-legal-os/tree/'''+source+'\r\n'
cmd='''@echo off\r\nchcp 65001 >nul\r\nsetlocal\r\ncd /d "%~dp0"\r\necho 请先退出 Stella，重要资料建议先备份。\r\npause\r\nfor %%F in (server.zip browser.zip ocr.zip converter.zip catalog.json bootstrap-engine.exe Stella-Windows-1.1.8-setup.exe) do (\r\n  if not exist "%%F" (\r\n    echo 缺少 %%F，请先完整解压整个离线包。\r\n    pause\r\n    exit /b 1\r\n  )\r\n)\r\n"%~dp0bootstrap-engine.exe" install --catalog "%~dp0catalog.json" > "%~dp0install.log" 2>&1\r\nif errorlevel 1 (\r\n  echo 组件安装未完成，请保留 install.log 并反馈。\r\n  pause\r\n  exit /b 1\r\n)\r\nstart "" /wait "%~dp0Stella-Windows-1.1.8-setup.exe" /S\r\nif errorlevel 1 (\r\n  echo 引导器安装未完成，请重试。\r\n  pause\r\n  exit /b 1\r\n)\r\necho 安装完成，请从桌面打开 Stella。\r\npause\r\nexit /b 0\r\n'''
virtual={'使用说明.txt':readme.encode('utf-8'),'开始安装.cmd':cmd.encode('utf-8')}
root='Stella-Windows-1.1.8-offline/'
with zipfile.ZipFile(out,'x',compression=zipfile.ZIP_STORED,allowZip64=True) as z:
 for name in sorted([*files,*virtual]):
  info=zipfile.ZipInfo(root+name,(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_STORED;info.external_attr=0o100644<<16
  with z.open(info,'w',force_zip64=True) as dest:
   if name in virtual:dest.write(virtual[name])
   else:
    with files[name].open('rb') as f:
     for b in iter(lambda:f.read(1024*1024),b''):dest.write(b)
print('OFFLINE_PACKAGE',out.stat().st_size,sha(out),flush=True)
