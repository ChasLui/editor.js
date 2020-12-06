# Editor.js 工具

Editor.js 是面向块(`Block`)的编辑器。这意味着该条目由不同类型的块列表组成：文本(`Texts`)，标题(`Headers`)，图像(`Images`)，引号(`Quotes`)等。

`Tool` — 是提供自定义 Block 类型的类。 插件(`Plugins`)代表的所有工具。

每个工具都应具有安装指南。

## 工具类结构

### 构造函数()

使用 params 对象调用每个工具的实例。

| 参数   | 类型                                                   | 描述                         |
| ------ | ------------------------------------------------------ | ---------------------------- |
| api    | [`IAPI`](../types/index.d.ts)                          | Editor.js 的 API 方法        |
| config | [`ToolConfig`](../types/tools/tool-config.d.ts)        | «config»中传递的特殊配置参数 |
| data   | [`BlockToolData`](../types/tools/block-tool-data.d.ts) | 要在此工具中渲染的数据       |
| block  | [`BlockAPI`](../types/api/block.d.ts)                  | Block 的 API 方法            |

[iapi-link]: ../src/types-internal/api.ts

#### 用例

```javascript
constructor({data, config, api}) {
  this.data = data;
  this.api = api;
  this.config = config;
  // ...
}
```

### render()

返回 Tool 元素 {HTMLElement} 的方法，该元素将被放置到 Editor 中。

### save()

处理 DOM 中 `render()` 函数创建的工具元素，并返回块(Block)的数据。

### validate(data: BlockToolData): boolean|Promise\<boolean\> _optional_

允许检查 Tool 数据的正确性。 如果数据未通过验证，将不会保存。接收 Tool 的 `data` 作为输入参数，并返回验证的布尔值。

### merge() _optional_

指定如何合并两个相同类型的块(Block)的方法，例如在空格(`Backspace`)按键上。
方法确实接受与`Render`格式相同的数据对象，并且应该提供如何将新数据与当前存储的值合并的逻辑。

## 内部工具设置

工具(Tool)可以指定的选项。所有设置都应作为 Tool 类的静态属性传递。

