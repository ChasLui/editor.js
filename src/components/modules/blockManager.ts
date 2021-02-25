/**
 * @class 块管理器
 * @classdesc 管理编辑器的块存储和外观
 *
 * @module BlockManager
 *
 * @version 2.0.0
 */
import Block, { BlockToolAPI } from '../block';
import Module from '../__module';
import $ from '../dom';
import * as _ from '../utils';
import Blocks from '../blocks';
import { BlockToolConstructable, BlockToolData, PasteEvent } from '../../../types';

/**
 * @typedef {BlockManager} BlockManager
 * @property {number} currentBlockIndex - 当前工作块的索引
 * @property {Proxy} _blocks - 块实例的代理 {@link Blocks}
 */
export default class BlockManager extends Module {
  /**
   * 返回当前块索引
   *
   * @returns {number}
   */
  public get currentBlockIndex(): number {
    return this._currentBlockIndex;
  }

  /**
   * 设置当前的块索引并触发块生命周期回调
   *
   * @param {number} newIndex - 要设置为当前的块索引
   */
  public set currentBlockIndex(newIndex: number) {
    if (this._blocks[this._currentBlockIndex]) {
      this._blocks[this._currentBlockIndex].willUnselect();
    }

    if (this._blocks[newIndex]) {
      this._blocks[newIndex].willSelect();
    }

    this._currentBlockIndex = newIndex;
  }

  /**
   * 返回第一个块
   *
   * @returns {Block}
   */
  public get firstBlock(): Block {
    return this._blocks[0];
  }

  /**
   * 返回最后一个块
   *
   * @returns {Block}
   */
  public get lastBlock(): Block {
    return this._blocks[this._blocks.length - 1];
  }

  /**
   * 获取当前块实例
   *
   * @returns {Block}
   */
  public get currentBlock(): Block {
    return this._blocks[this.currentBlockIndex];
  }

  /**
   * 返回下一个块实例
   *
   * @returns {Block|null}
   */
  public get nextBlock(): Block {
    const isLastBlock = this.currentBlockIndex === (this._blocks.length - 1);

    if (isLastBlock) {
      return null;
    }

    return this._blocks[this.currentBlockIndex + 1];
  }

  /**
   * 返回第一个块，输入在当前块之后
   *
   * @returns {Block | undefined}
   */
  public get nextContentfulBlock(): Block {
    const nextBlocks = this.blocks.slice(this.currentBlockIndex + 1);

    return nextBlocks.find((block) => !!block.inputs.length);
  }

  /**
   * 在输入当前块之前返回第一个块并输入
   *
   * @returns {Block | undefined}
   */
  public get previousContentfulBlock(): Block {
    const previousBlocks = this.blocks.slice(0, this.currentBlockIndex).reverse();

    return previousBlocks.find((block) => !!block.inputs.length);
  }

  /**
   * 返回上一块实例
   *
   * @returns {Block|null}
   */
  public get previousBlock(): Block {
    const isFirstBlock = this.currentBlockIndex === 0;

    if (isFirstBlock) {
      return null;
    }

    return this._blocks[this.currentBlockIndex - 1];
  }

  /**
   * 获取块实例的数组
   *
   * @returns {Block[]} {@link Blocks#array}
   */
  public get blocks(): Block[] {
    return this._blocks.array;
  }

  /**
   * 检查每个块是否为空
   *
   * @returns {boolean}
   */
  public get isEditorEmpty(): boolean {
    return this.blocks.every((block) => block.isEmpty);
  }

  /**
   * 当前工作块的索引
   *
   * @type {number}
   */
  private _currentBlockIndex = -1;

  /**
   * Proxy for Blocks instance {@link Blocks}
   *
   * @type {Proxy}
   * @private
   */
  private _blocks: Blocks = null;

