/**
 * @class 插入符号
 * @classdesc 包含工作插入符号的方法
 *
 * 使用Range方法与插入符一起操作
 *
 * @module Caret
 *
 * @version 2.0.0
 */

import Selection from '../selection';
import Module from '../__module';
import Block from '../block';
import $ from '../dom';
import * as _ from '../utils';

/**
 * @typedef {Caret} Caret
 */
export default class Caret extends Module {
  /**
   * 允许插入符号在 input 中的位置
   *
   * @static
   * @returns {{START: string, END: string, DEFAULT: string}}
   */
  public get positions(): {START: string; END: string; DEFAULT: string} {
    return {
      START: 'start',
      END: 'end',
      DEFAULT: 'default',
    };
  }

  /**
   * 对插入符号模块生效的元素样式
   */
  private static get CSS(): {shadowCaret: string} {
    return {
      shadowCaret: 'cdx-shadow-caret',
    };
  }

  /**
   * 获取最深的第一个节点并检查offset是否为零
   *
   * @returns {boolean}
   */
  public get isAtStart(): boolean {
    const selection = Selection.get();
    const firstNode = $.getDeepestNode(this.Editor.BlockManager.currentBlock.currentInput);
    let focusNode = selection.focusNode;

    /** 如果lastNode是原生输入框 */
    if ($.isNativeInput(firstNode)) {
      return (firstNode as HTMLInputElement).selectionEnd === 0;
    }

    /** 以编程方式清除选择的情况，例如在CBS之后 */
    if (!selection.anchorNode) {
      return false;
    }

    /**
     * 在" |Hello!"之类的文本中插入符号时的解决方法
     * selection.anchorOffset 为 1, 但是真正的插入符号可见位置是 0
     *
     * @type {number}
     */

    let firstLetterPosition = focusNode.textContent.search(/\S/);

    if (firstLetterPosition === -1) { // empty text
      firstLetterPosition = 0;
    }

    /**
     * 如果插入号是由外部代码设置的，则可以将其设置为文本节点包装器。
     * <div>|hello</div> <---- 选择引用 <div> 而不是文本节点
     *
     * 在这种情况下，锚点节点具有ELEMENT_NODE节点类型。
     * 锚点偏移量显示元素开始与插入符号位置之间的子元素数量。
     *
     * 因此，我们使用具有focusOffset索引的child作为新的anchorNode。
     */
    let focusOffset = selection.focusOffset;

    if (focusNode.nodeType !== Node.TEXT_NODE && focusNode.childNodes.length) {
      if (focusNode.childNodes[focusOffset]) {
        focusNode = focusNode.childNodes[focusOffset];
        focusOffset = 0;
      } else {
        focusNode = focusNode.childNodes[focusOffset - 1];
        focusOffset = focusNode.textContent.length;
      }
    }

    /**
     * 在这种情况下
     * <div contenteditable>
     *     <p><b></b></p>   <-- first (and deepest) node is <b></b>
     *     |adaddad         <-- focus node
     * </div>
     */
    if ($.isLineBreakTag(firstNode as HTMLElement) || $.isEmpty(firstNode)) {
      const leftSiblings = this.getHigherLevelSiblings(focusNode as HTMLElement, 'left');
      const nothingAtLeft = leftSiblings.every((node) => {
        /**
         * 块以多个 <br> 开头（由 SHIFT + ENTER 创建）的解决方法
         *
         * @see https://github.com/codex-team/editor.js/issues/726
         * 我们需要允许删除这样的换行符，所以在这种情况下插入符号不是 START
         */
        const regularLineBreak = $.isLineBreakTag(node);
        /**
         * Safari 中的 SHIFT + ENTER 变通方法，它创建 <div> <br> </ div> 而不是 <br>
         */
        const lineBreakInSafari = node.children.length === 1 && $.isLineBreakTag(node.children[0] as HTMLElement);
        const isLineBreak = regularLineBreak || lineBreakInSafari;

        return $.isEmpty(node) && !isLineBreak;
      });

      if (nothingAtLeft && focusOffset === firstLetterPosition) {
        return true;
      }
    }

    /**
     * 我们使用 <= 比较为例:
     * "| Hello"  <--- selection.anchorOffset 为 0, 但是 firstLetterPosition 为 1
     */
    return firstNode === null || (focusNode === firstNode && focusOffset <= firstLetterPosition);
  }

