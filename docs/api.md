# Editor.js API

---
[此接口](../types/api/index.d.ts)描述的大多数实际API。

---
📃 请参阅官方API文档 [https://editorjs.io/api](https://editorjs.io/api)

---

API模块提供的公共方法。 插件和调优开发人员可以根据需要使用Editor的API。

## 块 API

特定块方法和属性的API。您可以通过 `editor.api.block.getBlockByIndex` 方法或获取[工具构造函数](../types/tools/block-tool.d.ts)参数。

`name: string` — 块的工具名称(key，在初始配置的`tools`属性中指定)

`config: ToolConfig` — 编辑器初始化时传递的工具配置

`holder: HTMLElement` — 包装工具的 HTML 内容的 HTML 元素

`isEmpty: boolean` — `true` 如果块具有任何可编辑的内容

`selected: boolean` - `true` 如果块是通过跨块选择选择的

`set stretched(state: boolean)` — 设置块的拉伸状态

`stretched: boolean` — `true` 如果块被拉伸

`call(methodName: string, param?: object): void` — 方法，可在内部使用检查和错误处理程序调用任何工具的实例方法。 例如[Block 生命周期钩子](./tools.md#block-lifecycle-hooks)

`save(): Promise<void|SavedData>` — 返回从当前块状态保存的数据，包括工具名称和节省执行时间

`validate(data: BlockToolData): Promise<boolean>` — 如果存在，调用工具的校验方法

## Api 对象描述

通用 API 接口。

```js
export interface API {
   blocks: IBlocksAPI;
   caret: ICaretAPI;
   sanitizer: ISanitizerAPI;
   toolbar: IToolbarAPI;
   // ...
 }
 ```

#### 块的 API

块的方法

`render(data)` - 渲染传递的JSON数据

`renderFromHTML(data)` - 解析并渲染所传递的 HTML 字符串（不适用于生产）

`swap(fromIndex, toIndex)` - 按索引位置交换两个块(不建议使用：使用 `move` 代替)

`move(toIndex, fromIndex)` - 将块从一个索引移动到另一位置。
`fromIndex` 默认情况下将是当前块的索引。

`delete(blockIndex?: Number)` - 删除传入索引的块

`getCurrentBlockIndex()` - 当前块的索引

`getBlockByIndex(index: Number)` - 通过传入的索引返回Block API对象

`getBlocksCount()` - 返回块数

`stretchBlock(index: number, status: boolean)` - _不推荐使用。使用块API接口代替_。块延伸。

`insertNewBlock()` - __不推荐使用__ 运行完毕后插入新的块体

`insert(type?: string, data?: BlockToolData, config?: ToolConfig, index?: number, needToFocus?: boolean)` - 使用传递的参数插入新的块

#### 清理 API

`clean(taintString, config)` - 方法使用 HTMLJanitor 清洁污染字符串。

Editor.js提供了不带属性的基本配置，但是您可以通过传递自己的配置来继承。

如果工具启用了内联工具，我们将得到它的清理规则，并与您传递的自定义规则合并。

使用:

```js
let taintString = '<div><p style="font-size: 5em;"><b></b>BlockWithText<a onclick="void(0)"></div>'
let customConfig = {
  b: true,
  p: {
    style: true,
  },
}
this.api.sanitizer.clean(taintString, customConfig);
```

### 工具栏 API

使用工具栏的方法

`open()` - 打开工具栏

`close()` - 关闭工具栏、工具箱和块设置(如果它们已打开)

### 内联工具栏 API

与内联工具栏一起使用的方法

`open()` - 打开内联工具箱, (打开当前选中)

`close()` - 关闭内联工具箱

### 监听器 API

允许与 DOM 监听器一起使用的方法。 当您忘记删除监听器时很有用。 模块收集所有侦听器并自动销毁

`on(element: HTMLElement, eventType: string, handler: Function, useCapture?: boolean)` - 将事件侦听器添加到 HTML 元素

`off(element: HTMLElement, eventType: string, handler: Function)` - 从 HTML 元素中删除事件处理程序


### 插入符 API

管理插入位置的方法。

每个方法接受`位置(position)`和`偏移量(offset)`参数。`偏移量(offset)`应用于根据传递的字符数量对插入符号进行移位。

`Position` 可以是以下值之一：

| 值     | 描述
| --------- | -----------
| `start`   | 插入符号将设置在块的开始处
| `end`     | 插入符号将设置在块的末尾
| `default` | 或多或少地模仿浏览器的行为，在大多数情况下表现为 `start`

每个方法都返回`布尔(boolean)`值：如果插入符号设置成功，则返回 `true`；否则返回 `false`（例如，当索引处没有Block时）；

`setToFirstBlock(position?: 'end'|'start'|'default', offset?: number): boolean;` — 将插入符设置到第一个块

`setToLastBlock(position?: 'end'|'start'|'default', offset?: number): boolean;` — 将插入符设置到最后一个块

`setToNextBlock(position?: 'end'|'start'|'default', offset?: number): boolean;` — 将插入符设置到下一个块

`setToPreviousBlock(position?: 'end'|'start'|'default', offset?: number): boolean;` — 将插入符号设置为上一个块

`setToBlock(index: number, position?: 'end'|'start'|'default', offset?: number): boolean;` — 将插入符设置为按传递的索引的块

`focus(atEnd?: boolean): boolean;` — 为编辑器设置插入符号。如果`atEnd`为 `true`，则在末尾设置它。

### 通知器 API

如果您需要显示任何成功或失败事件的消息，您可以使用通知模块。

调用目标编辑器：

```javascript
let editor = new EditorJS({
  onReady: () => {
    editor.notifier.show({
      message: '编辑器已准备就绪！'
    });
  },
});
```

在工具类中：

```javascript
this.api.notifier.show({
  message: '无法上传图像。 错误的mime类型。',
  style: 'error',
});
```

![](https://capella.pics/14fcdbe4-d6eb-41d4-b66e-e0e86ccf1a4b.jpg)

在 GitHub 上查看[`codex-notifier` 包页面](https://github.com/codex-team/js-notifier)，以找到文档，参数和示例。

### 毁坏 API

如果有必要从页面中删除 Editor.js 实例，则可以使用 `destroy()` 方法。

它执行以下步骤：

1. 通过将 holder 元素的 innerHTML 设置为空字符串来清除 holder 元素

2. 删除所有与 Editor.js 相关的事件监听器

3. 从实例对象中删除所有属性，并将其原型设置为 `null`

执行 `destroy` 方法后，编辑器 incident 变为空对象。 这样，您将在页面上释放占用的JS堆。

### 工具提示(Tooltip) API

在元素附近显示工具提示助手的方法。 参数与[CodeX Tooltips](http://github.com/codex-team/codex.tooltips) 库中的参数相同。

![](https://capella.pics/00e7094a-fdb9-429b-8015-9c56f19b4ef5.jpg)

#### 显示

方法在传递的元素上显示带有自定义内容的工具提示

```js
this.api.tooltip.show(element, content, options);
```

| 参数 | 类型 | 描述 |
| -- | -- | -- |
| `element` | _HTMLElement_ | 工具提示将显示在此元素附近 |
| `content` | _String_ or _Node_ | 将附加到工具提示的内容 |
| `options` | _Object_ | 一些显示选项，请参见下文 |

可用的显示选项

| 名称 | 类型 | 动作 |
| -- | -- | -- |
| placement | `top`, `bottom`, `left`, `right` | 工具提示的放置位置。 默认值为 `bottom' |
| marginTop | _Number_ | 在工具提示上方偏移顶部位置 |
| marginBottom | _Number_ | 在工具提示下方偏移顶部位置 |
| marginLeft | _Number_ | 从工具提示左侧偏移到左侧位置 |
| marginRight | _Number_ | 从工具提示右侧偏移到右侧位置 |
| delay | _Number_ | 显示前的延迟，以毫秒为单位。 默认值为 `70` |
| hidingDelay | _Number_ | 隐藏之前的延迟，以毫秒为单位。 默认为 `0` |

#### 隐藏

方法隐藏工具提示。

```js
this.api.tooltip.hide();
```

#### 悬停

装饰器，用于通过 "mouseenter" 在某个元素附近显示工具提示，并通过 "mouseleave" 隐藏。

```js
this.api.tooltip.onHover(element, content, options);
```

### API 速记

编辑器的 API 为 API 方法提供了一些别名。

| 别名    | 方法          |
| ------   | --------------- |
| `clear`  | `blocks.clear`  |
| `render` | `blocks.render` |
| `focus`  | `caret.focus`   |
| `save`   | `saver.save`    |

> 用例

```javascript
const editor = EditorJS();

editor.focus();
editor.save();
```