  /**
   * 应在Editor.UI准备之后调用
   * Define this._blocks 原型
   */
  public prepare(): void {
    const blocks = new Blocks(this.Editor.UI.nodes.redactor);

    /**
     * 我们需要使用代理来重载 set/get [] 运算符。
     * 所以我们可以使用类似数组的语法来访问块
     *
     * @example
     * this._blocks[0] = new Block(...);
     *
     * block = this._blocks[0];
     *
     * @todo 代理枚举方法
     *
     * @type {Proxy}
     * @private
     */
    this._blocks = new Proxy(blocks, {
      set: Blocks.set,
      get: Blocks.get,
    });

    /** 拷贝事件 */
    this.Editor.Listeners.on(
      document,
      'copy',
      (e: ClipboardEvent) => this.Editor.BlockEvents.handleCommandC(e)
    );
  }

  /**
   * 切换只读状态
   *
   * 如果 readOnly 为 true：
   *  - 从创建的块中解绑定事件处理程序
   *
   * 如果 readOnly 为 false：
   *  - 将事件处理程序绑定到所有现有块
   *
   * @param {boolean} readOnlyEnabled - "read only" 状态
   */
  public toggleReadOnly(readOnlyEnabled: boolean): void {
    if (!readOnlyEnabled) {
      this.enableModuleBindings();
    } else {
      this.disableModuleBindings();
    }
  }

  /**
   * 通过工具名称创建块实例
   *
   * @param {object} options - 块创建选项
   * @param {string} options.tool - 编辑器配置中传递的工具 {@link EditorConfig#tools}
   * @param {BlockToolData} [options.data] - 构造函数参数
   *
   * @returns {Block}
   */
  public composeBlock({ tool, data = {} }: {tool: string; data?: BlockToolData}): Block {
    const readOnly = this.Editor.ReadOnly.isEnabled;
    const settings = this.Editor.Tools.getToolSettings(tool);
    const Tool = this.Editor.Tools.available[tool] as BlockToolConstructable;
    const block = new Block({
      name: tool,
      data,
      Tool,
      settings,
      api: this.Editor.API,
      readOnly,
    });

    if (!readOnly) {
      this.bindBlockEvents(block);
    }

    return block;
  }

  /**
   * 将新块插入_blocks
   *
   * @param {object} options - 插入选项
   * @param {string} options.tool - 插件名称，默认情况下会插入默认的块类型
   * @param {object} options.data - 插件数据
   * @param {number} options.index - 插入新块的位置索引
   * @param {boolean} options.needToFocus - 标志显示是否需要更新当前块索引
   * @param {boolean} options.replace - 标志显示是否应将按传递的索引块替换为插入的索引
   *
   * @returns {Block}
   */
  public insert({
    tool = this.config.defaultBlock,
    data = {},
    index,
    needToFocus = true,
    replace = false,
  }: {
    tool?: string;
    data?: BlockToolData;
    index?: number;
    needToFocus?: boolean;
    replace?: boolean;
  } = {}): Block {
    let newIndex = index;

    if (newIndex === undefined) {
      newIndex = this.currentBlockIndex + (replace ? 0 : 1);
    }

    const block = this.composeBlock({
      tool,
      data,
    });

    this._blocks.insert(newIndex, block, replace);

    if (needToFocus) {
      this.currentBlockIndex = newIndex;
    } else if (newIndex <= this.currentBlockIndex) {
      this.currentBlockIndex++;
    }

    return block;
  }

  /**
   * 替换当前工作块
   *
   * @param {object} options - 替换选项
   * @param {string} options.tool — 插件名称
   * @param {BlockToolData} options.data — 插件数据
   *
   * @returns {Block}
   */
  public replace({
    tool = this.config.defaultBlock,
    data = {},
  }): Block {
    return this.insert({
      tool,
      data,
      index: this.currentBlockIndex,
      replace: true,
    });
  }

