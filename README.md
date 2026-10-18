# Stella / APEX · 法律操作系统


面向个人学习与非商业体验的本地法律操作系统。提供案件管理、法律知识库、文书工具、利息计算、录音转写以及可自行配置的 AI / MCP 集成。

## 下载后直接使用

[下载 Mac 应用（Apple 芯片，约 302 MB）](https://github.com/liu-zongjin/stella-downloads/releases/download/v1.0.0-preview2/Stella-macOS-AppleSilicon-v1.0.0-preview2.zip)

[查看所有发行版本与校验文件](https://github.com/liu-zongjin/stella-downloads/releases)

1. 下载上方应用 ZIP 并解压。
2. 将 **Stella.app** 拖入“应用程序”。
3. 打开即可使用，无需安装 Python、Node.js 或下载源码。

支持 Apple 芯片 Mac（M1/M2/M3/M4 等），macOS 11.3 或更新。当前发布为公开体验版，尚未提供 Intel Mac 或 Windows 安装包。

应用尚未经过 Apple 公证。首次打开如提示无法验证开发者，在确认下载来源后，可按 Apple 官方说明在 **系统设置 → 隐私与安全性 → 仍要打开** 中确认。请勿关闭系统安全保护。参见 [Apple 官方说明](https://support.apple.com/zh-cn/102445)。

## 当前版本

界面、前端资源、后端和原生外壳与当前维护版本保持一致，并以当前授权的 Stella 图形作为默认品牌。公开版按作者要求移除“个人中心”（私人财务）及家庭财务同步；其他功能保留。用户设置、账号和业务数据独立初始化。旧版已撤回，请重新下载新版。

## 数据与服务

- 团队身份、证件、联系方式、银行及真实客户默认值均已替换为虚构占位或清空。
- 包内只有虚构示例案件和三篇操作示例文章，不含作者的真实案件、附件、知识库、财务、聊天记忆或账号密钥。
- 新建的数据保存在使用者本机的 `~/Library/Application Support/StellaPublic`，不与作者的数据目录共用。
- AI、邮箱、MCP、法院登录等服务需自行配置账号；程序包含本地验证码 OCR 和浏览器驱动；Chrome、Office 转换器等外部应用需按功能安装。
- 退出应用会关闭随包后端；应用使用本机 18865 端口。

## 许可

下载与使用须遵守 [LICENSE](LICENSE)：**禁止商用、禁止修改，保留作者署名“刘宗锦律师”**。允许个人非商业学习、研究、体验及免费转发完整原版副本。

用于律所商业运营、收费法律服务或修改程序，须另行取得作者书面授权。第三方材料仍按其原有许可适用，见 [第三方声明](THIRD_PARTY_NOTICES.md)。

本仓库用于公开分发应用、许可证和安装说明，不提供软件源代码。