| 名称               | 类型      | 默认值      | 描述                                                                                                                                                        |
| ------------------ | --------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `toolbox`          | _Object_  | `undefined` | 传递图标(`Icon`)和标题(`Title`)以在编辑器的工具箱中显示此工具(`Tool`)<br /> `icon` - 带有工具箱图标的 HTML 字符串 <br /> `title` - 在工具箱中显示的可选标题 |
| `enableLineBreaks` | _Boolean_ | `false`     | 使用此选项，Editor.js 将无法处理 Enter 键。 对于像`<code>`这样的工具，在默认情况下应该以换行符处理换行很有帮助。                                            |
| `isInline`         | _Boolean_ | `false`     | 将工具描述为[内联工具栏的工具](tools-inline.md)                                                                                                             |
| `sanitize`         | _Object_  | `undefined` | 配置为自动清除保存的数据。请参阅[消毒器](#sanitize)部分。                                                                                                     |
| `conversionConfig` | _Object_  | `undefined` | Config 允许工具指定如何将其转换为其他工具。 请参阅[转换配置](#conversion-config)部分。                                                                      |

## 用户配置

所有工具都可以由用户配置。 您可以在 Editor Config 的`tools`属性中设置一些可用的设置以及 Tool 的类。

```javascript
var editor = new EditorJS({
  holderId: "editorjs",
  tools: {
    text: {
      class: Text,
      inlineToolbar: true,
      // 其他设置...
    },
    header: Header,
  },
  defaultBlock: "text",
});
```

Editor.js 提供的选项很少。

| 名称            | 类型            | 默认值  | 描述                                                                 |
| --------------- | --------------- | ------- | -------------------------------------------------------------------- |
| `inlineToolbar` | _Boolean/Array_ | `false` | 传递 `true` 以启用所有工具的内联工具栏，或传递具有指定工具列表的数组 |
| `config`        | _Object_        | `null`  | 插件的用户配置。                                                     |

## 工具准备和重置

如果您需要为工具准备一些数据（例如，加载外部脚本，在文档中创建 HTML 节点等），则可以使用静态准备方法。

它接受在编辑器初始化时传递的工具 config 作为参数：

```javascript
class Tool {
  static prepare(config) {
    loadScript();
    insertNodes();
    ...
  }
}
```

在 Editor destroy 上，可以使用相反的方法 `reset` 来清除所有准备的数据：

```javascript
class Tool {
  static reset() {
    cleanUpScripts();
    deleteNodes();
    ...
  }
}
```

两种方法都可能是异步的。

## 粘贴处理

Editor.js 处理块上的粘贴，并提供用于处理粘贴数据的工具 API。

当用户将内容粘贴到编辑器中时，粘贴的内容将被拆分为多个块。

1. 如果纯文本将被粘贴，它将被新行字符分隔
2. 如果将粘贴 HTML 字符串，则将按块标签进行拆分

此外，Editor API 还允许您定义自己的粘贴方案。 您可以：

1. 指定可以由您的工具表示的 **HTML 标签**。 例如，图像工具可以处理`<img>`标签。 如果在内容粘贴中找到您指定的标签，则将呈现您的工具。
2. 为粘贴的字符串指定**正则表达式(RegExp)**。 如果已匹配模式，则将渲染您的工具。
3. 指定**MIME 类型**或**文件扩展名**，在拖放或从剪贴板粘贴时，您的工具可以处理这些文件。

对于每种情况，您应该做以下 2 件事：

1. 在 Tool 类中定义静态 getter `pasteConfig`。 在此指定已处理的模式。
2. 定义公开方法 `onPaste`，该方法将处理 PasteEvent 以处理已粘贴的数据。

### HTML 标签处理

要处理从 `pasteConfig` getter 返回的粘贴的 HTML 元素对象，应包含以下字段：

| 名称   | 类型       | 描述                                                                       |
| ------ | ---------- | -------------------------------------------------------------------------- |
| `tags` | `String[]` | _可选_。 应包含您要从粘贴的数据中提取并由 `onPaste` 方法处理的所有标签名称 |

为了正确地工作，你必须至少为 `defaultBlock` 工具提供 `onPaste` 处理程序

> 用例

标题工具可以使用粘贴处理 API 处理 `H1`-`H6` 标签

```javascript
static get pasteConfig() {
  return {
    tags: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
  }
}
```

> 同样的标签只能由一个(第一个指定的)工具处理。

### 正则表达式模式处理

您的工具可以通过 RegExp 模式分析文本，将粘贴的字符串替换为所需的数据。从 `pasteConfig` getter 返回的对象应该包含以下字段以使用模式：

| 名称       | 类型     | 描述                                                              |
| ---------- | -------- | ----------------------------------------------------------------- |
| `patterns` | `Object` | _可选_。 模式对象(`patterns`)包含 RegExp 模式，其名称作为对象的键 |

**注意** 编辑器将检查模式的完全匹配，因此不要忘记在那里处理所有可用字符。

仅当粘贴在`defaultBlock` Tool 上且粘贴的字符串长度小于 450 个字符时，才会处理图案。

> 用例

您可以处理 YouTube 链接并插入嵌入的视频：

```javascript
static get pasteConfig() {
  return {
    patterns: {
      youtube: /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?[\w\?‌​=]*)?/
    },
  }
}
```

### 文件粘贴

您的工具可以处理粘贴或拖放到编辑器中的文件。

要处理文件，应在 `pa​​steConfig` 配置对象中提供 `files` 属性。

`files` 属性是具有以下字段的对象：

| 名称         | 类型       | 描述                                           |
| ------------ | ---------- | ---------------------------------------------- |
| `extensions` | `string[]` | _可选_。您的工具可以处理的可选扩展数组         |
| `mimeTypes`  | `sring[]`  | _可选_。您的工具可以处理的 MIME 类型的可选数组 |

用例

```javascript
static get pasteConfig() {
  return {
    files: {
      mimeTypes: ['image/png'],
      extensions: ['json']
    }
  }
}
```

### 粘贴数据处理

如果您在 `pasteConfig` 属性中注册了一些粘贴替换，则**应在** Tool 类中提供 `onPaste` 回调。 onPaste 应该是公共的非静态方法。 它接受自定义 PasteEvent 对象作为参数。

PasteEvent 是标签(`tag`)、模式(`pattern`)和文件(`file`)三种类型事件的别名。可以从 PasteEvent 对象的 `type` 属性获取类型。
这些事件中的每一个都提供了带有关于已粘贴内容信息的 `detail` 属性。

| 类型      | 详情(Detail)                                                                 |
| --------- | ---------------------------------------------------------------------------- |
| `tag`     | `data` - 粘贴的 HTML 元素                                                    |
| `pattern` | `key` - 您在 `pasteConfig` 对象中指定的匹配模式键 <br /> `data` - 粘贴字符串 |
| `file`    | `file` - 粘贴的文件                                                          |

例子

```javascript
onPaste (event) {
  switch (event.type) {
    case 'tag':
      const element = event.detail.data;

      this.handleHTMLPaste(element);
      break;

    case 'pattern':
      const text = event.detail.data;
      const key = event.detail.key;

      this.handlePatternPaste(key, text);
      break;

    case 'file':
      const file = event.detail.file;

      this.handleFilePaste(file);
      break;
  }
}
```

### 禁用粘贴处理

如果出于某种原因需要在工具上禁用粘贴处理，则可以提供 `false` 作为 `pasteConfig` 值。 这样，如果在您的工具上触发，则粘贴事件将不会被处理：

```javascript
static get pasteConfig {
  return false;
}
```

## 消毒器 <a name="sanitize"></a>

Editor.js 提供了用于清理污点字符串的[API](sanitizer.md)。
在 `save()` 方法中手动使用它，或通过 `sanitizer` 配置自动执行它。

### 消毒器的配置

消毒器配置示例

```javascript
let sanitizerConfig = {
  b: true, // 离开 <b>
  p: true, // 离开 <p>
};
```

配置对象的键是标签，值是规则。

#### 规则

规则可以是布尔值，对象或函数。 对象是标记属性规则的字典。

您可以将 `true` 设置为允许带有所有属性的标签，或者将 `false|{}` 删除所有属性，但保留标签。

另外，您可以传递要离开的特殊属性。

```javascript
a: {
  href: true;
}
```

如果您想使用自定义处理程序，use应该指定返回规则的函数。

```javascript
b: function(el) {
  return !el.textContent.includes('bad text');
}
```

或者

```javascript
a: function(el) {
  let anchorHref = el.getAttribute('href');
  if (anchorHref && anchorHref.substring(0, 4) === 'http') {
    return {
      href: true,
      target: '_blank'
    }
  } else {
    return {
      href: true
    }
  }
}
```

### 手动消毒器

在返回数据中的每个字段的 `save` 方法处调用 API 方法 `sanitizer.clean()`。

```javascript
save() {
  return {
    text: this.api.sanitizer.clean(taintString, sanitizerConfig)
  }
}
```

### 自动消毒器

如果您将清除程序配置作为静态 getter 传递，则Editor.js 将自动清除保存的数据。

请注意，如果允许您的工具使用内联工具栏，我们将为每个内联工具获取清理规则，并与您传递的配置合并。

您可以为每个字段定义规则

```javascript
static get sanitize() {
  return {
    text: {},
    items: {
      b: true, // 离开 <b>
      a: false, // 移除 <a>
    }
  }
}
```

不要忘记为每个嵌入的子项设置规则，否则它们将不会被清除。

如果您想清理所有内容并获取没有任何标签的数据，请使用`{}`或忽略字段以防万一，如果要获取纯HTML

```javascript
static get sanitize() {
  return {
    text: {},
    items: {}, // 此规则将用于此对象的所有属性
    // 或者
    items: {
      // 这里的其他对象不会被清理
      subitems: {
        // 离开 <a> 和 <b> 在子项目中
        a: true,
        b: true,
      }
    }
  }
}
```

## 转换(Conversion)设置 <a name="conversion-config"></a>

Editor.js具有转换工具栏，允许用户将一个块转换为另一个块。

![](https://capella.pics/6c1f708b-a30c-4ffd-a427-5b59a1a472e0.jpg)

1. 您可以为要转换的工具添加功能。 指定 `conversionConfig` 的 «export» 属性。
2. `conversionConfig`.您可以添加将其他工具转换为工具的功能。 指定 `conversionConfig` 的 «import» 属性。

当用户选择了几乎所有块的内容时，转换工具栏将只显示在指定 «export» 规则的块附近。此工具栏将只包含指定 «import» 规则的工具。

例子:

```js
class Header {
  constructor() {
    this.data = {
      text: "",
      level: 2,
    };
  }

  /**
   * 规则指定了我们的工具如何与其他工具转换。
   */
  static get conversionConfig() {
    return {
      export: "text", // 工具数据的这个属性将作为字符串传递给其他工具
      import: "text", // 导入的字符串将被传递到此属性
    };
  }
}
```

### 你的 Tool -> 其他 Tool

«export»字段指定如何将您的工具数据表示为字符串以将其传递给其他工具。

它可以是字符串(`String`)或函数(`Function`)。

`String` 表示工具数据对象的键，应将其用作要导出的字符串。

`Function` 是一种接受您的工具数据并组成一个字符串以从中导出的方法。 请参见下面的示例：

```js
class ListTool {
  constructor() {
    this.data = {
      items: ["Fisrt item", "Second item", "Third item"],
      type: "ordered",
    };
  }

  static get conversionConfig() {
    return {
      export: (data) => {
        return data.items.join("."); // 在此示例中，所有列表项都将连接到导出字符串
      },
      // ... 导入规则
    };
  }
}
```

### 其他 Tool -> 你的 Tool

«import» 规则指定如何从原始块创建的字符串创建工具的数据对象。

它可以是字符串(`String`)或函数(`Function`)。

`String`表示工具数据中的键，将由导出的字符串填充。 例如，`import: 'text'` 意味着您的块的构造函数将接受 `text` 属性为 `data` 的数据对象，该数据对象将填充由原始块组成的字符串。

`Function` 允许您指定自己的逻辑，即如何将字符串转换为工具数据。 例如：

```js
class ListTool {
  constructor(data) {
    this.data = data || {
      items: [],
      type: "unordered",
    };
  }

  static get conversionConfig() {
    return {
      // ... 导出规则

      /**
       * 在此示例中，列表工具通过将原始文本用点符号分隔来创建项目。
       */
      import: (string) => {
        const items = string.split(".");

        return {
          items: items.filter((text) => text.trim() !== ""),
          type: "unordered",
        };
      },
    };
  }
}
```

## 块(Block)生命周期挂钩

### `rendered()`

在将块内容添加到页面后调用

### `updated()`

每次更新块内容时调用

### `removed()`

在从页面中删除块内容之后但在删除块实例之前调用

### `moved(MoveEvent)`

块移动后调用。 `MoveEvent` 分别包含 `fromIndex` 和`toIndex`。
