/**
 * @class BlockSelection
 * @classdesc 使用快捷键 CMD + A 管理块选择
 *
 * @module BlockSelection
 * @version 1.0.0
 */
import Module from '../__module';
import Block from '../block';
import * as _ from '../utils';
import $ from '../dom';

import SelectionUtils from '../selection';
import { SanitizerConfig } from '../../../types/configs';

/**
 *
 */
export default class BlockSelection extends Module {
  /**
   * 有时 .anyBlockSelected 可以被频繁调用，例如在 ui@selectionChange 上（以清除CBS中的本机浏览器选择）
   * 我们使用缓存来防止遍历所有块
   *
   * @private
   */
  private anyBlockSelectedCache: boolean | null = null;

  /**
   * 消毒配置
   *
   * @returns {SanitizerConfig}
   */
  private get sanitizerConfig(): SanitizerConfig {
    return {
      p: {},
      h1: {},
      h2: {},
      h3: {},
      h4: {},
      h5: {},
      h6: {},
      ol: {},
      ul: {},
      li: {},
      br: true,
      img: {
        src: true,
        width: true,
        height: true,
      },
      a: {
        href: true,
      },
      b: {},
      i: {},
      u: {},
    };
  }

  /**
   * 标识所有块选择的标志
   *
   * @returns {boolean}
   */
  public get allBlocksSelected(): boolean {
    const { BlockManager } = this.Editor;

    return BlockManager.blocks.every((block) => block.selected === true);
  }

  /**
   * 设置选中的所有块
   *
   * @param {boolean} state - 设置状态
   */
  public set allBlocksSelected(state: boolean) {
    const { BlockManager } = this.Editor;

    BlockManager.blocks.forEach((block) => {
      block.selected = state;
    });

    this.clearCache();
  }

  /**
   * 标识任何块选择的标志
   *
   * @returns {boolean}
   */
  public get anyBlockSelected(): boolean {
    const { BlockManager } = this.Editor;

    if (this.anyBlockSelectedCache === null) {
      this.anyBlockSelectedCache = BlockManager.blocks.some((block) => block.selected === true);
    }

    return this.anyBlockSelectedCache;
  }

  /**
   * 返回选中的数组
   *
   * @returns {Block[]}
   */
  public get selectedBlocks(): Block[] {
    return this.Editor.BlockManager.blocks.filter((block: Block) => block.selected);
  }

  /**
   * 用于定义块选​​择的标志
   * 第一个 CMD + A 将其定义为 true，然后第二个 CMD + A 选择所有块
   *
   * @type {boolean}
   */
  private needToSelectAll = false;

  /**
   * 用于定义本机输入选择的标志
   * 在这种情况下，我们允许双 CMD + A 选择块
   *
   * @type {boolean}
   */
  private nativeInputSelected = false;

  /**
   * 标志标识任何输入选择
   * 这意味着我们可以选择整个块
   *
   * @type {boolean}
   */
  private readyToBlockSelection = false;

  /**
   * 选择器工具实例
   *
   * @type {SelectionUtils}
   */
  private selection: SelectionUtils;

  /**
   * 模块的准备
   * 注册快捷键 CMD+A 和 CMD+C
   * 选择全部并复制
   */
  public prepare(): void {
    const { Shortcuts } = this.Editor;

    this.selection = new SelectionUtils();

    /**
     * CMD/CTRL+A 选择器快捷键
     */
    Shortcuts.add({
      name: 'CMD+A',
      handler: (event) => {
        const { BlockManager, ReadOnly } = this.Editor;

        /**
         * 我们在CMD + A ShortCut而不是浏览器上使用编辑器的块选择
         */
        if (ReadOnly.isEnabled) {
          event.preventDefault();
          this.selectAllBlocks();

          return;
        }

        /**
         * 当一页包含两个或多个EditorJS实例时
         * 快捷键模块尝试处理所有事件。
         * 这就是为什么编辑器的选择器在目标编辑器中起作用的原因，
         * 但对于其他编辑器，则会发生错误，因为没有任何选择器。
         *
         * 如果焦点不在编辑器内，则防止此类操作
         */
        if (!BlockManager.currentBlock) {
          return;
        }

        this.handleCommandA(event);
      },
    });
  }

