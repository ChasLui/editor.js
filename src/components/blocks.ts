import * as _ from './utils';
import $ from './dom';
import Block, { BlockToolAPI } from './block';
import { MoveEvent } from '../../types/tools';

/**
 * @class Blocks
 * @classdesc 与Block实例数组一起使用的类
 *
 * @private
 *
 * @property {HTMLElement} workingArea — 编辑器的工作节点
 *
 */
export default class Blocks {
  /**
   * 按添加顺序排列的Block实例数组
   */
  public blocks: Block[];

  /**
   * 编辑器的区域，在其中添加 Block 的 HTML
   */
  public workingArea: HTMLElement;

  /**
   * @class
   *
   * @param {HTMLElement} workingArea — 编辑器的工作节点
   */
  constructor(workingArea: HTMLElement) {
    this.blocks = [];
    this.workingArea = workingArea;
  }

  /**
   * 获取块实例数组的长度
   *
   * @returns {number}
   */
  public get length(): number {
    return this.blocks.length;
  }

  /**
   * 获取块实例数组
   *
   * @returns {Block[]}
   */
  public get array(): Block[] {
    return this.blocks;
  }

  /**
   * 获取块 html 元素数组
   *
   * @returns {HTMLElement[]}
   */
  public get nodes(): HTMLElement[] {
    return _.array(this.workingArea.children);
  }

  /**
   * 代理陷阱以实现类似数组的 setter
   *
   * @example
   * blocks[0] = new Block(...)
   *
   * @param {Blocks} instance — Blocks 实例
   * @param {PropertyKey} property — 块索引或要设置的任何Blocks类属性键
   * @param {Block} value — 要设置的值
   * @returns {boolean}
   */
  public static set(instance: Blocks, property: PropertyKey, value: Block | unknown): boolean {
    /**
     * 如果属性名称不是数字（方法或其他属性），请通过反射访问它
     */
    if (isNaN(Number(property))) {
      Reflect.set(instance, property, value);

      return true;
    }

    /**
     * 如果属性为数字，则调用insert方法以模拟数组行为
     *
     * @example
     * blocks[0] = new Block();
     */
    instance.insert(+(property as number), value as Block);

    return true;
  }

  /**
   * 代理陷阱以实现类似数组的 getter
   *
   * @param {Blocks} instance — Blocks 实例
   * @param {PropertyKey} property — Blocks 类属性建
   * @returns {Block|*}
   */
  public static get(instance: Blocks, property: PropertyKey): Block | unknown {
    /**
     * 如果属性不是数字，则通过Reflect对象获取它
     */
    if (isNaN(Number(property))) {
      return Reflect.get(instance, property);
    }

    /**
     * 如果属性是数字（块索引），则按传递的索引返回块
     */
    return instance.get(+(property as number));
  }

  /**
   * 将新的Block推送到blocks数组并将其附加到工作区
   *
   * @param {Block} block - Block to add
   */
  public push(block: Block): void {
    this.blocks.push(block);
    this.insertToDOM(block);
  }

  /**
   * 交换第一个和第二个索引的块
   *
   * @param {number} first - 第一个块索引
   * @param {number} second - 下一个快索引
   * @deprecated — 使用'move'代替
   */
  public swap(first: number, second: number): void {
    const secondBlock = this.blocks[second];

    /**
     * DOM 变更
     */
    $.swap(this.blocks[first].holder, secondBlock.holder);

    /**
     * 数组变更
     */
    this.blocks[second] = this.blocks[first];
    this.blocks[first] = secondBlock;
  }

