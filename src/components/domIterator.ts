import Dom from './dom';
import * as _ from './utils';
import SelectionUtils from './selection';

/**
 * 传递的Elements列表上方的迭代器。
 * 每个 下一个 或 上一个 动作添加提供CSS类，并将光标设置到该项目
 */
export default class DomIterator {
  /**
   * 这是定义迭代方向的静态属性
   *
   * @type {{RIGHT: string, LEFT: string}}
   */
  public static directions = {
    RIGHT: 'right',
    LEFT: 'left',
  };

  /**
   * 用户提供的焦点按钮CSS类名称
   */
  private focusedCssClass: string;

  /**
   * 聚焦按钮索引
   * 默认值为-1，表示没有任何活动
   *
   * @type {number}
   */
  private cursor = -1;

  /**
   * 翻转项目
   */
  private items: HTMLElement[] = [];

  /**
   * @param {HTMLElement[]} nodeList — 可迭代的HTML项列表
   * @param {string} focusedCssClass - 用户提供的CSS类，将在翻转过程中设置
   */
  constructor(
    nodeList: HTMLElement[],
    focusedCssClass: string
  ) {
    this.items = nodeList || [];
    this.focusedCssClass = focusedCssClass;
  }

  /**
   * 返回焦点按钮节点
   *
   * @returns {HTMLElement}
   */
  public get currentItem(): HTMLElement {
    if (this.cursor === -1) {
      return null;
    }

    return this.items[this.cursor];
  }

  /**
   * 设置项目。 当可迭代项目动态更改时可以使用
   *
   * @param {HTMLElement[]} nodeList - 要迭代的节点
   */
  public setItems(nodeList: HTMLElement[]): void {
    this.items = nodeList;
  }

  /**
   * 将光标设置在当前位置旁边
   */
  public next(): void {
    this.cursor = this.leafNodesAndReturnIndex(DomIterator.directions.RIGHT);
  }

  /**
   * 将光标设置在当前位置之前
   */
  public previous(): void {
    this.cursor = this.leafNodesAndReturnIndex(DomIterator.directions.LEFT);
  }

  /**
   * 将光标设置为默认位置，并从以前关注的项目中删除CSS类
   */
  public dropCursor(): void {
    if (this.cursor === -1) {
      return;
    }

    this.items[this.cursor].classList.remove(this.focusedCssClass);
    this.cursor = -1;
  }

  /**
   * 从活动元素中将叶子移到目标列表中
   *
   * @param {string} direction - 叶方向。 可以是“左”或“右”
   * @returns {number} 焦点节点索引
   */
  private leafNodesAndReturnIndex(direction: string): number {
    /**
     * 如果项目为空，则没有其他内容
     */
    if (this.items.length === 0) {
      return this.cursor;
    }

    let focusedButtonIndex = this.cursor;

    /**
     * 如果activeButtonIndex === -1，那么我们在工具箱中没有选择工具
     */
    if (focusedButtonIndex === -1) {
      /**
       * 根据方向归一化“上一个”工具索引。
       * 我们需要这样做以正确高亮“第一个”工具
       *
       * 工具排序: [0] [1] ... [n - 1]
       *   [0 = n] 因为: n % n = 0 % n
       *
       * 方向 'right': 对于[0], [n - 1] 是上一个索引
       *   [n - 1] -> [0]
       *
       * 方向 'left': 对于[n - 1],[0] 是上一个索引
       *   [n - 1] <- [0]
       *
       * @type {number}
       */
      focusedButtonIndex = direction === DomIterator.directions.RIGHT ? -1 : 0;
    } else {
      /**
       * 如果我们选择了工具，则删除高亮
       */
      this.items[focusedButtonIndex].classList.remove(this.focusedCssClass);
    }

    /**
     * 下一个工具的计数索引
     */
    if (direction === DomIterator.directions.RIGHT) {
      /**
       * 如果我们进行正确，请选择下一个（+1）工具
       *
       * @type {number}
       */
      focusedButtonIndex = (focusedButtonIndex + 1) % this.items.length;
    } else {
      /**
       * 如果我们向左走，则选择上一个（-1）工具
       * 在计数模块之前，由于“ JavaScript Modulo Bug ”，我们需要增加长度
       *
       * @type {number}
       */
      focusedButtonIndex = (this.items.length + focusedButtonIndex - 1) % this.items.length;
    }

    if (Dom.canSetCaret(this.items[focusedButtonIndex])) {
      /**
       * 通过微延迟集中输入以确保DOM被更新
       */
      _.delay(() => SelectionUtils.setCursor(this.items[focusedButtonIndex]), 50)();
    }

    /**
     * 高亮新选择的工具
     */
    this.items[focusedButtonIndex].classList.add(this.focusedCssClass);

    /**
     * 返回焦点按钮的索引
     */
    return focusedButtonIndex;
  }
}
