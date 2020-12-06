import * as _ from './utils';

/**
 * DOM 操作助手
 */
export default class Dom {
  /**
   * 检查传递的标签是否没有关闭的标签
   *
   * @param {HTMLElement} tag - 要检查的元素
   * @returns {boolean}
   */
  public static isSingleTag(tag: HTMLElement): boolean {
    return tag.tagName && [
      'AREA',
      'BASE',
      'BR',
      'COL',
      'COMMAND',
      'EMBED',
      'HR',
      'IMG',
      'INPUT',
      'KEYGEN',
      'LINK',
      'META',
      'PARAM',
      'SOURCE',
      'TRACK',
      'WBR',
    ].includes(tag.tagName);
  }

  /**
   * 检查元素是 BR 还是 WBR
   *
   * @param {HTMLElement} element - 要检查的元素
   * @returns {boolean}
   */
  public static isLineBreakTag(element: HTMLElement): element is HTMLBRElement {
    return element && element.tagName && [
      'BR',
      'WBR',
    ].includes(element.tagName);
  }

  /**
   * 使用类名和属性制作 Elements 的助手
   *
   * @param  {string} tagName - 显得 Element 标签名
   * @param  {string[]|string} [classNames] - CSS类名的列表或名称
   * @param  {object} [attributes] - 任意属性
   *
   * @returns {HTMLElement}
   */
  public static make(tagName: string, classNames: string|string[] = null, attributes: object = {}): HTMLElement {
    const el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (const attrName in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, attrName)) {
        el[attrName] = attributes[attrName];
      }
    }

    return el;
  }

  /**
   * 使用传递的内容创建文本节点
   *
   * @param {string} content - 文本内容
   *
   * @returns {Text}
   */
  public static text(content: string): Text {
    return document.createTextNode(content);
  }

  /**
   * 创建链接到精灵图的SVG图标
   *
   * @param {string} name - 精灵图标的名称（id）
   * @param {number} [width] - icon 宽度
   * @param {number} [height] - icon 高度
   *
   * @returns {SVGElement}
   */
  public static svg(name: string, width = 14, height = 14): SVGElement {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    icon.classList.add('icon', 'icon--' + name);
    icon.setAttribute('width', width + 'px');
    icon.setAttribute('height', height + 'px');
    icon.innerHTML = `<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#${name}"></use>`;

    return icon;
  }

  /**
   * 将一个或多个元素附加到父级
   *
   * @param  {Element|DocumentFragment} parent - 在哪里追加
   * @param  {Element|Element[]|DocumentFragment|Text|Text[]} elements - 元素列表
   */
  public static append(
    parent: Element|DocumentFragment,
    elements: Element|Element[]|DocumentFragment|Text|Text[]
  ): void {
    if (Array.isArray(elements)) {
      elements.forEach((el) => parent.appendChild(el));
    } else {
      parent.appendChild(elements);
    }
  }

  /**
   * 将元素或一对添加到父元素的开头
   *
   * @param {Element} parent - 在哪里追加
   * @param {Element|Element[]} elements - 元素列表
   */
  public static prepend(parent: Element, elements: Element|Element[]): void {
    if (Array.isArray(elements)) {
      elements = elements.reverse();
      elements.forEach((el) => parent.prepend(el));
    } else {
      parent.prepend(elements);
    }
  }

  /**
   * 交换父元素中的两个元素
   *
   * @param {HTMLElement} el1 - from
   * @param {HTMLElement} el2 - to
   * @deprecated
   */
  public static swap(el1: HTMLElement, el2: HTMLElement): void {
    // 创建标记元素并将其插入到 el1 所在的位置
    const temp = document.createElement('div'),
        parent = el1.parentNode;

    parent.insertBefore(temp, el1);

    // 将 el1 向右移动到 el2 之前
    parent.insertBefore(el1, el2);

    // 将 el2 向右移到 el1 曾经所在的位置之前
    parent.insertBefore(el2, temp);

    // 删除临时标记节点
    parent.removeChild(temp);
  }

  /**
   * 选择器装饰器
   *
   * 返回第一个匹配
   *
   * @param {Element} el - 我们在里面搜索的元素。 默认-DOM Document
   * @param {string} selector - 搜索字符串
   *
   * @returns {Element}
   */
  public static find(el: Element|Document = document, selector: string): Element {
    return el.querySelector(selector);
  }

  /**
   * 根据 Id 获取元素
   *
   * @param {string} id - 要查找的 Id
   * @returns {HTMLElement | null}
   */
  public static get(id: string): HTMLElement | null {
    return document.getElementById(id);
  }

  /**
   * 选择器装饰器
   *
   * 返回所有匹配的
   *
   * @param {Element|Document} el - 我们在里面搜索的元素。 默认-DOM Document
   * @param {string} selector - 搜索字符串
   *
   * @returns {NodeList}
   */
  public static findAll(el: Element|Document = document, selector: string): NodeList {
    return el.querySelectorAll(selector);
  }

  /**
   * 返回所有文本输入的CSS选择器
   */
  public static get allInputsSelector(): string {
    const allowedInputTypes = ['text', 'password', 'email', 'number', 'search', 'tel', 'url'];

    return '[contenteditable], textarea, input:not([type]), ' +
      allowedInputTypes.map((type) => `input[type="${type}"]`).join(', ');
  }

  /**
   * 查找通过 holder 包含的所有可 contendeditable、textarea 和可编辑的 input 元素
   *
   * @param holder - 元素在哪里找到 input
   */
  public static findAllInputs(holder: Element): HTMLElement[] {
    return _.array(holder.querySelectorAll(Dom.allInputsSelector))
      /**
       * 如果 contenteditable 元素包含block元素，则将其视为 input。
       */
      .reduce((result, input) => {
        if (Dom.isNativeInput(input) || Dom.containsOnlyInlineElements(input)) {
          return [...result, input];
        }

        return [...result, ...Dom.getDeepestBlockElements(input)];
      }, []);
  }

  /**
   * 搜索最深的节点，即Leaf。
   * Leaf 是没有任何子节点的顶点
   *
   * @description 方法递归地抛出所有节点，直到找到叶子
   *
   * @param {Node} node - 根节点。 从这个顶点开始深度优先搜索
   *                      {@link https://en.wikipedia.org/wiki/Depth-first_search}
   * @param {boolean} [atLast] - 查找最后一个文本节点
   *
   * @returns {Node} - 它可以是文本节点或元素节点，因此插入符号将能够使用它
   */
  public static getDeepestNode(node: Node, atLast = false): Node {
    /**
     * 当前函数有两个方向：
     *  - 从第一个孩子开始，每次都获得第一个或下一个
     *  - 从最后一个孩子开始并获得最后一个或前一个
     *
     * @type {string}
     */
    const child = atLast ? 'lastChild' : 'firstChild',
        sibling = atLast ? 'previousSibling' : 'nextSibling';

    if (node && node.nodeType === Node.ELEMENT_NODE && node[child]) {
      let nodeChild = node[child] as Node;

      /**
       * 当child是不能包含任何内容的单个标签时的特殊情况
       */
      if (
        Dom.isSingleTag(nodeChild as HTMLElement) &&
        !Dom.isNativeInput(nodeChild) &&
        !Dom.isLineBreakTag(nodeChild as HTMLElement)
      ) {
        /**
         * 1) 我们需要检查下一个兄弟。如果是 Node Element，则继续从同级节点中搜索最深的节点
         *
         * 2) 如果单个标签的下一个兄弟为空，则返回父对象并检查其兄弟。如果节点元素继续搜索
         *
         * 3) 如果以上条件均未发生，则返回父节点元素
         */
        if (nodeChild[sibling]) {
          nodeChild = nodeChild[sibling];
        } else if (nodeChild.parentNode[sibling]) {
          nodeChild = nodeChild.parentNode[sibling];
        } else {
          return nodeChild.parentNode;
        }
      }

      return this.getDeepestNode(nodeChild, atLast);
    }

    return node;
  }

  /**
   * 检查对象是否为DOM节点
   *
   * @param {*} node - 要检查的对象
   *
   * @returns {boolean}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static isElement(node: any): node is Element {
    if (_.isNumber(node)) {
      return false;
    }

    return node && node.nodeType && node.nodeType === Node.ELEMENT_NODE;
  }

  /**
   * 检查对象是否为 DocumentFragment 节点
   *
   * @param {object} node - 要检查的对象
   * @returns {boolean}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static isFragment(node: any): node is DocumentFragment {
    if (_.isNumber(node)) {
      return false;
    }

    return node && node.nodeType && node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
  }

  /**
   * 检查传递的元素是否可编辑
   *
   * @param {HTMLElement} element - 要检查的html元素
   *
   * @returns {boolean}
   */
  public static isContentEditable(element: HTMLElement): boolean {
    return element.contentEditable === 'true';
  }

  /**
   * 检查传递的元素是否为原生 input
   *
   * @param {*} target - HTML 元素或字符串
   *
   * @returns {boolean}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static isNativeInput(target: any): target is HTMLInputElement | HTMLTextAreaElement {
    const nativeInputs = [
      'INPUT',
      'TEXTAREA',
    ];

    return target && target.tagName ? nativeInputs.includes(target.tagName) : false;
  }

  /**
   * 检查是否可以设置插入符号
   *
   * @param {HTMLElement} target - 要检查的 target
   *
   * @returns {boolean}
   */
  public static canSetCaret(target: HTMLElement): boolean {
    let result = true;

    if (Dom.isNativeInput(target)) {
      switch (target.type) {
        case 'file':
        case 'checkbox':
        case 'radio':
        case 'hidden':
        case 'submit':
        case 'button':
        case 'image':
        case 'reset':
          result = false;
          break;
      }
    } else {
      result = Dom.isContentEditable(target);
    }

    return result;
  }

  /**
   * 检查节点是否为空
   *
   * @description 方法检查没有空子的简单Node
   * 如果您的节点具有2个或更多子级ID深度，则最好使用 {@link Dom#isEmpty} 方法
   *
   * @param {Node} node - 要检查的节点
   *
   * @returns {boolean} 如果为空，则返回 true
   */
  public static isNodeEmpty(node: Node): boolean {
    let nodeText;

    if (this.isSingleTag(node as HTMLElement) && !this.isLineBreakTag(node as HTMLElement)) {
      return false;
    }

    if (this.isElement(node) && this.isNativeInput(node)) {
      nodeText = (node as HTMLInputElement).value;
    } else {
      nodeText = node.textContent.replace('\u200B', '');
    }

    return nodeText.trim().length === 0;
  }

  /**
   * 检查节点是否没有任何子节点
   *
   * @param {Node} node - 要检查的节点
   *
   * @returns {boolean}
   */
  public static isLeaf(node: Node): boolean {
    if (!node) {
      return false;
    }

    return node.childNodes.length === 0;
  }

  /**
   * 广度优先搜索 (BFS)
   * {@link https://en.wikipedia.org/wiki/Breadth-first_search}
   *
   * @description 推送以堆栈所有DOM叶子并检查是否为空
   *
   * @param {Node} node - 要检查的节点
   * @returns {boolean}
   */
  public static isEmpty(node: Node): boolean {
    /**
     * 标准化节点以将多个文本节点合并为一个，以减少Tree Walker迭代
     */
    node.normalize();

    const treeWalker = [ node ];

    while (treeWalker.length > 0) {
      node = treeWalker.shift();

      if (!node) {
        continue;
      }

      if (this.isLeaf(node) && !this.isNodeEmpty(node)) {
        return false;
      }

      if (node.childNodes) {
        treeWalker.push(...Array.from(node.childNodes));
      }
    }

    return true;
  }

  /**
   * 检查字符串是否包含 html 元素
   *
   * @param {string} str - 要检查的字符串
   *
   * @returns {boolean}
   */
  public static isHTMLString(str: string): boolean {
    const wrapper = Dom.make('div');

    wrapper.innerHTML = str;

    return wrapper.childElementCount > 0;
  }

  /**
   * 返回节点文本内容的长度
   *
   * @param {Node} node - 有内容的节点
   *
   * @returns {number}
   */
  public static getContentLength(node: Node): number {
    if (Dom.isNativeInput(node)) {
      return (node as HTMLInputElement).value.length;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      return (node as Text).length;
    }

    return node.textContent.length;
  }

  /**
   * 返回块 html 元素名称的数组
   *
   * @returns {string[]}
   */
  public static get blockElements(): string[] {
    return [
      'address',
      'article',
      'aside',
      'blockquote',
      'canvas',
      'div',
      'dl',
      'dt',
      'fieldset',
      'figcaption',
      'figure',
      'footer',
      'form',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'header',
      'hgroup',
      'hr',
      'li',
      'main',
      'nav',
      'noscript',
      'ol',
      'output',
      'p',
      'pre',
      'ruby',
      'section',
      'table',
      'tr',
      'tfoot',
      'ul',
      'video',
    ];
  }

  /**
   * 检查传递的内容是否仅包含内联元素
   *
   * @param {string|HTMLElement} data - 元素或 html 字符串
   *
   * @returns {boolean}
   */
  public static containsOnlyInlineElements(data: string | HTMLElement): boolean {
    let wrapper: HTMLElement;

    if (_.isString(data)) {
      wrapper = document.createElement('div');
      wrapper.innerHTML = data;
    } else {
      wrapper = data;
    }

    const check = (element: HTMLElement): boolean => {
      return !Dom.blockElements.includes(element.tagName.toLowerCase()) &&
        Array.from(element.children).every(check);
    };

    return Array.from(wrapper.children).every(check);
  }

  /**
   * 查找并返回传递的父级中的所有块元素（包括子树）
   *
   * @param {HTMLElement} parent - 根元素
   *
   * @returns {HTMLElement[]}
   */
  public static getDeepestBlockElements(parent: HTMLElement): HTMLElement[] {
    if (Dom.containsOnlyInlineElements(parent)) {
      return [ parent ];
    }

    return Array.from(parent.children).reduce((result, element) => {
      return [...result, ...Dom.getDeepestBlockElements(element as HTMLElement)];
    }, []);
  }

  /**
   * 从{string}获取持有者或返回HTMLElement的助手
   *
   * @param {string | HTMLElement} element - 持有者的 ID 或持有者的 HTML 元素
   *
   * @returns {HTMLElement}
   */
  public static getHolder(element: string | HTMLElement): HTMLElement {
    if (_.isString(element)) {
      return document.getElementById(element);
    }

    return element;
  }

  /**
   * 方法检查传递的节点是否是某个扩展节点
   *
   * @param {Node} node - any node
   *
   * @returns {boolean}
   */
  public static isExtensionNode(node: Node): boolean {
    const extensions = [
      'GRAMMARLY-EXTENSION',
    ];

    return node && extensions.includes(node.nodeName);
  }

  /**
   * 如果element是锚点（是A标签），则返回true
   *
   * @param {Element} element - 要检查的元素
   *
   * @returns {boolean}
   */
  public static isAnchor(element: Element): element is HTMLAnchorElement {
    return element.tagName.toLowerCase() === 'a';
  }
}