  /**
   * 插入粘贴的内容。 插入后调用onPaste回调。
   *
   * @param {string} toolName - 要插入的工具名称
   * @param {PasteEvent} pasteEvent - 粘贴的数据
   * @param {boolean} replace - 是否需要替换当前块
   */
  public paste(
    toolName: string,
    pasteEvent: PasteEvent,
    replace = false
  ): Block {
    const block = this.insert({
      tool: toolName,
      replace,
    });

    try {
      block.call(BlockToolAPI.ON_PASTE, pasteEvent);
    } catch (e) {
      _.log(`${toolName}: onPaste callback call is failed`, 'error', e);
    }

    return block;
  }

  /**
   * 在传递的索引处插入新的默认块
   *
   * @param {number} index - 插入块的索引
   * @param {boolean} needToFocus - 如果为 true, 更新当前块索引
   *
   * TODO: 删除方法并使用insert()和index (?)
   *
   * @returns {Block} inserted Block
   */
  public insertDefaultBlockAtIndex(index: number, needToFocus = false): Block {
    const block = this.composeBlock({ tool: this.config.defaultBlock });

    this._blocks[index] = block;

    if (needToFocus) {
      this.currentBlockIndex = index;
    } else if (index <= this.currentBlockIndex) {
      this.currentBlockIndex++;
    }

    return block;
  }

  /**
   * 始终插入末尾
   *
   * @returns {Block}
   */
  public insertAtEnd(): Block {
    /**
     * 为当前块索引定义新值
     */
    this.currentBlockIndex = this.blocks.length - 1;

    /**
     * 插入默认的类型块
     */
    return this.insert();
  }

  /**
   * 合并两个块
   *
   * @param {Block} targetBlock - 前一个块将添加到此块
   * @param {Block} blockToMerge - 将与目标块合并的块
   *
   * @returns {Promise} - 可以继续的顺序
   */
  public async mergeBlocks(targetBlock: Block, blockToMerge: Block): Promise<void> {
    const blockToMergeIndex = this._blocks.indexOf(blockToMerge);

    if (blockToMerge.isEmpty) {
      return;
    }

    const blockToMergeData = await blockToMerge.data;

    if (!_.isEmpty(blockToMergeData)) {
      await targetBlock.mergeWith(blockToMergeData);
    }

    this.removeBlock(blockToMergeIndex);
    this.currentBlockIndex = this._blocks.indexOf(targetBlock);
  }

  /**
   * 移除通过索引或删除最后的块
   *
   * @param {number|null} index - 要删除的块索引
   * @throws {Error} 如果找不到阻止删除
   */
  public removeBlock(index = this.currentBlockIndex): void {
    /**
     * 如果未传递索引且未选择任何块，则显示警告
     */
    if (!this.validateIndex(index)) {
      throw new Error('Can\'t find a Block to remove');
    }

    this._blocks.remove(index);

    if (this.currentBlockIndex >= index) {
      this.currentBlockIndex--;
    }

    /**
     * 如果删除了第一个块，请插入新的“初始块”并将焦点放在第一个输入上
     */
    if (!this.blocks.length) {
      this.currentBlockIndex = -1;
      this.insert();
    } else if (index === 0) {
      this.currentBlockIndex = 0;
    }
  }

  /**
   * 只删除选定的块，并返回第一个开始删除的块索引…
   *
   * @returns {number|undefined}
   */
  public removeSelectedBlocks(): number | undefined {
    let firstSelectedBlockIndex;

    /**
     * 从最后删除选定的块
     */
    for (let index = this.blocks.length - 1; index >= 0; index--) {
      if (!this.blocks[index].selected) {
        continue;
      }

      this.removeBlock(index);
      firstSelectedBlockIndex = index;
    }

    return firstSelectedBlockIndex;
  }

  /**
   * 注意!
   * 删除后，插入新的默认类型的块并聚焦于它
   * 删除所有块
   */
  public removeAllBlocks(): void {
    for (let index = this.blocks.length - 1; index >= 0; index--) {
      this._blocks.remove(index);
    }

    this.currentBlockIndex = -1;
    this.insert();
    this.currentBlock.firstInput.focus();
  }