  /**
   * 获取最深的最后一个节点，并检查 offset是 否为最后一个节点的文本长度
   *
   * @returns {boolean}
   */
  public get isAtEnd(): boolean {
    const selection = Selection.get();
    let focusNode = selection.focusNode;

    const lastNode = $.getDeepestNode(this.Editor.BlockManager.currentBlock.currentInput, true);

    /** 如果 lastNode 为原生输入框 */
    if ($.isNativeInput(lastNode)) {
      return (lastNode as HTMLInputElement).selectionEnd === (lastNode as HTMLInputElement).value.length;
    }

    /** 以编程方式清除选择的情况，例如在CBS之后 */
    if (!selection.focusNode) {
      return false;
    }

    /**
     * 如果插入符号是由外部代码设置的，则可能将其设置为文本节点包装器。
     * <div>hello|</div> <---- 选择引用 <div> 而不是text node
     *
     * 在本例中，锚节点具有 ELEMENT_NODE 节点类型。
     * 锚定偏移量显示元素开始位置和插入符号位置之间的子元素数量。
     *
     * 所以我们使用 child 和 anchofocusOffset - 1 作为新的 focusNode。
     */
    let focusOffset = selection.focusOffset;

    if (focusNode.nodeType !== Node.TEXT_NODE && focusNode.childNodes.length) {
      if (focusNode.childNodes[focusOffset - 1]) {
        focusNode = focusNode.childNodes[focusOffset - 1];
        focusOffset = focusNode.textContent.length;
      } else {
        focusNode = focusNode.childNodes[0];
        focusOffset = 0;
      }
    }

    /**
     * 假设
     * <div contenteditable>
     *     adaddad|         <-- 锚节点
     *     <p><b></b></p>   <-- 第一个（也是最深的）节点是 <b></b>
     * </div>
     */
    if ($.isLineBreakTag(lastNode as HTMLElement) || $.isEmpty(lastNode)) {
      const rightSiblings = this.getHigherLevelSiblings(focusNode as HTMLElement, 'right');
      const nothingAtRight = rightSiblings.every((node, i) => {
        /**
         * 如果最后一个右边兄弟是 BR isEmpty 返回 false，但实际上右边什么都没有
         */
        const isLastBR = i === rightSiblings.length - 1 && $.isLineBreakTag(node as HTMLElement);

        return isLastBR || ($.isEmpty(node) && !$.isLineBreakTag(node));
      });

      if (nothingAtRight && focusOffset === focusNode.textContent.length) {
        return true;
      }
    }

    /**
     * 解决方法：
     * hello |     <--- anchorOffset 将为 5，但 textContent.length 将为 6。
     * 为什么不使用常规的 .trim():
     *  在 ' hello |' trim()的情况下，也将删除开始的空间，所以 length 将低于 anchorOffset
     */
    const rightTrimmedText = lastNode.textContent.replace(/\s+$/, '');

    /**
     * 我们使用案例>=比较：
     * "Hello |"  <--- selection.anchorOffset 为 7，但 rightTrimmedText 为6
     */
    return focusNode === lastNode && focusOffset >= rightTrimmedText.length;
  }

  /**
   * 方法获取块实例，并将插入符号放置到带有偏移量的文本节点中
   * 该方法有两种方式应用插入符号位置：
   *   - 第一个找到的文本节点:在开头设置，但是您可以传递一个偏移量
   *   - 最后找到的文本节点:在节点的末尾设置。此外，您还可以自定义行为
   *
   * @param {Block} block - Block class
   * @param {string} position - 设置插入符号的位置。
   *                            如果是默认值 - 保留默认行为，如果通过则应用偏移量
   * @param {number} offset - 与文本节点有关的插入符号偏移量
   */
  public setToBlock(block: Block, position: string = this.positions.DEFAULT, offset = 0): void {
    const { BlockManager } = this.Editor;
    let element;

    switch (position) {
      case this.positions.START:
        element = block.firstInput;
        break;
      case this.positions.END:
        element = block.lastInput;
        break;
      default:
        element = block.currentInput;
    }

    if (!element) {
      return;
    }

    const nodeToSet = $.getDeepestNode(element, position === this.positions.END);
    const contentLength = $.getContentLength(nodeToSet);

    switch (true) {
      case position === this.positions.START:
        offset = 0;
        break;
      case position === this.positions.END:
      case offset > contentLength:
        offset = contentLength;
        break;
    }

    /**
     * @todo 尝试通过 Promises 修复或使用 querySelectorAll 不使用超时
     */
    _.delay(() => {
      this.set(nodeToSet as HTMLElement, offset);
    }, 20)();

    BlockManager.setCurrentBlockByChildNode(block.holder);
    BlockManager.currentBlock.currentInput = element;
  }

