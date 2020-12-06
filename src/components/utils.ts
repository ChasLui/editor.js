/**
 * Util 类
 */

import Dom from './dom';

/**
 * 可能的日志级别
 */
export enum LogLevels {
  VERBOSE = 'VERBOSE',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * 允许使用全局版本，该版本将被 Webpack 覆盖
 */
declare const VERSION: string;

/**
 * @typedef {object} ChainData
 * @property {object} data - 将传递给成功或回退的数据
 * @property {Function} function - 必须异步调用的函数
 *
 * @interface ChainData
 */
export interface ChainData {
  data?: object;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function: (...args: any[]) => any;
}

/**
 * Editor.js utils
 */

/**
 * 返回基本键盘码作为常量
 *
 * @returns {{}}
 */
export const keyCodes = {
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,
  SHIFT: 16,
  CTRL: 17,
  ALT: 18,
  ESC: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  DOWN: 40,
  RIGHT: 39,
  DELETE: 46,
  META: 91,
};

/**
 * 返回鼠标按钮代码
 */
export const mouseButtons = {
  LEFT: 0,
  WHEEL: 1,
  RIGHT: 2,
  BACKWARD: 3,
  FORWARD: 4,
};

/**
 * 自定义日志
 *
 * @param {boolean} labeled — 如果为true，则显示 Editor.js 标签
 * @param {string} msg  - 消息
 * @param {string} type - 日志类型 'log'|'warn'|'error'|'info'
 * @param {*} [args]      - argument 日志消息
 * @param {string} style  - 对消息的附加样式化
 */
function _log(
  labeled: boolean,
  msg: string,
  type = 'log',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any,
  style = 'color: inherit'
): void {
  if (!('console' in window) || !window.console[type]) {
    return;
  }

  const isSimpleType = ['info', 'log', 'warn', 'error'].includes(type);
  const argsToPass = [];

  switch (_log.logLevel) {
    case LogLevels.ERROR:
      if (type !== 'error') {
        return;
      }
      break;

    case LogLevels.WARN:
      if (!['error', 'warn'].includes(type)) {
        return;
      }
      break;

    case LogLevels.INFO:
      if (!isSimpleType || labeled) {
        return;
      }
      break;
  }

  if (args) {
    argsToPass.push(args);
  }

  const editorLabelText = `Editor.js ${VERSION}`;
  const editorLabelStyle = `line-height: 1em;
            color: #006FEA;
            display: inline-block;
            font-size: 11px;
            line-height: 1em;
            background-color: #fff;
            padding: 4px 9px;
            border-radius: 30px;
            border: 1px solid rgba(56, 138, 229, 0.16);
            margin: 4px 5px 4px 0;`;

  if (labeled) {
    if (isSimpleType) {
      argsToPass.unshift(editorLabelStyle, style);
      msg = `%c${editorLabelText}%c ${msg}`;
    } else {
      msg = `( ${editorLabelText} )${msg}`;
    }
  }

  try {
    if (!isSimpleType) {
      console[type](msg);
    } else if (args) {
      console[type](`${msg} %o`, ...argsToPass);
    } else {
      console[type](msg, ...argsToPass);
    }
  } catch (ignored) {}
}

/**
 * 当前日志等级
 */
_log.logLevel = LogLevels.VERBOSE;

/**
 * 设置当前日志等级
 *
 * @param {LogLevels} logLevel - 要设置的日志等级
 */
export function setLogLevel(logLevel: LogLevels): void {
  _log.logLevel = logLevel;
}

/**
 * 没有 Editor.js 标签的 _log 方法代理
 */
export const log = _log.bind(window, false);

/**
 * 具有 Editor.js 标签的 _log 方法代理
 */
export const logLabeled = _log.bind(window, true);

/**
 * 返回字符串表示形式获取对象类型的
 *
 * @param {*} object - 要获取类型的对象
 *
 * @returns {string}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function typeOf(object: any): string {
  return Object.prototype.toString.call(object).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

/**
 * 检查传递的变量是否为函数
 *
 * @param {*} fn - 要检验的函数
 *
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction(fn: any): fn is Function {
  return typeOf(fn) === 'function';
}

/**
 * 检查传递的参数是否为对象
 *
 * @param {*} v - 要检验的对象
 *
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isObject(v: any): v is object {
  return typeOf(v) === 'object';
}

/**
 * 检查传递的参数是否为字符串
 *
 * @param {*} v - 要校验的变量
 *
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isString(v: any): v is string {
  return typeOf(v) === 'string';
}

/**
 * 检查传递的参数是否为布尔类型
 *
 * @param {*} v - 要校验的变量
 *
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isBoolean(v: any): v is boolean {
  return typeOf(v) === 'boolean';
}

/**
 * 检查传递的参数是否为数字型
 *
 * @param {*} v - 要校验的变量
 *
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNumber(v: any): v is number {
  return typeOf(v) === 'number';
}

/**
 * 检查传递的参数是否为 undefined
 *
 * @param {*} v - 要检验的变量
 *
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isUndefined(v: any): v is undefined {
  return typeOf(v) === 'undefined';
}

/**
 * 检查传递的参数是否为 class
 *
 * @param {Function} fn - 要校验的函数
 *
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isClass(fn: any): boolean {
  return isFunction(fn) && /^\s*class\s+/.test(fn.toString());
}

/**
 * 校验是否为空对象
 *
 * @param {object} object - 要校验的对象
 *
 * @returns {boolean}
 */
export function isEmpty(object: object): boolean {
  if (!object) {
    return true;
  }

  return Object.keys(object).length === 0 && object.constructor === Object;
}

/**
 * 校验对象是否为 Promise
 *
 * @param  {*}  object - 要校验的对象
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPromise(object: any): object is Promise<any> {
  return Promise.resolve(object) === object;
}

/**
 * 如果传递的键盘码是可打印的（a-Z，0-9等）字符，则返回 `true`。
 *
 * @param {number} keyCode - 假盘码
 *
 * @returns {boolean}
 */
export function isPrintableKey(keyCode: number): boolean {
  return (keyCode > 47 && keyCode < 58) || // 数字键
    keyCode === 32 || keyCode === 13 || // 空格 & 返回键
    keyCode === 229 || // 处理某些语言（例如中文，日语等）的按键输入
    (keyCode > 64 && keyCode < 91) || // 字母键
    (keyCode > 95 && keyCode < 112) || // 数字键
    (keyCode > 185 && keyCode < 193) || // ;=,-./` (按次序)
    (keyCode > 218 && keyCode < 223); // [\]' (按次序)
}

/**
 * 异步触发 Promise 序列
 *
 * @param {ChainData[]} chains - 列表或链数据
 * @param {Function} success - 成功回调
 * @param {Function} fallback - 发生错误时触发的回调
 *
 * @returns {Promise}
 */
export async function sequence(
  chains: ChainData[],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  success: (data: object) => void = (): void => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  fallback: (data: object) => void = (): void => {}
): Promise<void> {
  /**
   * 装饰器
   *
   * @param {ChainData} chainData - 连数据
   *
   * @param {Function} successCallback - 成功回调
   * @param {Function} fallbackCallback - 失败回调
   *
   * @returns {Promise}
   */
  async function waitNextBlock(
    chainData: ChainData,
    successCallback: (data: object) => void,
    fallbackCallback: (data: object) => void
  ): Promise<void> {
    try {
      await chainData.function(chainData.data);
      await successCallback(!isUndefined(chainData.data) ? chainData.data : {});
    } catch (e) {
      fallbackCallback(!isUndefined(chainData.data) ? chainData.data : {});
    }
  }

  /**
   * 从队列中提取每个元素
   * 首先，将已解决的Promise发送为先前的值
   * 每个插件的“ prepare”方法都会返回一个Promise，
   * 这就是为什么 reduce current 元素将无法继续而无法获得已解决的 Promise 的原因
   */
  return chains.reduce(async (previousValue, currentValue) => {
    await previousValue;

    return waitNextBlock(currentValue, success, fallback);
  }, Promise.resolve());
}

/**
 * 从类数组的集合中创建数组
 *
 * @param {ArrayLike} collection - 集合转换为数组
 *
 * @returns {Array}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function array(collection: ArrayLike<any>): any[] {
  return Array.prototype.slice.call(collection);
}

/**
 * 延迟方法执行
 *
 * @param {Function} method - 执行方法
 * @param {number} timeout - 延时(毫秒)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function delay(method: (...args: any[]) => any, timeout: number) {
  return function (): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this,
        // eslint-disable-next-line prefer-rest-params
        args = arguments;

    window.setTimeout(() => method.apply(context, args), timeout);
  };
}

/**
 * 获取文件扩展名
 *
 * @param {File} file - file
 *
 * @returns {string}
 */
export function getFileExtension(file: File): string {
  return file.name.split('.').pop();
}

/**
 * 检查字符串是否为 MIME 类型
 *
 * @param {string} type - string to check
 *
 * @returns {boolean}
 */
export function isValidMimeType(type: string): boolean {
  return /^[-\w]+\/([-+\w]+|\*)$/.test(type);
}

/**
 * 防抖方法
 * 经过时间后的调用方法
 *
 * 请注意，此方法返回 Function，并且需要调用已声明的变量
 *
 * @param {Function} func - 我们正在节流的功能
 * @param {number} wait - 以毫秒为单位的时间
 * @param {boolean} immediate - 立即调用
 * @returns {Function}
 */
export function debounce(func: () => void, wait?: number, immediate?: boolean): () => void {
  let timeout;

  return (): void => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this,
        // eslint-disable-next-line prefer-rest-params
        args = arguments;

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };

