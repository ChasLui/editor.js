/**
 * @class CrossBlockSelection
 * @classdesc 在开始选择的地方阻塞
 *
 * @module CrossBlockSelection
 * @version 1.0.0
 */
import Module from '../__module';
import Block from '../block';
import SelectionUtils from '../selection';
import * as _ from '../utils';

/**
 *
 */
export default class CrossBlockSelection extends Module {
  /**
   * 在开始选择的地方阻塞
   */
  private firstSelectedBlock: Block;

  /**
   * 最后选定的块
   */
  private lastSelectedBlock: Block;

  /**
   * 模块的准备
   *
   * @returns {Promise}
   */
  public async prepare(): Promise<void> {
    const { Listeners } = this.Editor;

    Listeners.on(document, 'mousedown', (event: MouseEvent) => {
      this.enableCrossBlockSelection(event);
    });
  }

  /**
   * 设置监听器
   *
   * @param {MouseEvent} event - 鼠标按下事件
   */
  public watchSelection(event: MouseEvent): void {
    if (event.button !== _.mouseButtons.LEFT) {
      return;
    }

    const { BlockManager, Listeners } = this.Editor;

    this.firstSelectedBlock = BlockManager.getBlock(event.target as HTMLElement);
    this.lastSelectedBlock = this.firstSelectedBlock;

    Listeners.on(document, 'mouseover', this.onMouseOver);
    Listeners.on(document, 'mouseup', this.onMouseUp);
  }

  /**
   * 返回布尔值是否已开始跨块选择
   */
  public get isCrossBlockSelectionStarted(): boolean {
    return !!this.firstSelectedBlock &&
      !!this.lastSelectedBlock;
  }

  /**
   * 更改下一个块的选择状态
   * 通过Shift +方向键用于CBS
   *
   * @param {boolean} next - 如果为 true，则切换下一个块。 上一个否则
   */
  public toggleBlockSelectedState(next = true): void {
    const { BlockManager, BlockSelection } = this.Editor;

    if (!this.lastSelectedBlock) {
      this.lastSelectedBlock = this.firstSelectedBlock = BlockManager.currentBlock;
    }

    if (this.firstSelectedBlock === this.lastSelectedBlock) {
      this.firstSelectedBlock.selected = true;

      BlockSelection.clearCache();
      SelectionUtils.get().removeAllRanges();
    }

    const nextBlockIndex = BlockManager.blocks.indexOf(this.lastSelectedBlock) + (next ? 1 : -1);
    const nextBlock = BlockManager.blocks[nextBlockIndex];

    if (!nextBlock) {
      return;
    }

    if (this.lastSelectedBlock.selected !== nextBlock.selected) {
      nextBlock.selected = true;

      BlockSelection.clearCache();
    } else {
      this.lastSelectedBlock.selected = false;

      BlockSelection.clearCache();
    }

    this.lastSelectedBlock = nextBlock;

    /** 当块被选中时关闭 InlineToolbar */
    this.Editor.InlineToolbar.close();

    nextBlock.holder.scrollIntoView({
      block: 'nearest',
    });
  }

  /**
   * 清除保存的状态
   *
   * @param {Event} reason - 事件导致选择清除
   */
  public clear(reason?: Event): void {
    const { BlockManager, BlockSelection, Caret } = this.Editor;
    const fIndex = BlockManager.blocks.indexOf(this.firstSelectedBlock);
    const lIndex = BlockManager.blocks.indexOf(this.lastSelectedBlock);

    if (BlockSelection.anyBlockSelected && fIndex > -1 && lIndex > -1) {
      if (reason && reason instanceof KeyboardEvent) {
        /**
         * 如果按下的键是箭头，则根据按下的键设置插入符号。
         */
        switch (reason.keyCode) {
          case _.keyCodes.DOWN:
          case _.keyCodes.RIGHT:
            Caret.setToBlock(BlockManager.blocks[Math.max(fIndex, lIndex)], Caret.positions.END);
            break;

          case _.keyCodes.UP:
          case _.keyCodes.LEFT:
            Caret.setToBlock(BlockManager.blocks[Math.min(fIndex, lIndex)], Caret.positions.START);
            break;
          default:
            Caret.setToBlock(BlockManager.blocks[Math.max(fIndex, lIndex)], Caret.positions.END);
        }
      } else {
        /**
         * 默认情况下，在最后一个选定块的末尾设置插入符号
         */
        Caret.setToBlock(BlockManager.blocks[Math.max(fIndex, lIndex)], Caret.positions.END);
      }
    }

    this.firstSelectedBlock = this.lastSelectedBlock = null;
  }

