import SelectionUtils from '../selection';

import Module from '../__module';
/**
 *
 */
export default class DragNDrop extends Module {
  /**
   * 如果已在编辑器中开始拖动，则将其保存
   *
   * @type {boolean}
   * @private
   */
  private isStartedAtEditor = false;

  /**
   * 切换只读状态
   *
   * 如果状态为 true:
   *  - 禁用所有拖放事件处理程序
   *
   * 如果状态为 false:
   *  - 恢复拖放事件处理程序
   *
   * @param {boolean} readOnlyEnabled - "read only" 状态
   */
  public toggleReadOnly(readOnlyEnabled: boolean): void {
    if (readOnlyEnabled) {
      this.disableModuleBindings();
    } else {
      this.enableModuleBindings();
    }
  }

  /**
   * 将拖动事件侦听器添加到编辑器区域
   */
  private enableModuleBindings(): void {
    const { UI } = this.Editor;

    this.readOnlyMutableListeners.on(UI.nodes.holder, 'drop', async (dropEvent: DragEvent) => {
      await this.processDrop(dropEvent);
    }, true);

    this.readOnlyMutableListeners.on(UI.nodes.holder, 'dragstart', () => {
      this.processDragStart();
    });

    /**
     * 防止默认的浏览器行为允许放置不可编辑的元素
     */
    this.readOnlyMutableListeners.on(UI.nodes.holder, 'dragover', (dragEvent: DragEvent) => {
      this.processDragOver(dragEvent);
    }, true);
  }

  /**
   * 解绑拖拽事件处理程序
   */
  private disableModuleBindings(): void {
    this.readOnlyMutableListeners.clearAll();
  }

  /**
   * 处理放下事件
   *
   * @param {DragEvent} dropEvent - drop event
   */
  private async processDrop(dropEvent: DragEvent): Promise<void> {
    const {
      BlockManager,
      Caret,
      Paste,
    } = this.Editor;

    dropEvent.preventDefault();

    BlockManager.blocks.forEach((block) => {
      block.dropTarget = false;
    });

    if (SelectionUtils.isAtEditor && !SelectionUtils.isCollapsed && this.isStartedAtEditor) {
      document.execCommand('delete');
    }

    this.isStartedAtEditor = false;

    /**
     * 尝试按放置目标设置当前块。
     * 如果放置目标（将抛出错误）不属于该块，请将最后一个块设置为当前。
     */
    try {
      const targetBlock = BlockManager.setCurrentBlockByChildNode(dropEvent.target as Node);

      this.Editor.Caret.setToBlock(targetBlock, Caret.positions.END);
    } catch (e) {
      const targetBlock = BlockManager.setCurrentBlockByChildNode(BlockManager.lastBlock.holder);

      this.Editor.Caret.setToBlock(targetBlock, Caret.positions.END);
    }

    await Paste.processDataTransfer(dropEvent.dataTransfer, true);
  }

  /**
   * 处理拖动开始事件
   */
  private processDragStart(): void {
    if (SelectionUtils.isAtEditor && !SelectionUtils.isCollapsed) {
      this.isStartedAtEditor = true;
    }

    this.Editor.InlineToolbar.close();
  }

  /**
   * @param {DragEvent} dragEvent - 拖动事件
   */
  private processDragOver(dragEvent: DragEvent): void {
    dragEvent.preventDefault();
  }
}