  /**
   * 设置插入符号为当前块的当前输入。
   *
   * @param {HTMLElement} input - 输入应在何处设置插入号
   * @param {string} position - 插入符号的位置。
   *                            如果是默认值 - 保留默认行为，并在它被传递时应用偏移量
   * @param {number} offset - 关于文本节点的插入符号偏移
   */
  public setToInput(input: HTMLElement, position: string = this.positions.DEFAULT, offset = 0): void {
    const { currentBlock } = this.Editor.BlockManager;
    const nodeToSet = $.getDeepestNode(input);

    switch (position) {
      case this.positions.START:
        this.set(nodeToSet as HTMLElement, 0);
        break;

      case this.positions.END:
        this.set(nodeToSet as HTMLElement, $.getContentLength(nodeToSet));
        break;

      default:
        if (offset) {
          this.set(nodeToSet as HTMLElement, offset);
        }
    }

    currentBlock.currentInput = input;
  }

  /**
   * 创建文档范围并将插入符设置为具有偏移量的元素
   *
   * @param {HTMLElement} element - 目标节点
   * @param {number} offset - 偏移量
   */
  public set(element: HTMLElement, offset = 0): void {
    const { top, bottom } = Selection.setCursor(element, offset);

    /** 如果新光标位置不可见，滚动到该位置 */
    const { innerHeight } = window;

    if (top < 0) {
      window.scrollBy(0, top);
    }
    if (bottom > innerHeight) {
      window.scrollBy(0, bottom - innerHeight);
    }
  }

  /**
   * 将插入符号设置到最后一个块
   * 如果最后一个块不为空，则追加另一个空块
   */
  public setToTheLastBlock(): void {
    const lastBlock = this.Editor.BlockManager.lastBlock;

    if (!lastBlock) {
      return;
    }

    /**
     * 如果最后一个块为空，并且它是defaultBlock，则设置为该块。
     * 否则，添加新的空块并设置为它
     */
    if (this.Editor.Tools.isDefault(lastBlock.tool) && lastBlock.isEmpty) {
      this.setToBlock(lastBlock);
    } else {
      const newBlock = this.Editor.BlockManager.insertAtEnd();

      this.setToBlock(newBlock);
    }
  }

  /**
   * 从插入符号位置到块末尾提取当前块的内容片段
   */
  public extractFragmentFromCaretPosition(): void|DocumentFragment {
    const selection = Selection.get();

    if (selection.rangeCount) {
      const selectRange = selection.getRangeAt(0);
      const currentBlockInput = this.Editor.BlockManager.currentBlock.currentInput;

      selectRange.deleteContents();

      if (currentBlockInput) {
        if ($.isNativeInput(currentBlockInput)) {
          /**
           * 如果输入是本机文本输入，则需要使用它的值
           * 插入符号前的文本保留在输入框中，而插入符号后的文本作为片段返回，插入到块之后。
           */
          const input = currentBlockInput as HTMLInputElement | HTMLTextAreaElement;
          const newFragment = document.createDocumentFragment();

          const inputRemainingText = input.value.substring(0, input.selectionStart);
          const fragmentText = input.value.substring(input.selectionStart);

          newFragment.textContent = fragmentText;
          input.value = inputRemainingText;

          return newFragment;
        } else {
          const range = selectRange.cloneRange();

          range.selectNodeContents(currentBlockInput);
          range.setStart(selectRange.endContainer, selectRange.endOffset);

          return range.extractContents();
        }
      }
    }
  }

  /**
   * 将插入符号插入下一个块或工具的输入
   * 在移动插入符号之前，我们应该检查插入符号的位置是否在Plugins节点的末尾
   * 使用 {@link Dom#getDeepestNode} 获取最后一个节点，并与当前选择匹配
   *
   * @returns {boolean}
   */
  public navigateNext(): boolean {
    const { BlockManager, Tools } = this.Editor;
    const { currentBlock, nextContentfulBlock } = BlockManager;
    const { nextInput } = currentBlock;
    const isAtEnd = this.isAtEnd;

    let nextBlock = nextContentfulBlock;

    if (!nextBlock && !nextInput) {
      /**
       * 这段代码允许从最后一个非初始化工具退出
       * https://github.com/codex-team/editor.js/issues/1103
       */

      /**
       * 1. 如果有最后一个块并且它是默认块，则什么也不做
       * 2. 如果存在最后一个块并且它不是默认值 -> 并且插入符号不在末尾 <-，则不执行任何操作
       *    (https://github.com/codex-team/editor.js/issues/1414)
       */
      if (Tools.isDefault(currentBlock.tool) || !isAtEnd) {
        return false;
      }

      /**
       * 如果没有nextBlock，但currentBlock不是default
       * 在末尾插入新的默认块并导航到它
       */
      nextBlock = BlockManager.insertAtEnd();
    }

    if (isAtEnd) {
      /** 如果下一个工具的输入存在，那么聚焦它。否则，将插入符号设置为下一个块 */
      if (!nextInput) {
        this.setToBlock(nextBlock, this.positions.START);
      } else {
        this.setToInput(nextInput, this.positions.START);
      }

      return true;
    }

    return false;
  }

