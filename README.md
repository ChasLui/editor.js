<a href="https://editorjs.io/"><p align="center"><img src="https://capella.pics/79ce946a-d636-41cd-aa96-d3bc5ecfde03.jpg"></p></a>

[![](https://flat.badgen.net/npm/v/@editorjs/editorjs?icon=npm)](https://www.npmjs.com/package/@editorjs/editorjs)
[![](https://flat.badgen.net/bundlephobia/min/@editorjs/editorjs?color=cyan)](https://www.npmjs.com/package/@editorjs/editorjs)
[![](https://flat.badgen.net/bundlephobia/minzip/@editorjs/editorjs?color=green)](https://www.npmjs.com/package/@editorjs/editorjs)
[![Backers on Open Collective](https://opencollective.com/editorjs/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/editorjs/sponsors/badge.svg)](#sponsors)
[![](https://flat.badgen.net/npm/license/@editorjs/editorjs)](https://www.npmjs.com/package/@editorjs/editorjs)
[![Join the chat at https://gitter.im/codex-team/editor.js](https://badges.gitter.im/codex-team/editor.js.svg)](https://gitter.im/codex-team/editor.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>IE / Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari-ios/safari-ios_48x48.png" alt="iOS Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>iOS Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" alt="Opera" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Opera |
| --------- | --------- | --------- | --------- | --------- | --------- |
| Edge 12+ | Firefox 18+ | Chrome 49+ | Safari 10+ | Safari 10+ | Opera 36+

## 如果你喜欢这个项目 💗💗💗

如果您喜欢Editor.js，则可以通过向我们的集体捐款来支持项目改进和新功能的开发。

 👉  [https://opencollective.com/editorjs](https://opencollective.com/editorjs)

### 担保

通过成为赞助者来支持该项目。 您的徽标将显示在此处，并带有指向您网站的链接。[[成为赞助商及合作伙伴](https://opencollective.com/editorjs#sponsor)]

<a href="https://opencollective.com/editorjs/sponsor/0/website" target="_blank"><img src="https://opencollective.com/editorjs/sponsor/0/avatar.svg"></a>

 ### 赞助商

 感谢所有支持我们的人! 🙏 [[成为赞助人](https://opencollective.com/editorjs#backer)]

 <a href="https://opencollective.com/editorjs#backers" target="_blank"><img src="https://opencollective.com/editorjs/backers.svg?width=890"></a>

### 贡献者

这个项目的存在要感谢所有贡献者。 <img src="https://opencollective.com/editorjs/contributors.svg?width=890&button=false" />

我们非常欢迎新的贡献者。如果你想和我们一起做一些代码，请看 [良好的首要任务](https://github.com/codex-team/editor.js/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+task%22). 您可以通过 `team@codex.so` 或通过特殊的 [Telegram chat](https://t.me/editorjsdev) 聊天或任何其他方式给我们写信。

## 文档

请访问 [https://editorjs.io/](https://editorjs.io) 以查看所有文档文章。

- [基本概念](https://editorjs.io/base-concepts)
- [入门指南](https://editorjs.io/getting-started)
- [配置](https://editorjs.io/configuration)
- [如何创建块工具插件](https://editorjs.io/creating-a-block-tool)
- [如何创建内联工具插件](https://editorjs.io/creating-an-inline-tool)
- [工具API](https://editorjs.io/tools-api)

你可以加入一个 [Gitter-channel](https://gitter.im/codex-team/editor.js) 或 [Telegram-chat](//t.me/codex_editor) 并提问。
## 变更日志

查看整个[变更日志](/docs/CHANGELOG.md)
## 如何使用 Editor.js

### 基础

Editor.js 是一个块样式的编辑器。 块是构成条目的结构单元。
例如，`段落`，`标题`，`图像`，`视频`，`列表`是块。每个块由插件表示。
我们有[许多](http://github.com/editor-js/)现成的插件和一个用于创建新插件的[简单API](https://editorjs.io/tools-api)。

[安装后](https://editorjs.io/getting-started)如何使用编辑器。

- 通过按 `Enter` 或单击加号按钮来创建新块
- 按 `TAB` 或单击加号按钮以查看工具箱
- 再次按 `TAB` 键离开叶子工具箱，然后选择所需的块。 然后按 `Enter`。

 ![](https://github.com/editor-js/list/raw/master/assets/example.gif)

- 选择文本片段并应用样式或从“内联工具栏”插入链接

![](https://capella.pics/7ccbcfcd-1c49-4674-bea7-71021468a1bd.jpg)

- 使用右侧的“三点”按钮打开块设置。 如果提供了块，您可以从此处移动和删除块或应用工具的设置。 例如，您可以设置标题级别或列表样式。

![](https://capella.pics/01a55381-46cd-47c7-b92e-34765434f2ca.jpg)

### 快捷键

预先设置了一些快捷方式。

快捷键 | 动作 | 限制条件
-- | -- | --
`TAB` | 显示/退出 工具箱 | 在空的块
`SHIFT+TAB` | 退回工具箱。 | 当工具箱打开时
`ENTER` | 创建一个块 | 打开工具箱并选择某些工具时
`CMD+B` | 粗体 | 当选中
`CMD+I` | 斜体 | 当选中
`CMD+K` | 插入链接 | 当选中

每个工具也可以有自己的快捷键。 这些在工具的配置中指定，例如：

```js
var editor = new EditorJS({
  //...
  tools: {
    header: {
      class: Header,
      shortcut: 'CMD+SHIFT+H'
    },
    list: {
      class: List,
      shortcut: 'CMD+SHIFT+L'
    }
  }
  //...
 });

```

## 安装指南

只需几个步骤即可在您的网站上运行Editor.js。

1. [加载编辑器的核心](#load-editors-core)
2. [加载工具箱](#load-tools)
3. [初始化编辑器实例](#create-editor-instance)

### 第 1 步, 加载编辑器核心

获取 [minified script](dist/editor.js) 本身。 这是一个精简的脚本，具有编辑器的核心和一些默认的必备工具。

选择最有用的获取编辑器的方法。

- npm 包
- 从 CDN 加载资源
- 从项目本地文件加载

##### 选项 A. NPM 安装

通过 NPM 或 Yarn 安装软件包

```shell
npm i @editorjs/editorjs
```

在您的应用程序中引入模块

```javascript
import EditorJS from '@editorjs/editorjs';
```

##### 选项 B. 使用 CDN

您可以直接从 [jsDelivr CDN](https://www.jsdelivr.com/package/npm/@editorjs/editorjs) 加载EditorJS。

`https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest`

例如，将其放在HTML中：

```html
<script src="https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest"></script>
```

##### 选项 C. 保存源码到您的项目

将 [editor.js](dist/editor.js) 文件复制到您的项目中

```html
<script src="editor.js"></script>
```

### 第 2 步. 加载您想要提供的工具

每个块由一个[工具](docs/tools.md)表示。 工具是具有自己逻辑的简单外部脚本。例如，有一个[标题](https://github.com/editor-js/header)工具，您可以在其中键入标题文本。如果要使用此功能，请以与编辑器相同的方式安装标题工具（Node.js，CDN，本地文件）。

**用例:** 使用标题来自 CDN

```html
<script src="https://cdn.jsdelivr.net/npm/codex.editor.header@2.0.4/dist/bundle.js"></script>
```

查看 [Editor.js 的社区](https://github.com/editor-js/)，以查看更多现成的工具。
### 步骤 3. 创建一个编辑器实例

创建一个edit .js的实例，并传递带有 `holderId` 和 tools 列表的[配置对象](types/configs/editor-config.d.ts)。

```html
<div id="editorjs"></div>
```

您可以通过传递带有元素的Id（用于编辑器的包装器）作为配置参数的字符串来创建仅具有默认段落工具的简单编辑器。 或使用默认的 `editorjs` id 作为包装器。

```javascript
var editor = new EditorJS(); /** 0 配置 */

// 对比

var editor = new EditorJS('editorjs');
````

Or pass a whole settings object.

```javascript
var editor = new EditorJS({
    /**
     * 创建编辑器的持有者并传递其ID
     */
    holder : 'editorjs',

    /**
     * 可用工具列表。
     * 为您要使用的每个工具传递工具类或配置对象
     */
    tools: {
        header: {
          class: Header,
          inlineToolbar : true
        },
        // ...
    },

    /**
     * 预先保存的应呈现的数据
     */
    data: {}
});
```

### 保存数据

调用 `editor.save()` 并使用保存的数据处理返回的 Promise。

```javascript
editor.save()
  .then((savedData) => {
    console.log(savedData);
  });
```

### 用例

查看 [example.html](example/example.html) 以查看更详细的示例。

## 引用

- 我们在 Sanitizer 模块中使用[HTMLJanitor](https://github.com/guardian/html-janitor)模块。

## 关于团队

我们是CodeX，我们为开发人员和制造商开发产品。

在 Twitter 关注我们: [twitter.com/codex_team](https://twitter.com/codex_team)

随时联系: <a href="mailto:team@codex.so?subject=Editor.js feedback">team@codex.so</a>

[codex.so](https://codex.so)