  /**
   * 激活跨块选择器
   *
   * @param {MouseEvent} event - 鼠标按下事件
   */
  private enableCrossBlockSelection(event: MouseEvent): void {
    const { UI } = this.Editor;

    /**
     * 每个按下的鼠标都必须禁用 selectAll 状态
     */
    if (!SelectionUtils.isCollapsed) {
      this.Editor.BlockSelection.clearSelection(event);
    }

    /**
     * 如果在编辑器中执行鼠标按下操作，则应观察 CBS
     */
    if (UI.nodes.redactor.contains(event.target as Node)) {
      this.watchSelection(event);
    } else {
      /**
       * 否则，清除选择器
       */
      this.Editor.BlockSelection.clearSelection(event);
    }
  }

  /**
   * 鼠标抬起事件处理
   * 删除监听器
   */
  private onMouseUp = (): void => {
    const { Listeners } = this.Editor;

    Listeners.off(document, 'mouseover', this.onMouseOver);
    Listeners.off(document, 'mouseup', this.onMouseUp);
  }

  /**
   * 将鼠标悬停在事件处理程序上
   * 获取目标块和相关块，并在其间更改块的选定状态
   *
   * @param {MouseEvent} event - 鼠标悬停事件
   */
  private onMouseOver = (event: MouseEvent): void => {
    const { BlockManager, BlockSelection } = this.Editor;

    const relatedBlock = BlockManager.getBlockByChildNode(event.relatedTarget as Node) || this.lastSelectedBlock;
    const targetBlock = BlockManager.getBlockByChildNode(event.target as Node);

    if (!relatedBlock || !targetBlock) {
      return;
    }

    if (targetBlock === relatedBlock) {
      return;
    }

    if (relatedBlock === this.firstSelectedBlock) {
      SelectionUtils.get().removeAllRanges();

      relatedBlock.selected = true;
      targetBlock.selected = true;

      BlockSelection.clearCache();

      return;
    }

    if (targetBlock === this.firstSelectedBlock) {
      relatedBlock.selected = false;
      targetBlock.selected = false;

      BlockSelection.clearCache();

      return;
    }

    this.Editor.InlineToolbar.close();

    this.toggleBlocksSelectedState(relatedBlock, targetBlock);
    this.lastSelectedBlock = targetBlock;
  }

  /**
   * 在经过的两个块之间改变块的选择状态。
   *
   * @param {Block} firstBlock - 范围内第一个块
   * @param {Block} lastBlock - 范围内最后一个块
   */
  private toggleBlocksSelectedState(firstBlock: Block, lastBlock: Block): void {
    const { BlockManager, BlockSelection } = this.Editor;
    const fIndex = BlockManager.blocks.indexOf(firstBlock);
    const lIndex = BlockManager.blocks.indexOf(lastBlock);

    /**
     * 如果第一个和最后一个块的选择状态不同，则意味着我们不应切换第一个选定块的选择。
     * 在另一种情况下，我们不应该切换最后选择的块。
     */
    const shouldntSelectFirstBlock = firstBlock.selected !== lastBlock.selected;

    for (let i = Math.min(fIndex, lIndex); i <= Math.max(fIndex, lIndex); i++) {
      const block = BlockManager.blocks[i];

      if (
        block !== this.firstSelectedBlock &&
        block !== (shouldntSelectFirstBlock ? firstBlock : lastBlock)
      ) {
        BlockManager.blocks[i].selected = !BlockManager.blocks[i].selected;

        BlockSelection.clearCache();
      }
    }
  }
}