  /**
   * 只读状态切换
   *
   *  - 删除所有范围选择器
   *  - 取消所有 block 选择
   *
   * @param {boolean} readOnlyEnabled - "read only" state
   */
  public toggleReadOnly(readOnlyEnabled: boolean): void {
    SelectionUtils.get()
      .removeAllRanges();

    this.allBlocksSelected = false;
  }

  /**
   * 删除块的选中
   *
   * @param {number?} index - Block index according to the BlockManager's indexes
   */
  public unSelectBlockByIndex(index?): void {
    const { BlockManager } = this.Editor;

    let block;

    if (isNaN(index)) {
      block = BlockManager.currentBlock;
    } else {
      block = BlockManager.getBlockByIndex(index);
    }

    block.selected = false;

    this.clearCache();
  }

  /**
   * 清除块中的选择
   *
   * @param {Event} reason - 事件导致选择不明确
   * @param {boolean} restoreSelection - 如果为 true，则恢复保存的选择
   */
  public clearSelection(reason?: Event, restoreSelection = false): void {
    const { BlockManager, Caret, RectangleSelection } = this.Editor;

    this.needToSelectAll = false;
    this.nativeInputSelected = false;
    this.readyToBlockSelection = false;

    const isKeyboard = reason && (reason instanceof KeyboardEvent);
    const isPrintableKey = isKeyboard && _.isPrintableKey((reason as KeyboardEvent).keyCode);

    /**
     * 如果导致无法选择的原因是可打印键，并且选择了任何块，请删除所选块并插入按下的键
     */
    if (this.anyBlockSelected && isKeyboard && isPrintableKey && !SelectionUtils.isSelectionExists) {
      const indexToInsert = BlockManager.removeSelectedBlocks();

      BlockManager.insertDefaultBlockAtIndex(indexToInsert, true);
      Caret.setToBlock(BlockManager.currentBlock);
      _.delay(() => {
        const eventKey = (reason as KeyboardEvent).key;

        /**
         * 如果event.key长度> 1，则表示 key 是特殊的（例如 Enter，Dead 或 Unidentifier）。
         * 所以我们使用空字符串
         *
         * @see https://developer.mozilla.org/ru/docs/Web/API/KeyboardEvent/key
         */
        Caret.insertContentAtCaretPosition(eventKey.length > 1 ? '' : eventKey);
      }, 20)();
    }

    this.Editor.CrossBlockSelection.clear(reason);

    if (!this.anyBlockSelected || RectangleSelection.isRectActivated()) {
      this.Editor.RectangleSelection.clearSelection();

      return;
    }

    /**
     * 当块已经被选中，但有人试图写入一些东西时，恢复选择。
     */
    if (restoreSelection) {
      this.selection.restore();
    }

    /** 现在清除所有块选中 */
    this.allBlocksSelected = false;
  }

  /**
   * 减少每个块并复制其内容
   *
   * @param {ClipboardEvent} e - 复制/剪切 事件
   *
   * @returns {Promise<void>}
   */
  public async copySelectedBlocks(e: ClipboardEvent): Promise<void> {
    /**
     * 防止默认复制
     */
    e.preventDefault();

    const fakeClipboard = $.make('div');

    this.selectedBlocks.forEach((block) => {
      /**
       * 生成 <p> 标记包含干净的 HTML
       */
      const cleanHTML = this.Editor.Sanitizer.clean(block.holder.innerHTML, this.sanitizerConfig);
      const fragment = $.make('p');

      fragment.innerHTML = cleanHTML;
      fakeClipboard.appendChild(fragment);
    });

    const savedData = await Promise.all(this.selectedBlocks.map((block) => block.save()));

    const textPlain = Array.from(fakeClipboard.childNodes).map((node) => node.textContent)
      .join('\n\n');
    const textHTML = fakeClipboard.innerHTML;

    e.clipboardData.setData('text/plain', textPlain);
    e.clipboardData.setData('text/html', textHTML);
    e.clipboardData.setData(this.Editor.Paste.MIME_TYPE, JSON.stringify(savedData));
  }