  /**
   * 切割当前块
   * 1. 从插入点位置到块的末尾提取内容
   * 2. 在提取内容的当前块下插入一个新块
   *
   * @returns {Block}
   */
  public split(): Block {
    const extractedFragment = this.Editor.Caret.extractFragmentFromCaretPosition();
    const wrapper = $.make('div');

    wrapper.appendChild(extractedFragment as DocumentFragment);

    /**
     * @todo 根据工具制作对象
     */
    const data = {
      text: $.isEmpty(wrapper) ? '' : wrapper.innerHTML,
    };

    /**
     * 更新当前块
     *
     * @type {Block}
     */
    return this.insert({ data });
  }

  /**
   * 通过传递的索引返回块
   *
   * @param {number} index - 要获取的索引
   *
   * @returns {Block}
   */
  public getBlockByIndex(index): Block {
    return this._blocks[index];
  }

  /**
   * 通过 html 元素获取块实例
   *
   * @param {Node} element - html 元素
   *
   * @returns {Block}
   */
  public getBlock(element: HTMLElement): Block {
    if (!$.isElement(element) as boolean) {
      element = element.parentNode as HTMLElement;
    }

    const nodes = this._blocks.nodes,
        firstLevelBlock = element.closest(`.${Block.CSS.wrapper}`),
        index = nodes.indexOf(firstLevelBlock as HTMLElement);

    if (index >= 0) {
      return this._blocks[index];
    }
  }

  /**
   * 从所有块中删除选择，然后仅突出显示当前块
   */
  public highlightCurrentNode(): void {
    /**
     * 删除先前选择的块的状态
     */
    this.clearFocused();

    /**
     * 将当前块标记为选中
     *
     * @type {boolean}
     */
    this.currentBlock.focused = true;
  }

  /**
   * 删除选择的所有块
   */
  public clearFocused(): void {
    this.blocks.forEach((block) => {
      block.focused = false;
    });
  }

  /**
   * 1) 从传递的子节点中查找一级块
   * 2) 将其标记为当前工作块
   *
   * @param {Node} childNode - 从这个节点向前看。
   * @returns 如果传递的子注释不属于当前编辑器实例，则可以返回 undefined
   */
  public setCurrentBlockByChildNode(childNode: Node): Block | undefined {
    /**
     * 如果节点是 Text TextNode
     */
    if (!$.isElement(childNode)) {
      childNode = childNode.parentNode;
    }

    const parentFirstLevelBlock = (childNode as HTMLElement).closest(`.${Block.CSS.wrapper}`);

    if (!parentFirstLevelBlock) {
      return;
    }

    /**
     * 支持多个Editor.js实例，
     * 通过检查找到的块是否属于当前实例
     *
     * @see {@link Ui#documentTouched}
     */
    const editorWrapper = parentFirstLevelBlock.closest(`.${this.Editor.UI.CSS.editorWrapper}`);
    const isBlockBelongsToCurrentInstance = editorWrapper?.isEqualNode(this.Editor.UI.nodes.wrapper);

    if (!isBlockBelongsToCurrentInstance) {
      return;
    }

    /**
     * 更新当前块的索引
     *
     * @type {number}
     */
    this.currentBlockIndex = this._blocks.nodes.indexOf(parentFirstLevelBlock as HTMLElement);

    /**
     * 更新当前块的活动输入
     */
    this.currentBlock.updateCurrentInput();

    return this.currentBlock;
  }

  /**
   * 返回内容通过子节点的块
   *
   * @param {Node} childNode - 找块的节点
   *
   * @returns {Block}
   */
  public getBlockByChildNode(childNode: Node): Block {
    /**
     * 如果节点是文本节点
     */
    if (!$.isElement(childNode)) {
      childNode = childNode.parentNode;
    }

    const firstLevelBlock = (childNode as HTMLElement).closest(`.${Block.CSS.wrapper}`);

    return this.blocks.find((block) => block.holder === firstLevelBlock);
  }

