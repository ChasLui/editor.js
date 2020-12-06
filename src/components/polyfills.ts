'use strict';

/**
 * 扩展Element接口以包括前缀和实验属性
 */
interface Element {
  matchesSelector: (selector: string) => boolean;
  mozMatchesSelector: (selector: string) => boolean;
  msMatchesSelector: (selector: string) => boolean;
  oMatchesSelector: (selector: string) => boolean;

  prepend: (...nodes: Array<string | Node>) => void;
  append: (...nodes: Array<string | Node>) => void;
}

/**
 * 如果指定的选择器字符串选择了元素，
 * 则`Element.matches()`方法将返回`true`
 * 其他情况返回`false`
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill}
 *
 * @param {string} s - 选择器
 */
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.matchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.oMatchesSelector ||
    Element.prototype.webkitMatchesSelector ||
    function (s): boolean {
      const matches = (this.document || this.ownerDocument).querySelectorAll(s);
      let i = matches.length;

      while (--i >= 0 && matches.item(i) !== this) {
      }

      return i > -1;
    };
}

/**
 * Element.closest()方法返回与参数中给定的选择器匹配的当前元素（或当前元素本身）的最接近祖先。
 * 如果没有这样的祖先，则返回null。
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill}
 *
 * @param {string} s - 选择器
 */
if (!Element.prototype.closest) {
  Element.prototype.closest = function (s): Element | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let el = this;

    if (!document.documentElement.contains(el)) {
      return null;
    }

    do {
      if (el.matches(s)) {
        return el;
      }

      el = el.parentElement || el.parentNode;
    } while (el !== null);

    return null;
  };
}

/**
 * `ParentNode.prepend`方法在`ParentNode`的第一个孩子之前插入一组`Node`对象或`DOMString`对象。
 * `DOMString`对象作为等效的`Text`节点插入。
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/prepend#Polyfill}
 *
 * @param {Node | Node[] | string | string[]} nodes - 要添加的节点
 */
if (!Element.prototype.prepend) {
  Element.prototype.prepend = function prepend(nodes: Array<Node | string> | Node | string): void {
    const docFrag = document.createDocumentFragment();

    if (!Array.isArray(nodes)) {
      nodes = [ nodes ];
    }

    nodes.forEach((node: Node | string) => {
      const isNode = node instanceof Node;

      docFrag.appendChild(isNode ? node as Node : document.createTextNode(node as string));
    });

    this.insertBefore(docFrag, this.firstChild);
  };
}