  /**
   * 将一个块从一个索引移到另一个索引
   *
   * @param {number} toIndex - 块的新索引
   * @param {number} fromIndex - 要移动的 block
   */
  public move(toIndex: number, fromIndex: number): void {
    /**
     * 切出该块，移动DOM元素，然后再次插入所需的索引处（blocks数组内的移位将自动发生）。
     *
     * @see https://stackoverflow.com/a/44932690/1238150
     */
    const block = this.blocks.splice(fromIndex, 1)[0];

    // 操作 DOM
    const prevIndex = toIndex - 1;
    const previousBlockIndex = Math.max(0, prevIndex);
    const previousBlock = this.blocks[previousBlockIndex];

    if (toIndex > 0) {
      this.insertToDOM(block, 'afterend', previousBlock);
    } else {
      this.insertToDOM(block, 'beforebegin', previousBlock);
    }

    // 移动数组
    this.blocks.splice(toIndex, 0, block);

    // 调用hook
    const event: MoveEvent = this.composeBlockEvent('move', {
      fromIndex,
      toIndex,
    });

    block.call(BlockToolAPI.MOVED, event);
  }

  /**
   * 在传递的索引处插入新的块
   *
   * @param {number} index — 插入块的索引
   * @param {Block} block — 插入的块
   * @param {boolean} replace — 如果为 true,在给定索引上替换块
   */
  public insert(index: number, block: Block, replace = false): void {
    if (!this.length) {
      this.push(block);

      return;
    }

    if (index > this.length) {
      index = this.length;
    }

    if (replace) {
      this.blocks[index].holder.remove();
      this.blocks[index].call(BlockToolAPI.REMOVED);
    }

    const deleteCount = replace ? 1 : 0;

    this.blocks.splice(index, deleteCount, block);

    if (index > 0) {
      const previousBlock = this.blocks[index - 1];

      this.insertToDOM(block, 'afterend', previousBlock);
    } else {
      const nextBlock = this.blocks[index + 1];

      if (nextBlock) {
        this.insertToDOM(block, 'beforebegin', nextBlock);
      } else {
        this.insertToDOM(block);
      }
    }
  }

  /**
   * 移除块
   *
   * @param {number} index - 要移除块的索引
   */
  public remove(index: number): void {
    if (isNaN(index)) {
      index = this.length - 1;
    }

    this.blocks[index].holder.remove();

    this.blocks[index].call(BlockToolAPI.REMOVED);

    this.blocks.splice(index, 1);
  }

  /**
   * 移除所有块
   */
  public removeAll(): void {
    this.workingArea.innerHTML = '';

    this.blocks.forEach((block) => block.call(BlockToolAPI.REMOVED));

    this.blocks.length = 0;
  }

  /**
   * 在传递的目标后，插入块
   *
   * @todo 确定这个方法是否必要
   *
   * @param {Block} targetBlock — 目标应该插入哪个块之后
   * @param {Block} newBlock — 要插入的块
   */
  public insertAfter(targetBlock: Block, newBlock: Block): void {
    const index = this.blocks.indexOf(targetBlock);

    this.insert(index + 1, newBlock);
  }

  /**
   * 获索引处的取块
   *
   * @param {number} index — 块索引
   * @returns {Block}
   */
  public get(index: number): Block {
    return this.blocks[index];
  }

  /**
   * 返回传入块的索引
   *
   * @param {Block} block - 要查找的块
   * @returns {number}
   */
  public indexOf(block: Block): number {
    return this.blocks.indexOf(block);
  }

  /**
   * 将新块插入DOM
   *
   * @param {Block} block - 插入块
   * @param {InsertPosition} position — 插入位置（如果设置，将使用 insertAdjacentElement）
   * @param {Block} target — 与位置有关的块
   */
  private insertToDOM(block: Block, position?: InsertPosition, target?: Block): void {
    if (position) {
      target.holder.insertAdjacentElement(position, block.holder);
    } else {
      this.workingArea.appendChild(block.holder);
    }

    block.call(BlockToolAPI.RENDERED);
  }

  /**
   * 用传递的类型和详细信息组成Block事件
   *
   * @param {string} type - 事件类型
   * @param {object} detail - 事件详情
   */
  private composeBlockEvent(type: string, detail: object): MoveEvent {
    return new CustomEvent(type, {
      detail,
    }) as MoveEvent;
  }
}