    const callNow = immediate && !timeout;

    window.clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };
}

/**
 * 将传递的文本复制到剪贴板
 *
 * @param text - text to copy
 */
export function copyTextToClipboard(text): void {
  const el = Dom.make('div', 'codex-editor-clipboard', {
    innerHTML: text,
  });

  document.body.appendChild(el);

  const selection = window.getSelection();
  const range = document.createRange();

  range.selectNode(el);

  window.getSelection().removeAllRanges();
  selection.addRange(range);

  document.execCommand('copy');
  document.body.removeChild(el);
}

/**
 * 返回以 OS 名称为键和布尔值为值的对象。 显示当前的用户操作系统
 */
export function getUserOS(): {[key: string]: boolean} {
  const OS = {
    win: false,
    mac: false,
    x11: false,
    linux: false,
  };

  const userOS = Object.keys(OS).find((os: string) => navigator.appVersion.toLowerCase().indexOf(os) !== -1);

  if (userOS) {
    OS[userOS] = true;

    return OS;
  }

  return OS;
}

/**
 * 将字符串的第一个字母大写
 *
 * @param {string} text - 文本
 *
 * @returns {string}
 */
export function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}

/**
 * 递归合并对象
 *
 * @param {object} target - 合并目标
 * @param {object[]} sources - 合并源头
 * @returns {object}
 */