  /**
   * 选中块
   *
   * @param {number?} index - 块索引根据 BlockManager 的索引
   */
  public selectBlockByIndex(index?): void {
    const { BlockManager } = this.Editor;

    /**
     * 删除先前关注的块的状态
     */
    BlockManager.clearFocused();

    let block;

    if (isNaN(index)) {
      block = BlockManager.currentBlock;
    } else {
      block = BlockManager.getBlockByIndex(index);
    }

    /** 保存选择 */
    this.selection.save();
    SelectionUtils.get()
      .removeAllRanges();

    block.selected = true;

    this.clearCache();

    /** 当我们选择任何块时，请关闭 InlineToolbar */
    this.Editor.InlineToolbar.close();
  }

  /**
   * 清除 anyBlockSelected 缓存
   */
  public clearCache(): void {
    this.anyBlockSelectedCache = null;
  }

  /**
   * 模块破坏
   * 注销快捷键 CMD + A
   */
  public destroy(): void {
    const { Shortcuts } = this.Editor;

    /** 选择器快键键 */
    Shortcuts.remove('CMD+A');
  }

  /**
   * 首先 CMD+A 通过原生行为选择所有输入内容，然后 CMD+A 按键选择所有块
   *
   * @param {KeyboardEvent} event - 键盘事件
   */
  private handleCommandA(event: KeyboardEvent): void {
    this.Editor.RectangleSelection.clearSelection();

    /** 允许对原生输入框进行默认选择 */
    if ($.isNativeInput(event.target) && !this.readyToBlockSelection) {
      this.readyToBlockSelection = true;

      return;
    }

    const workingBlock = this.Editor.BlockManager.getBlock(event.target as HTMLElement);
    const inputs = workingBlock.inputs;

    /**
     * 如果“块”具有多个可编辑元素，则允许进行本机选择
     * 第二个 CMD+A 将选择整个块
     */
    if (inputs.length > 1 && !this.readyToBlockSelection) {
      this.readyToBlockSelection = true;

      return;
    }

    if (inputs.length === 1 && !this.needToSelectAll) {
      this.needToSelectAll = true;

      return;
    }

    if (this.needToSelectAll) {
      /**
       * 防止默认选择器
       */
      event.preventDefault();

      this.selectAllBlocks();

      /**
       * 选中所有块后禁用任何选择
       */
      this.needToSelectAll = false;
      this.readyToBlockSelection = false;

      /**
       * 选中所有块后，关闭ConversionToolbar
       */
      this.Editor.ConversionToolbar.close();
    } else if (this.readyToBlockSelection) {
      /**
       * 当我们使用自定义选择器时，阻止默认选择器
       */
      event.preventDefault();

      /**
       * 选中工作中的 block
       */
      this.selectBlockByIndex();

      /**
       * 如果选择了当前块，则启用所有块选择
       */
      this.needToSelectAll = true;
    }
  }

  /**
   * 选中所有 block
   * 每个块都有选定的setter，可以使块可复制
   */
  private selectAllBlocks(): void {
    /**
     * 保存所有选中块
     * 当 closeSelection 被触发时将被恢复
     */
    this.selection.save();

    /**
     * 从选择器中删除范围选区
     */
    SelectionUtils.get()
      .removeAllRanges();

    this.allBlocksSelected = true;

    /** 如果我们选择了所有块，则关闭 InlineToolbar */
    this.Editor.InlineToolbar.close();
  }
}
