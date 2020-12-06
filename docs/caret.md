# Editor.js 插入符模块

`Caret` 模块包含使用插入符号的方法。使用 [Range](https://developer.mozilla.org/en-US/docs/Web/API/Range) 方法在块之间导航插入符号。

Caret 类实现基本的 Module 类，该类包含用户配置和默认的 Editor.js 实例

## 属性

## 方法

### setToBlock

```javascript
Caret.setToBlock(block, position, offset);
```

> 方法获取 Block 实例，然后将插入符号插入具有偏移量的文本节点

#### 参数

| 参数     | 类型   |                                          描述                                           |
| -------- | ------ | :-------------------------------------------------------------------------------------: |
| block    | Object |                                BlockManager 创建的块实例                                |
| position | String | `可以是`start`、`end`或`default`。其他值将被视为`default`。显示插入符号相对于块的位置。 |
| offset   | Number |                         有关文本节点的插入符号偏移量 (默认: 0)                          |

### setToTheLastBlock

```javascript
Caret.setToTheLastBlock();
```

> 在最后一个方块的末尾设置插入符号 <br/> 如果最后一个块不为空，则插入另一个作为初始传递的空块