  /**
   * 将插入符号设置为先前工具的输入或块
   * 在移动插入符号之前，我们应该检查插入符号的位置是否是插件节点的开始
   * 使用{@link Dom#getDeepestNode}获取最后一个节点，并与当前 selection 匹配
   *
   * @returns {boolean}
   */
  public navigatePrevious(): boolean {
    const { currentBlock, previousContentfulBlock } = this.Editor.BlockManager;

    if (!currentBlock) {
      return false;
    }

    const { previousInput } = currentBlock;

    if (!previousContentfulBlock && !previousInput) {
      return false;
    }

    if (this.isAtStart) {
      /** 如果先前工具的输入存在，请聚焦它。否则，将插入符号设置为前一个块 */
      if (!previousInput) {
        this.setToBlock(previousContentfulBlock, this.positions.END);
      } else {
        this.setToInput(previousInput, this.positions.END);
      }

      return true;
    }

    return false;
  }

  /**
   * 在可以放置插入符号的元素后面插入阴影元素
   *
   * @param {Element} element - 之后应插入阴影插入符号的元素
   */
  public createShadow(element: Element): void {
    const shadowCaret = document.createElement('span');

    shadowCaret.classList.add(Caret.CSS.shadowCaret);
    element.insertAdjacentElement('beforeend', shadowCaret);
  }

  /**
   * 恢复插入符号位置
   *
   * @param {HTMLElement} element - 元素中应该恢复插入符号的位置
   */
  public restoreCaret(element: HTMLElement): void {
    const shadowCaret = element.querySelector(`.${Caret.CSS.shadowCaret}`);

    if (!shadowCaret) {
      return;
    }

    /**
     * 在我们将插入符号设置到需要的位置后，
     * 我们需要清除阴影插入符号
     *
     * - 创建显得 range
     * - 选中 shadowed span
     * - 使用 extractContent 将其从 DOM 中删除
     */
    const sel = new Selection();

    sel.expandToTag(shadowCaret as HTMLElement);

    setTimeout(() => {
      const newRange = document.createRange();

      newRange.selectNode(shadowCaret);
      newRange.extractContents();
    }, 50);
  }

  /**
   * 将插入的内容插入插入符位置
   *
   * @param {string} content - content to insert
   */
  public insertContentAtCaretPosition(content: string): void {
    const fragment = document.createDocumentFragment();
    const wrapper = document.createElement('div');
    const selection = Selection.get();
    const range = Selection.range;

    wrapper.innerHTML = content;

    Array.from(wrapper.childNodes).forEach((child: Node) => fragment.appendChild(child));

    /**
     * 如果没有子节点，则追加一个空节点
     */
    if (fragment.childNodes.length === 0) {
      fragment.appendChild(new Text(''));
    }

    const lastChild = fragment.lastChild;

    range.deleteContents();
    range.insertNode(fragment);

    /** 跨浏览器插入符号插入 */
    const newRange = document.createRange();

    newRange.setStart(lastChild, lastChild.textContent.length);

    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  /**
   * 从被传递的节点中获取所有的一级(contentteditabel 的第一个子)兄弟
   * 然后你可以检查它是否空
   *
   * @example
   * <div contenteditable>
   * <p></p>                            |
   * <p></p>                            | 左一级的兄弟
   * <p></p>                            |
   * <blockquote><a><b>adaddad</b><a><blockquote>       <-- 例如传递节点 <b>
   * <p></p>                            |
   * <p></p>                            | 对一级的兄弟姐妹
   * <p></p>                            |
   * </div>
   *
   * @param {HTMLElement} from - 从中搜索兄弟元素
   * @param {'left' | 'right'} direction - 搜索方向
   *
   * @returns {HTMLElement[]}
   */
  private getHigherLevelSiblings(from: HTMLElement, direction?: 'left' | 'right'): HTMLElement[] {
    let current = from;
    const siblings = [];

    /**
     * 查找所传递节点的一级父节点(例如: blockquote)
     */
    while (current.parentNode && (current.parentNode as HTMLElement).contentEditable !== 'true') {
      current = current.parentNode as HTMLElement;
    }

    const sibling = direction === 'left' ? 'previousSibling' : 'nextSibling';

    /**
     * 查找所有 左/右 的兄弟
     */
    while (current[sibling]) {
      current = current[sibling] as HTMLElement;
      siblings.push(current);
    }

    return siblings;
  }
}