  /**
   * 交换块位置
   *
   * @param {number} fromIndex - 第一块索引
   * @param {number} toIndex - 第二区块索引
   *
   * @deprecated — 使用 "move" 代替
   */
  public swap(fromIndex, toIndex): void {
    /** 向上移动当前区块 */
    this._blocks.swap(fromIndex, toIndex);

    /** 现在实际的块向上移动，使当前的块索引减少 */
    this.currentBlockIndex = toIndex;
  }

  /**
   * 将块移动到新索引
   *
   * @param {number} toIndex - 索引移动块的位置
   * @param {number} fromIndex - 要移动的块的索引
   */
  public move(toIndex, fromIndex = this.currentBlockIndex): void {
    // 确保索引有效且在有效范围内
    if (isNaN(toIndex) || isNaN(fromIndex)) {
      _.log(`Warning during 'move' call: incorrect indices provided.`, 'warn');

      return;
    }

    if (!this.validateIndex(toIndex) || !this.validateIndex(fromIndex)) {
      _.log(`Warning during 'move' call: indices cannot be lower than 0 or greater than the amount of blocks.`, 'warn');

      return;
    }

    /** 向上移动当前块 */
    this._blocks.move(toIndex, fromIndex);

    /** 现在实际块已移动，因此当前块索引已更改 */
    this.currentBlockIndex = toIndex;
  }

  /**
   * 设置当前的块索引-1，表示未知
   * 并清除高亮
   */
  public dropPointer(): void {
    this.currentBlockIndex = -1;
    this.clearFocused();
  }

  /**
   * 清除编辑器
   *
   * @param {boolean} needToAddDefaultBlock - 1) 在内部调用中（例如，在 api.blocks.render 中），我们不需要添加空的默认块
   *                                        2) 在 api.blocks.clear 中，我们应该添加空块
   */
  public clear(needToAddDefaultBlock = false): void {
    this._blocks.removeAll();
    this.dropPointer();

    if (needToAddDefaultBlock) {
      this.insert();
    }

    /**
     * 添加空修饰符
     */
    this.Editor.UI.checkEmptiness();
  }

  /**
   * 清理所有块工具的资源
   * 在销毁编辑器时调用此函数
   */
  public async destroy(): Promise<void> {
    await Promise.all(this.blocks.map((block) => {
      if (_.isFunction(block.tool.destroy)) {
        return block.tool.destroy();
      }
    }));
  }

  /**
   * 绑定块事件
   *
   * @param {Block} block - 将要绑定事件的 block
   */
  private bindBlockEvents(block: Block): void {
    const { BlockEvents } = this.Editor;

    this.readOnlyMutableListeners.on(block.holder, 'keydown', (event: KeyboardEvent) => {
      BlockEvents.keydown(event);
    }, true);

    this.readOnlyMutableListeners.on(block.holder, 'keyup', (event: KeyboardEvent) => {
      BlockEvents.keyup(event);
    });

    this.readOnlyMutableListeners.on(block.holder, 'dragover', (event: DragEvent) => {
      BlockEvents.dragOver(event);
    });

    this.readOnlyMutableListeners.on(block.holder, 'dragleave', (event: DragEvent) => {
      BlockEvents.dragLeave(event);
    });
  }

  /**
   * 禁用可变处理程序和绑定
   */
  private disableModuleBindings(): void {
    this.readOnlyMutableListeners.clearAll();
  }

  /**
   * 启用所有模块的所有模块处理程序和绑定
   */
  private enableModuleBindings(): void {
    /** 剪切事件 */
    this.readOnlyMutableListeners.on(
      document,
      'cut',
      (e: ClipboardEvent) => this.Editor.BlockEvents.handleCommandX(e)
    );

    this.blocks.forEach((block: Block) => {
      this.bindBlockEvents(block);
    });
  }

  /**
   * 验证给定的索引不低于0或高于块的数量
   *
   * @param {number} index - 要验证的块数组索引
   *
   * @returns {boolean}
   */
  private validateIndex(index: number): boolean {
    return !(index < 0 || index >= this._blocks.length);
  }
}
