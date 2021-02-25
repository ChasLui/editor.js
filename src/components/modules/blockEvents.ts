/**
 * 包含按块管理器绑定在每个块上的键盘和鼠标事件
 */
import Module from '../__module';
import * as _ from '../utils';
import SelectionUtils from '../selection';
import Flipper from '../flipper';

/**
 *
 */
export default class BlockEvents extends Module {
  /**
   * 块上的所有键盘按下事件
   *
   * @param {KeyboardEvent} event - 键盘事件
   */
  public keydown(event: KeyboardEvent): void {
    /**
     * 对所有按键事件运行通用方法
     */
    this.beforeKeydownProcessing(event);

    /**
     * 通过 event.keyCode 触发 keydown 处理器
     */
    switch (event.keyCode) {
      case _.keyCodes.BACKSPACE:
        this.backspace(event);
        break;

      case _.keyCodes.ENTER:
        this.enter(event);
        break;

      case _.keyCodes.DOWN:
      case _.keyCodes.RIGHT:
        this.arrowRightAndDown(event);
        break;

      case _.keyCodes.UP:
      case _.keyCodes.LEFT:
        this.arrowLeftAndUp(event);
        break;

      case _.keyCodes.TAB:
        this.tabPressed(event);
        break;
    }
  }

  /**
   * 事件处理前在按下 keydown 时触发
   *
   * @param {KeyboardEvent} event - keydown 事件对象
   */
  public beforeKeydownProcessing(event: KeyboardEvent): void {
    /**
     * 不要在选项卡或打开的工具箱中输入时关闭工具箱
     */
    if (!this.needToolbarClosing(event)) {
      return;
    }

    /**
     * 用户输入内容时：
     *  - 关闭 Toolbar
     *  - 关闭转换 Toolbar
     *  - 清除块高亮
     */
    if (_.isPrintableKey(event.keyCode)) {
      this.Editor.Toolbar.close();
      this.Editor.ConversionToolbar.close();

      /**
       * 允许对选定的块使用快捷键
       *
       * @type {boolean}
       */
      const isShortcut = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;

      if (!isShortcut) {
        this.Editor.BlockManager.clearFocused();
        this.Editor.BlockSelection.clearSelection(event);
      }
    }
  }

  /**
   * 块上的所有键盘抬起事件
   * - 如果选中某项，则显示“内联工具栏”
   * - 显示具有85％块选择的转换工具栏
   *
   * @param {KeyboardEvent} event - keyup event
   */
  public keyup(event: KeyboardEvent): void {
    /**
     * 如果按下了Shift键，则使用一些特殊的快捷方式（例如，通过Shift +箭头选择跨块）
     */
    if (event.shiftKey) {
      return;
    }

    /**
     * 检查每个按键上的编辑器是否为空，并向包装器添加特殊的CSS类
     */
    this.Editor.UI.checkEmptiness();
  }

  /**
   * 打开工具箱叶工具
   *
   * @param {KeyboardEvent} event - 选项卡keydown事件
   */
  public tabPressed(event): void {
    /**
     * 通过选项卡清除块选择
     */
    this.Editor.BlockSelection.clearSelection(event);

    const { BlockManager, Tools, InlineToolbar, ConversionToolbar } = this.Editor;
    const currentBlock = BlockManager.currentBlock;

    if (!currentBlock) {
      return;
    }

    const canOpenToolbox = Tools.isDefault(currentBlock.tool) && currentBlock.isEmpty;
    const conversionToolbarOpened = !currentBlock.isEmpty && ConversionToolbar.opened;
    const inlineToolbarOpened = !currentBlock.isEmpty && !SelectionUtils.isCollapsed && InlineToolbar.opened;

    /**
     * 对于空块，我们仅通过默认块通过工具箱显示加号按钮
     */
    if (canOpenToolbox) {
      this.activateToolbox();
    } else if (!conversionToolbarOpened && !inlineToolbarOpened) {
      this.activateBlockSettings();
    }
  }

  /**
   * 添加拖放目标样式
   *
   * @param {DragEvent} event - drag over event
   */
  public dragOver(event: DragEvent): void {
    const block = this.Editor.BlockManager.getBlockByChildNode(event.target as Node);

    block.dropTarget = true;
  }

