/**
 * IE9 以下的 TextRange 接口
 */
import * as _ from './utils';
import $ from './dom';

interface TextRange {
  boundingTop: number;
  boundingLeft: number;
  boundingBottom: number;
  boundingRight: number;
  boundingHeight: number;
  boundingWidth: number;
}

/**
 *  IE9以下中由 document.selection 返回的对象的接口
 */
interface MSSelection {
  createRange: () => TextRange;
  type: string;
}

/**
 * 扩展 IE9 以下的 Document 接口
 */
interface Document {
  selection?: MSSelection;
}

/**
 * 使用选择
 *
 * @typedef {SelectionUtils} SelectionUtils
 */
export default class SelectionUtils {
  /**
   * 编辑器样式
   *
   * @returns {{editorWrapper: string, editorZone: string}}
   */
  public static get CSS(): { editorWrapper: string; editorZone: string } {
    return {
      editorWrapper: 'codex-editor',
      editorZone: 'codex-editor__redactor',
    };
  }

  /**
   * 返回选择的锚点
   * {@link https://developer.mozilla.org/ru/docs/Web/API/Selection/anchorNode}
   *
   * @returns {Node|null}
   */
  public static get anchorNode(): Node | null {
    const selection = window.getSelection();

    return selection ? selection.anchorNode : null;
  }

  /**
   * 返回选定的锚元素
   *
   * @returns {Element|null}
   */
  public static get anchorElement(): Element | null {
    const selection = window.getSelection();

    if (!selection) {
      return null;
    }

    const anchorNode = selection.anchorNode;

    if (!anchorNode) {
      return null;
    }

    if (!$.isElement(anchorNode)) {
      return anchorNode.parentElement;
    } else {
      return anchorNode;
    }
  }

  /**
   * 根据锚点节点返回选择偏移量
   * {@link https://developer.mozilla.org/ru/docs/Web/API/Selection/anchorOffset}
   *
   * @returns {number|null}
   */
  public static get anchorOffset(): number | null {
    const selection = window.getSelection();

    return selection ? selection.anchorOffset : null;
  }

  /**
   * 当前选择范围是否已缩小
   *
   * @returns {boolean|null}
   */
  public static get isCollapsed(): boolean | null {
    const selection = window.getSelection();

    return selection ? selection.isCollapsed : null;
  }

  /**
   * 检查当前选择是否在编辑器区域
   *
   * @returns {boolean}
   */
  public static get isAtEditor(): boolean {
    const selection = SelectionUtils.get();

    /**
     * 在文档上选择的内容
     */
    let selectedNode = (selection.anchorNode || selection.focusNode) as HTMLElement;

    if (selectedNode && selectedNode.nodeType === Node.TEXT_NODE) {
      selectedNode = selectedNode.parentNode as HTMLElement;
    }

    let editorZone = null;

    if (selectedNode) {
      editorZone = selectedNode.closest(`.${SelectionUtils.CSS.editorZone}`);
    }

    /**
     * SelectionUtils 并未超出编辑器，因为找到了编辑器的包装器
     */
    return editorZone && editorZone.nodeType === Node.ELEMENT_NODE;
  }

  /**
   * 如果页面上存在选择，则方法返回布尔值 `true`。
   */
  public static get isSelectionExists(): boolean {
    const selection = SelectionUtils.get();

    return !!selection.anchorNode;
  }

  /**
   * 返回第一个范围
   *
   * @returns {Range|null}
   */
  public static get range(): Range | null {
    const selection = window.getSelection();

    return selection && selection.rangeCount ? selection.getRangeAt(0) : null;
  }

  /**
   * 计算所选文字的位置和大小
   *
   * @returns {DOMRect | ClientRect}
   */
  public static get rect(): DOMRect | ClientRect {
    let sel: Selection | MSSelection = (document as Document).selection,
        range: TextRange | Range;

    let rect = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    } as DOMRect;

    if (sel && sel.type !== 'Control') {
      sel = sel as MSSelection;
      range = sel.createRange() as TextRange;
      rect.x = range.boundingLeft;
      rect.y = range.boundingTop;
      rect.width = range.boundingWidth;
      rect.height = range.boundingHeight;

      return rect;
    }

    if (!window.getSelection) {
      _.log('Method window.getSelection is not supported', 'warn');

      return rect;
    }

    sel = window.getSelection();

    if (sel.rangeCount === null || isNaN(sel.rangeCount)) {
      _.log('Method SelectionUtils.rangeCount is not supported', 'warn');

      return rect;
    }

    if (sel.rangeCount === 0) {
      return rect;
    }

    range = sel.getRangeAt(0).cloneRange() as Range;

    if (range.getBoundingClientRect) {
      rect = range.getBoundingClientRect() as DOMRect;
    }
    // 退回到插入临时元素
    if (rect.x === 0 && rect.y === 0) {
      const span = document.createElement('span');

      if (span.getBoundingClientRect) {
        // 通过添加零宽度的空格字符来确保跨度具有尺寸和位置
        span.appendChild(document.createTextNode('\u200b'));
        range.insertNode(span);
        rect = span.getBoundingClientRect() as DOMRect;

        const spanParent = span.parentNode;

        spanParent.removeChild(span);

        // 将所有损坏的文本节点重新粘合在一起
        spanParent.normalize();
      }
    }

