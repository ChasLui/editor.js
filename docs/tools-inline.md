# 内联工具栏

与以[Tools](tools.md)表示的块类似，您可以为内联工具栏创建工具。 它将与选定的文本片段一起使用。 最简单的示例是粗体(`bold`)或斜体(`italic`)工具。

## 基础结构

首先，Tool 的类应将 `isInline` 属性（静态 getter）设置为 `true`。

之后，内联工具应实现以下方法。

- `render()` — 创建一个按钮
- `surround()` — 在选定范围内工作
- `checkState()` — 按选定范围获取工具的激活状态

另外，您可以提供可选方法

- `renderActions()` — 在按钮下方创建其他元素
- `clear()` — 在 打开/关闭 嵌入式工具栏时清除工具的内容
- `sanitize()` — 消毒器配置

在 Tool 的类示例的构造函数中，您将接受一个带有 [API](api.md) 的对象作为参数。

---

### render()

返回按钮以附加到内联工具栏的方法

#### 参数

方法不接受任何参数

#### 返回值

类型 | 说明 |
-- | -- |
`HTMLElement` | 元素将被添加到内联工具栏 |

---

### surround(range: Range)

该方法接受选定的范围并以某种方式将其封装

#### 参数

名称 | 类型 | 描述 |
-- |-- | -- |
range | Range | 当前选择的第一个范围 |

#### 返回值

没有返回值

---

### checkState(selection: Selection)

获取选择并检测是否已应用工具。 例如，在该工具之后，可以突出显示按钮或显示一些详细信息。

#### 参数

名称 | 类型 | 描述 |
-- |-- | -- |
selection | Selection | 当前选中 |

#### 返回值

类型 | 描述 |
-- | -- |
`Boolean` | 如果工具处于活动状态，则为`true`；否则为`false` |

---

### renderActions()

返回带有操作的其他 Element 的可选方法。 例如，为“链接”工具输入或为“注释”工具输入文本区域。 它将位于内联工具栏的按钮列表下方。

#### 参数

方法不接受任何参数

#### 返回值

类型 | 描述 |
-- | -- |
`HTMLElement` | 元素将被添加到内联工具栏 |

---

### clear()

在打开/关闭嵌入式工具栏时将调用的可选方法。 可以包含清除工具内容的逻辑，例如输入，状态等。

#### 参数

方法不接受任何参数

#### 返回值

没有返回值

### static get sanitize()

我们建议指定与工具使用的内联标签相对应的Sanitizer配置。 在这种情况下，您的配置将与“块工具”的消毒器配置合并，后者将“内联工具栏”与“工具”一起使用。

例子:

如果您的工具使用`<b>`标签包裹了选定的文本，则消毒器程序配置应如下所示：

```js
static get sanitize() {
  return {
    b: {} // {} 表示清除所有属性。 true - 保留所有属性
  }
}
```

在[Tools#sanitize](tools.md#sanitize)上了解有关 Sanitizer 配置的更多信息

### 指定标题

您可以通过 `title` 静态 getter 传递工具的标题。 例如，它可以在工具提示中使用，并带有悬停出现的图标说明。

![](https://editorjs.io/uploads/87407851a6a7b346dc4bf94ba993b4d6.jpeg)

```ts
export default class BoldInlineTool implements InlineTool {
  /**
   * 将工具指定为嵌入式工具栏工具
   *
   * @return {boolean}
   */
  public static isInline = true;

  /**
   * 悬停工具提示的标题
   */
  public static title: string = 'Bold';

  // ... 其他方法
}
```