  /**
   * 删除放置目标样式
   *
   * @param {DragEvent} event - drag leave event
   */
  public dragLeave(event: DragEvent): void {
    const block = this.Editor.BlockManager.getBlockByChildNode(event.target as Node);

    block.dropTarget = false;
  }

  /**
   * 复制选定的块
   * 在放入剪贴板之前，我们先清除所有块，然后将其复制到剪贴板
   *
   * @param {ClipboardEvent} event - 剪贴板事件
   */
  public handleCommandC(event: ClipboardEvent): Promise<void> {
    const { BlockSelection } = this.Editor;

    if (!BlockSelection.anyBlockSelected) {
      return;
    }

    // 拷贝选中的块
    return BlockSelection.copySelectedBlocks(event);
  }

  /**
   * 复制并删除选定的块
   *
   * @param {ClipboardEvent} event - 剪贴板事件
   */
  public async handleCommandX(event: ClipboardEvent): Promise<void> {
    const { BlockSelection, BlockManager, Caret } = this.Editor;

    if (!BlockSelection.anyBlockSelected) {
      return;
    }

    await BlockSelection.copySelectedBlocks(event);

    const selectionPositionIndex = BlockManager.removeSelectedBlocks();

    Caret.setToBlock(BlockManager.insertDefaultBlockAtIndex(selectionPositionIndex, true), Caret.positions.START);

    /** 清除选择器 */
    BlockSelection.clearSelection(event);
  }

  /**
   * 块上按下回车键
   *
   * @param {KeyboardEvent} event - keydown
   */
  private enter(event: KeyboardEvent): void {
    const { BlockManager, Tools, UI } = this.Editor;
    const currentBlock = BlockManager.currentBlock;
    const tool = Tools.available[currentBlock.name];

    /**
     * 当工具将 enableLineBreaks 设置为 true 时，请勿处理Enter keydown。
     * 用于像<code>这样的工具，其中的换行符应该被默认的行为处理。
     */
    if (tool && tool[Tools.INTERNAL_SETTINGS.IS_ENABLED_LINE_BREAKS]) {
      return;
    }

    /**
     * 打开的工具栏将Flipper与自己的Enter处理配合使用
     * 当Flipper中的任何一个按钮都没有聚焦时允许分割
     */
    if (UI.someToolbarOpened && UI.someFlipperButtonFocused) {
      return;
    }

    /**
     * 允许通过 Shift + Enter 创建换行符
     */
    if (event.shiftKey) {
      return;
    }

    let newCurrent = this.Editor.BlockManager.currentBlock;

    /**
     * 如果在文本开始处按下了回车键，只需在上面插入段落块
     */
    if (this.Editor.Caret.isAtStart && !this.Editor.BlockManager.currentBlock.hasMedia) {
      this.Editor.BlockManager.insertDefaultBlockAtIndex(this.Editor.BlockManager.currentBlockIndex);
    } else {
      /**
       * 将当前块分成两个块
       * 分裂后更新本地当前节点
       */
      newCurrent = this.Editor.BlockManager.split();
    }

    this.Editor.Caret.setToBlock(newCurrent);

    /**
     * 如果新的块是空的
     */
    if (this.Editor.Tools.isDefault(newCurrent.tool) && newCurrent.isEmpty) {
      /**
       * 显示 Toolbar
       */
      this.Editor.Toolbar.open(false);

      /**
       * 显示 + 按钮
       */
      this.Editor.Toolbar.plusButton.show();
    }

    event.preventDefault();
  }

