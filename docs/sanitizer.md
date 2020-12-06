# Editor.js 消毒器模块

`Sanitizer`模块表示一组清除污染字符串的方法。
使用轻量级 npm 包与简单的 API [html-janitor](https://www.npmjs.com/package/html-janitor)

## 方法

### clean

```javascript
clean(taintString, customConfig);
```

> 清理传递的污点字符串

#### 参数

| 参数         | 类型   |                         说明                          |
| ------------ | ------ | :---------------------------------------------------: |
| taintString  | String |                   需要清理的字符串                    |
| customConfig | Object | 可以根据使用情况传递新的配置（Default：使用默认配置） |
