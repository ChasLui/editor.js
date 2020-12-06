# Editor.js 工具栏块设置模块

工具栏模块具有用于块设置的空间。 设置分为：

- 插件设置的空间，由«Plugin»的开发者描述
- 默认设置的空间。该选项也可以实现和扩展

第一个选项由插件指定，每个块可以具有不同的选项，而第二个选项针对每个块而与插件的选项无关。

### 让我们看一些例子:

«Plugin»的开发人员需要扩展返回HTML的«renderSettings»方法。
每个用户操作将由其自己处理。 因此，您可以轻松编写用于切换内容或使内容更好的回调。
有关更多信息，请阅读 [Tools](tools.md)。

---

«Tune»的开发人员需要实现内核提供的接口来开发将出现在工具栏默认设置区域的曲调。

Tunes 必须扩展两个重要的方法:

- `render()` - 返回 HTML 并将其附加到默认设置区域
- `save()` - 提取要保存的重要信息

没有限制。自己处理用户操作

创建实现 `block-tune.ts` 的类

您的 Tune 构造函数获取参数作为对象，它包括:

- {Object} api - 对象包含模块中的 public 方法。 更多查看 [API](api.md)
- {Object} settings - 包含块默认状态。这个对象可以有关于封面、锚等等的信息。

TypeScript 例子:

```js

import IBlockTune from './block-tune';

export default class YourCustomTune implements IBlockTune {

  public constructor({api, settings}) {
    this.api = api;
    this.settings = settings;
  }

  render() {
    let someHTML = '...';
    return someHTML;
  }

  save() {
    // 返回需要保存的重要数据
    return object
  }

  someMethod() {
    // 将当前块向下移动
    this.api.blocks.moveDown();
  }
}
```

ES6 例子:

```js
export default class YourCustomTune {
  constructor({ api, settings }) {
    this.api = api;
    this.settings = settings;
  }

  render() {
    let someHTML = "...";
    return someHTML;
  }

  save() {
    // 返回需要保存的重要数据
    return object;
  }

  someMethod() {
    // 将当前块向下移动
    this.api.blocks.moveDown();
  }
}
```