    return rect;
  }

  /**
   * 以字符串形式返回所选文本
   *
   * @returns {string}
   */
  public static get text(): string {
    return window.getSelection ? window.getSelection().toString() : '';
  }

  /**
   * 选择器实例
   *
   * @todo 检查 this 是否仍然相关
   */
  public instance: Selection = null;
  public selection: Selection = null;

  /**
   * 此属性可以存储SelectionUtils的范围以供以后还原
   *
   * @type {Range|null}
   */
  public savedSelectionRange: Range = null;

  /**
   * 假背景处于活动状态
   *
   * @returns {boolean}
   */
  public isFakeBackgroundEnabled = false;

  /**
   * 原生 Document 命令用于虚拟背景
   */
  private readonly commandBackground: string = 'backColor';
  private readonly commandRemoveFormat: string = 'removeFormat';

  /**
   * 返回 window 的 SelectionUtils
   * {@link https://developer.mozilla.org/ru/docs/Web/API/Window/getSelection}
   *
   * @returns {Selection}
   */
  public static get(): Selection {
    return window.getSelection();
  }

  /**
   * 将焦点设置为contenteditable或原生输入元素
   *
   * @param element - 元素在哪里设置焦点
   * @param offset - 光标偏移
   *
   * @returns {DOMRect} 范围
   */
  public static setCursor(element: HTMLElement, offset = 0): DOMRect {
    const range = document.createRange();
    const selection = window.getSelection();

    /** 如果找到最深的节点是原生 input */
    if ($.isNativeInput(element)) {
      if (!$.canSetCaret(element)) {
        return;
      }

      element.focus();
      element.selectionStart = element.selectionEnd = offset;

      return element.getBoundingClientRect();
    }

    range.setStart(element, offset);
    range.setEnd(element, offset);

    selection.removeAllRanges();
    selection.addRange(range);

    return range.getBoundingClientRect();
  }

  /**
   * 移除虚拟背景
   */
  public removeFakeBackground(): void {
    if (!this.isFakeBackgroundEnabled) {
      return;
    }

    this.isFakeBackgroundEnabled = false;
    document.execCommand(this.commandRemoveFormat);
  }

  /**
   * 设置虚拟背景
   */
  public setFakeBackground(): void {
    document.execCommand(this.commandBackground, false, '#a8d6ff');

    this.isFakeBackgroundEnabled = true;
  }

  /**
   * 保存 SelectionUtils 的范围
   */
  public save(): void {
    this.savedSelectionRange = SelectionUtils.range;
  }

  /**
   * 恢复已保存的 SelectionUtils 的范围
   */
  public restore(): void {
    if (!this.savedSelectionRange) {
      return;
    }

    const sel = window.getSelection();

    sel.removeAllRanges();
    sel.addRange(this.savedSelectionRange);
  }

  /**
   * 清除保存的选择器
   */
  public clearSaved(): void {
    this.savedSelectionRange = null;
  }

  /**
   * 折叠当前选择器
   */
  public collapseToEnd(): void {
    const sel = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(sel.focusNode);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * 期待从当前选择中找到通过的标签
   *
   * @param  {string} tagName       - 查找的标签
   * @param  {string} [className]   - 标签的类名
   * @param  {number} [searchDepth] - 可以包含的标签数量。 为了更好的性能。
   *
   * @returns {HTMLElement|null}
   */
  public findParentTag(tagName: string, className?: string, searchDepth = 10): HTMLElement | null {
    const selection = window.getSelection();
    let parentTag = null;

    /**
     * 如果选择丢失或找不到开始节点或结束节点，则返回 null
     */
    if (!selection || !selection.anchorNode || !selection.focusNode) {
      return null;
    }

    /**
     * 为选择的开始和结束定义节点
     */
    const boundNodes = [
      /** 选择开始的节点 */
      selection.anchorNode as HTMLElement,
      /** 选择结束的节点 */
      selection.focusNode as HTMLElement,
    ];

    /**
     * 对于每个选择父节点，我们尝试找到目标标签[具有目标类名称]
     * 它将保存在parentTag变量中
     */
    boundNodes.forEach((parent) => {
      /** 重置标签数限制 */
      let searchDepthIterable = searchDepth;

      while (searchDepthIterable > 0 && parent.parentNode) {
        /**
         * 校验标签名称
         */
        if (parent.tagName === tagName) {
          /**
           * 保存结果
           */
          parentTag = parent;

          /**
           * 可选的附加检查，用于类名不匹配
           */
          if (className && parent.classList && !parent.classList.contains(className)) {
            parentTag = null;
          }

          /**
           * 如果我们在类中找到了所需的标签，则退出循环
           */
          if (parentTag) {
            break;
          }
        }

        /**
         * 找不到目标标签。 上去找父节点
         */
        parent = parent.parentNode as HTMLElement;
        searchDepthIterable--;
      }
    });

    /**
     * 返回找到的标签或 null
     */
    return parentTag;
  }

  /**
   * 将选择范围扩展到传递的父节点
   *
   * @param {HTMLElement} element - 应选择内容的元素
   */
  public expandToTag(element: HTMLElement): void {
    const selection = window.getSelection();

    selection.removeAllRanges();
    const range = document.createRange();

    range.selectNodeContents(element);
    selection.addRange(range);
  }
}