export function deepMerge<T extends object>(target, ...sources): T {
  if (!sources.length) {
    return target;
  }
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }

        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * 如果当前设备支持触摸事件，则返回`true`
 *
 * 注意！ 这是一个简单的解决方案，它可以给出假阳性结果。
 * 要想更仔细地检测触摸设备，请使用`touchstart`事件监听器
 *
 * @see http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
 *
 * @returns {boolean}
 */
export const isTouchSupported: boolean = 'ontouchstart' in document.documentElement;

/**
 * 使快捷方式命令更易于阅读
 *
 * @param {string} shortcut — 类似 'CMD+B' 的字符串
 */
export function beautifyShortcut(shortcut: string): string {
  const OS = getUserOS();

  shortcut = shortcut
    .replace(/shift/gi, '⇧')
    .replace(/backspace/gi, '⌫')
    .replace(/enter/gi, '⏎')
    .replace(/up/gi, '↑')
    .replace(/left/gi, '→')
    .replace(/down/gi, '↓')
    .replace(/right/gi, '←')
    .replace(/escape/gi, '⎋')
    .replace(/insert/gi, 'Ins')
    .replace(/delete/gi, '␡')
    .replace(/\+/gi, ' + ');

  if (OS.mac) {
    shortcut = shortcut.replace(/ctrl|cmd/gi, '⌘').replace(/alt/gi, '⌥');
  } else {
    shortcut = shortcut.replace(/cmd/gi, 'Ctrl').replace(/windows/gi, 'WIN');
  }

  return shortcut;
}

/**
 * 返回有效的URL。如果它跳出去并且是有效的，它就返回自己
 * 如果url有一个“斜杠”，那么它与窗口位置的原点连接，或者当url有“两个缺少”时，它仅附加协议
 *
 * @param {string} url - 要美化的 url
 */
export function getValidUrl(url: string): string {
  try {
    const urlObject = new URL(url);

    return urlObject.href;
  } catch (e) {
    // 除了在下面处理外什么都不做
  }

  if (url.substring(0, 2) === '//') {
    return window.location.protocol + url;
  } else {
    return window.location.origin + url;
  }
}

/**
 * 用传递的URL打开新标签页
 *
 * @param {string} url - 重定向的URL地址
 */
export function openTab(url: string): void {
  window.open(url, '_blank');
}

/**
 * 返回随机生成的标识符
 *
 * @param {string} prefix - 标志符前缀
 *
 * @returns {string}
 */
export function generateId(prefix = ''): string {
  // tslint:disable-next-line:no-bitwise
  return `${prefix}${(Math.floor(Math.random() * 1e8)).toString(16)}`;
}

/**
 * 用于打印有关使用已弃用的属性或方法的警告的通用方法。
 *
 * @param condition - 弃用条件。
 * @param oldProperty - 弃用的属性
 * @param newProperty - 应该使用的属性
 */
export function deprecationAssert(condition: boolean, oldProperty: string, newProperty: string): void {
  const message = `«${oldProperty}» is deprecated and will be removed in the next major release. Please use the «${newProperty}» instead.`;

  if (condition) {
    logLabeled(message, 'warn');
  }
}
