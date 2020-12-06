# 那么如何使用Editor.js

## 基础

Editor.js是一个块样式的编辑器。 块是组成入口的结构单元。
例如, `段落(Paragraph)`, `标题(Heading)`, `图片(Image)`, `视频(Video)`, `列表(List)` 都是块. 每个块由一个插件表示。 我们有[许多](http://github.com/editor-js/)现成的插件和用于创建新插件的[简单 API](tools.md)。

那么[安装](installation.md)后如何使用编辑器。

- 通过输入或使用加号按钮创建新块
- 按 `TAB` 或单击加号按钮以查看工具箱
- 再次按 `TAB` 键离开工具箱，然后选择所需的块。 然后按 `Enter`。

 ![](https://github.com/editor-js/list/raw/master/assets/example.gif)

- 选择文本片段并应用样式或从“内联工具栏”插入链接

![](https://capella.pics/7ccbcfcd-1c49-4674-bea7-71021468a1bd.jpg)

- 使用右边的`三点`按钮打开区块设置。如果它提供, 从这里，您可以移动和删除一个块或应用工具的设置。例如，设置标题级别或列表样式。

![](https://capella.pics/01a55381-46cd-47c7-b92e-34765434f2ca.jpg)

## 快捷键

我们非常欣赏捷径。所以预设很少。

| 动作        | 快捷键            | 限制条件                   |
| ----------- | ----------------- | -------------------------- |
| `TAB`       | 显示/离开工具箱。 | 在空块                     |
| `SHIFT+TAB` | 退回工具箱。      | 打开工具箱时               |
| `ENTER`     | 创建一个块        | 打开工具箱并选择某些工具时 |
| `CMD+B`     | 粗体              | 当选中                     |
| `CMD+I`     | 斜体              | 当选中                     |
| `CMD+K`     | 添加链接          | 当选中                     |

此外，我们支持所有类型的工具上的快捷方式。 使用“工具”配置指定快捷方式。 例如：

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

## 自动聚焦

如果要在页面加载后聚焦编辑器，可以通过将自动聚焦传递给初始配置来启用自动聚焦。

```js
var editor = new EditorJS({
  //...
  autofocus: true
  //...
 });

```

## 持有者

`Holder` 属性支持id或对dom元素的引用。

```js
var editor = new EditorJS({
  holder: document.querySelector('.editor'),
})

var editor2 = new EditorJS({
  holder: 'codex-editor' // 类似 document.getElementById('codex-editor')
})
```

## 占位符号

默认情况下，编辑器的占位符为空。

您可以通过`placeholder`段传递自己的占位符：

```js
var editor = new EditorJS({
  //...
  placeholder: '我很棒的占位符'
  //...
 });

```

如果使用自定义的初始块，则占位符属性将在 config 中传递给 Tool 构造函数。

## 日志等级

您可以通过配置的 `logLevel` 属性为 Editor.js 控制台消息指定日志级别：

```js
var editor = new EditorJS({
  //...
  logLevel: 'WARN'
  //..
})
```

可选的值：

| 值        | 描述                    |
| --------- | ----------------------- |
| `VERBOSE` | 显示所有                |
| `INFO`    | 显示 info 和 debug 消息 |
| `WARN`    | 只显示 error 和 warn    |
| `ERROR`   | 只显示 error            |