  /**
   * 处理块上的退格键按下
   *
   * @param {KeyboardEvent} event - keydown
   */
  private backspace(event: KeyboardEvent): void {
    const { BlockManager, BlockSelection, Caret } = this.Editor;
    const currentBlock = BlockManager.currentBlock;
    const tool = this.Editor.Tools.available[currentBlock.name];

    /**
     * 检查是否应该通过当前退格键删除块
     */
    if (currentBlock.selected || (currentBlock.isEmpty && currentBlock.currentInput === currentBlock.firstInput)) {
      event.preventDefault();

      const index = BlockManager.currentBlockIndex;

      if (BlockManager.previousBlock && BlockManager.previousBlock.inputs.length === 0) {
        /** 如果上一个块不包含输入，请将其删除 */
        BlockManager.removeBlock(index - 1);
      } else {
        /** 如果块为空，则将其删除 */
        BlockManager.removeBlock();
      }

      Caret.setToBlock(
        BlockManager.currentBlock,
        index ? Caret.positions.END : Caret.positions.START
      );

      /** 关闭 Toolbar */
      this.Editor.Toolbar.close();

      /** 清除选区 */
      BlockSelection.clearSelection(event);

      return;
    }

    /**
     * 当工具将 enableLineBreaks 设置为 true 时，请勿处理退格键事件。
     * 用于像<code>这样的工具，其中的换行符应该被默认的行为处理。
     *
     * 但是，如果插入符位于该块的开头，我们允许通过退格键将其删除
     */
    if (tool && tool[this.Editor.Tools.INTERNAL_SETTINGS.IS_ENABLED_LINE_BREAKS] && !Caret.isAtStart) {
      return;
    }

    const isFirstBlock = BlockManager.currentBlockIndex === 0;
    const canMergeBlocks = Caret.isAtStart &&
      SelectionUtils.isCollapsed &&
      currentBlock.currentInput === currentBlock.firstInput &&
      !isFirstBlock;

    if (canMergeBlocks) {
      /**
       * 防止浏览器默认行为
       */
      event.preventDefault();

      /**
       * 合并块
       */
      this.mergeBlocks();
    }
  }

  /**
   * 合并当前和先前的块（如果它们具有相同的类型）
   */
  private mergeBlocks(): void {
    const { BlockManager, Caret, Toolbar } = this.Editor;
    const targetBlock = BlockManager.previousBlock;
    const blockToMerge = BlockManager.currentBlock;

    /**
     * 可以合并的块：
     * 1) 具有相同名称的
     * 2) 工具有 `merge` 方法
     *
     * other case will handle as usual ARROW LEFT behaviour
     */
    if (blockToMerge.name !== targetBlock.name || !targetBlock.mergeable) {
      /** 如果目标块不包含输入或为空，则将其删除 */
      if (targetBlock.inputs.length === 0 || targetBlock.isEmpty) {
        BlockManager.removeBlock(BlockManager.currentBlockIndex - 1);

        Caret.setToBlock(BlockManager.currentBlock);
        Toolbar.close();

        return;
      }

      if (Caret.navigatePrevious()) {
        Toolbar.close();
      }

      return;
    }

    Caret.createShadow(targetBlock.pluginsContent);
    BlockManager.mergeBlocks(targetBlock, blockToMerge)
      .then(() => {
        /** 合并后恢复插入符号位置 */
        Caret.restoreCaret(targetBlock.pluginsContent as HTMLElement);
        targetBlock.pluginsContent.normalize();
        Toolbar.close();
      });
  }

  /**
   * 处理又和下方向键
   *
   * @param {KeyboardEvent} event - keyboard event
   */
  private arrowRightAndDown(event: KeyboardEvent): void {
    const isFlipperCombination = Flipper.usedKeys.includes(event.keyCode) &&
      (!event.shiftKey || event.keyCode === _.keyCodes.TAB);

    /**
     * 箭头可以由flipper在工具栏上处理
     * 检查Flipper.usedKeys以允许按下导航，按右不允许
     */
    if (this.Editor.UI.someToolbarOpened && isFlipperCombination) {
      return;
    }

    /**
     * 当用户移动光标时关闭工具栏并高亮显示
     */
    this.Editor.BlockManager.clearFocused();
    this.Editor.Toolbar.close();

    const shouldEnableCBS = this.Editor.Caret.isAtEnd || this.Editor.BlockSelection.anyBlockSelected;

    if (event.shiftKey && event.keyCode === _.keyCodes.DOWN && shouldEnableCBS) {
      this.Editor.CrossBlockSelection.toggleBlockSelectedState();

      return;
    }

    const navigateNext = event.keyCode === _.keyCodes.DOWN || (event.keyCode === _.keyCodes.RIGHT && !this.isRtl);
    const isNavigated = navigateNext ? this.Editor.Caret.navigateNext() : this.Editor.Caret.navigatePrevious();

    if (isNavigated) {
      /**
       * 默认行为将光标移动1个字符，我们需要阻止它
       */
      event.preventDefault();
    } else {
      /**
       * 插入符号设置后，更新块输入索引
       */
      _.delay(() => {
        /** 当用户将选择项移出编辑器时，检查 currentBlock 的情况 */
        if (this.Editor.BlockManager.currentBlock) {
          this.Editor.BlockManager.currentBlock.updateCurrentInput();
        }
      }, 20)();
    }

    /**
     * 通过箭头清除块选区
     */
    this.Editor.BlockSelection.clearSelection(event);
  }

