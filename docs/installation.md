# 安装指南

只需几个步骤即可在您的网站上运行Editor.js。

1. [加载 Editor 的核心](#load-editors-core)
2. [加载 Tools](#load-tools)
3. [创建 Editor 的实例](#create-editor-instance)

## 加载 Editor 的核心 <a name="load-editors-core"></>

首先，您需要获得[Editor.js](../dist/editor.js)本身。它是一个可用的最小的微型脚本

选择最适合您的编辑器方法。

- NPM 包
- 从 CDN 加载资源
- 在项目本地加载文件

### Node.js

通过NPM或Yarn安装包

```shell
npm i @editorjs/editorjs
```

在您的应用程序中引入模块

```javascript
import EditorJS from '@editorjs/editorjs';
```

### 从 CDN 加载资源

您可以从 [jsDelivr CDN](https://www.jsdelivr.com/package/npm/@editorjs/editorjs) 加载特定版本的软件包。

`https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.10.0`

然后需要这个脚本。

```html
<script src="..."></script>
```

### 在项目本地加载文件

复制 [editor.js](../dist/editor.js) 文件到你的项目里,并加载他

```html
<script src="editor.js"></script>
```

## 加载 Tools <a name="load-tools"></a>

[Tools](tools.md)代表的Editor.js中的每个块。 有具有自己逻辑的简单外部脚本。 您可能要使用几个应该连接的块工具。

例如，签出代表标题栏的[标题](https://github.com/editor-js/header)工具。

您可以通过与编辑器相同的方式安装标题工具 (Node.js, CDN, 本地 file).

检查 [Editor.js 社区](https://github.com/editor-js/) 查看工具示例。

**例子:** 使用 CDN 加载标题块

```html
<script src="https://cdn.jsdelivr.net/npm/codex.editor.header@2.1.0/dist/bundle.js"></script>
```

## 创建 Editor 的实例 <a name="create-editor-instance"></a>

创建Editor.js的实例并传递[配置对象](../src/types-internal/editor-config.ts)。 至少需要 `holderId` 选项。

```html
<div id="editorjs"></div>
```

您可以仅通过使用默认的段落工具创建简单的编辑器，方法是传递带有元素 ID（编辑器的包装器）的字符串作为配置参数，或使用默认的 `editor.js`。

```javascript
var editor = new EditorJS(); /** 0 配置 */

// 对比

var editor = new EditorJS('editorjs');
```

或传递整个设置对象。

```javascript
var editor = new EditorJS({
    /**
     * 创建编辑器的持有者并传递其 ID
     */
    holderId : 'editorjs',

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

## 准备就绪回调

Editor.js 需要一些时间来初始化。 这是一个异步操作，因此它不会阻止主脚本的执行。

如果您需要知道编辑器实例何时准备就绪，可以使用以下方式之一：

##### 将 `onReady` 属性传递给配置对象。

它必须是一个函数:

```javascript
var editor = new EditorJS({
   // 其他配置属性

   /**
    * onReady 回调
    */
   onReady: () => {console.log('Editor.js 准备就绪!')}
});
```

#### 使用 `isReady` promise。

创建新的 `EditorJS` 对象后，它将包含 `isReady` 属性。
它是一个Promise对象，在编辑器准备工作时 resolve，否则将被拒绝.
如果初始化 `isReady` 期间发生错误，则 Promise 将被拒绝并显示一条错误消息。

```javascript
var editor = new EditorJS();

editor.isReady
  .then(() => {
    /** 编辑器初始化后做您需要做的一切 */
  })
  .catch((reason) => {
    console.log(`由于以下原因，Editor.js 初始化失败 ${reason}`)
  });
```

您可以使用 `async/await` 来使代码保持同步：

```javascript
var editor = new EditorJS();

try {
  await editor.isReady;
  /** 编辑器初始化后做您需要做的一切 */
} catch (reason) {
  console.log(`由于以下原因，Editor.js 初始化失败 ${reason}`)
}
```

## 保存数据

调用 `editor.saver.save()` 并使用保存的数据处理返回的Promise。

```javascript
editor.saver.save()
  .then((savedData) => {
    console.log(savedData);
  });
```

## 特性

另外，Editor.js 提供了有用的方法来处理 Editor 的状态。

```javascript
var editor = new EditorJS({
   // 其他配置属性

   /**
    * onReady 回调
    */
   onReady: () => {console.log('Editor.js 准备就绪!')},

   /**
    * onChange 回调
    */
   onChange: () => {console.log('现在我知道编辑器的内容已更改！')}
});
```

## 例子

查看[example.html](../example/example.html)以查看更详细的示例。