  /**
   * 处理左和上方向键
   *
   * @param {KeyboardEvent} event - keyboard event
   */
  private arrowLeftAndUp(event: KeyboardEvent): void {
    /**
     * 箭头可以由flipper在工具栏上处理
     * 检查Flipper.usedKeys以允许通过上导航，而通过左禁止
     */
    if (this.Editor.UI.someToolbarOpened) {
      if (Flipper.usedKeys.includes(event.keyCode) && (!event.shiftKey || event.keyCode === _.keyCodes.TAB)) {
        return;
      }

      this.Editor.UI.closeAllToolbars();
    }

    /**
     * 当用户移动光标时关闭工具栏并高亮显示
     */
    this.Editor.BlockManager.clearFocused();
    this.Editor.Toolbar.close();

    const shouldEnableCBS = this.Editor.Caret.isAtStart || this.Editor.BlockSelection.anyBlockSelected;

    if (event.shiftKey && event.keyCode === _.keyCodes.UP && shouldEnableCBS) {
      this.Editor.CrossBlockSelection.toggleBlockSelectedState(false);

      return;
    }

    const navigatePrevious = event.keyCode === _.keyCodes.UP || (event.keyCode === _.keyCodes.LEFT && !this.isRtl);
    const isNavigated = navigatePrevious ? this.Editor.Caret.navigatePrevious() : this.Editor.Caret.navigateNext();

    if (isNavigated) {
      /**
       * 默认行为移动光标1个字符，我们需要防止它
       */
      event.preventDefault();
    } else {
      /**
       * 插入符号设置后，更新块输入索引
       */
      _.delay(() => {
        /** 当用户结束从编辑器中的选择时检查 currentBlock 的情况，然后按箭头键 */
        if (this.Editor.BlockManager.currentBlock) {
          this.Editor.BlockManager.currentBlock.updateCurrentInput();
        }
      }, 20)();
    }

    /**
     * 通过箭头清除块选区
     */
    this.Editor.BlockSelection.clearSelection(event);
  }

  /**
   * 需要关闭工具栏的情况
   *
   * @param {KeyboardEvent} event - keyboard event
   */
  private needToolbarClosing(event: KeyboardEvent): boolean {
    const toolboxItemSelected = (event.keyCode === _.keyCodes.ENTER && this.Editor.Toolbox.opened),
        blockSettingsItemSelected = (event.keyCode === _.keyCodes.ENTER && this.Editor.BlockSettings.opened),
        inlineToolbarItemSelected = (event.keyCode === _.keyCodes.ENTER && this.Editor.InlineToolbar.opened),
        conversionToolbarItemSelected = (event.keyCode === _.keyCodes.ENTER && this.Editor.ConversionToolbar.opened),
        flippingToolbarItems = event.keyCode === _.keyCodes.TAB;

    /**
     * 在以下情况下，请勿关闭 Toolbar：
     * 1. 按下ShiftKey（或与ShiftKey结合使用）
     * 2. 打开工具栏并且Tab弹出其工具时
     * 3. 当工具栏的组件被打开并且它的某些项被选中时
     */
    return !(event.shiftKey ||
      flippingToolbarItems ||
      toolboxItemSelected ||
      blockSettingsItemSelected ||
      inlineToolbarItemSelected ||
      conversionToolbarItemSelected
    );
  }

  /**
   * 如果工具箱未打开，则只需打开它并显示加号按钮
   */
  private activateToolbox(): void {
    if (!this.Editor.Toolbar.opened) {
      this.Editor.Toolbar.open(false, false);
      this.Editor.Toolbar.plusButton.show();
    }

    this.Editor.Toolbox.open();
  }

  /**
   * 打开工具栏，在翻转工具之前显示块设置
   */
  private activateBlockSettings(): void {
    if (!this.Editor.Toolbar.opened) {
      this.Editor.BlockManager.currentBlock.focused = true;
      this.Editor.Toolbar.open(true, false);
      this.Editor.Toolbar.plusButton.hide();
    }

    /**
     * 如果BlockSettings未打开，则打开BlockSettings
     * 下一步按 Tab 将弹出设置按钮
     */
    if (!this.Editor.BlockSettings.opened) {
      this.Editor.BlockSettings.open();
    }
  }
}
