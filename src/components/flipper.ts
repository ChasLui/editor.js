import DomIterator from './domIterator';
import * as _ from './utils';

/**
 * Flipper 构造函数选项
 *
 * @interface FlipperOptions
 */
export interface FlipperOptions {
  /**
   * 聚焦项目的CSS修饰符
   */
  focusedItemClass?: string;

  /**
   * 如果所有块（例如工具箱）的转换项都相同，则 ypu 可以在构造时将其传递
   */
  items?: HTMLElement[];

  /**
   * 定义箭头用法。 默认情况下，Flipper也会通过 RIGHT/LEFT 来放置项目。
   *
   * 默认 true
   *
   * 如果您不需要此行为，则传递`false`（例如，“内联工具栏”应使用箭头关闭，因为这意味着插入符号会随着选择清除而移动）
   */
  allowArrows?: boolean;

  /**
   * 单击按钮的可选回调
   */
  activateCallback?: (item: HTMLElement) => void;
}

/**
 * Flipper 是一个组件，可通过 TAB 或 Arrows 迭代传递的项目数组，然后按 ENTER 单击它
 */
export default class Flipper {
  /**
   * 迭代器的实例
   *
   * @type {DomIterator|null}
   */
  private readonly iterator: DomIterator = null;

  /**
   * 定义激活状态的标志
   *
   * @type {boolean}
   */
  private activated = false;

  /**
   * 允许使用箭头翻转项的标志
   *
   * @type {boolean}
   */
  private readonly allowArrows: boolean = true;

  /**
   * 回调按钮 单击/输入
   */
  private readonly activateCallback: (item: HTMLElement) => void;

  /**
   * @param {FlipperOptions} options - 不同的构造设置
   */
  constructor(options: FlipperOptions) {
    this.allowArrows = _.isBoolean(options.allowArrows) ? options.allowArrows : true;
    this.iterator = new DomIterator(options.items, options.focusedItemClass);
    this.activateCallback = options.activateCallback;
  }

  /**
   * Flipper处理的键（代码）数组
   * 常用于:
   *  - preventDefault 仅用于此键，而不是所有键按下 (@see constructor)
   *  - 当填充器被激活时，仅跳过这些键的外部行为 (@see BlockEvents@arrowRightAndDown)
   */
  public static get usedKeys(): number[] {
    return [
      _.keyCodes.TAB,
      _.keyCodes.LEFT,
      _.keyCodes.RIGHT,
      _.keyCodes.ENTER,
      _.keyCodes.UP,
      _.keyCodes.DOWN,
    ];
  }

  /**
   * flipper 活动选项卡/处理的箭头
   *
   * @param {HTMLElement[]} items - 某些模块（例如InlineToolbar，BlockSettings）可能会动态刷新按钮
   */
  public activate(items?: HTMLElement[]): void {
    this.activated = true;

    if (items) {
      this.iterator.setItems(items);
    }

    /**
     * 监听文档上的所有按键，并按 TAB / Enter 键进行响应
     * TAB 将跳过迭代器项目
     * ENTER 将点击聚焦项目
     */
    document.addEventListener('keydown', this.onKeyDown);
  }

  /**
   * 禁用flipper的选项卡/箭头处理
   */
  public deactivate(): void {
    this.activated = false;
    this.dropCursor();

    document.removeEventListener('keydown', this.onKeyDown);
  }

  /**
   * 返回当前聚焦按钮
   *
   * @returns {HTMLElement|null}
   */
  public get currentItem(): HTMLElement|null {
    return this.iterator.currentItem;
  }

  /**
   * 聚焦第一项
   */
  public focusFirst(): void {
    this.dropCursor();
    this.flipRight();
  }

  /**
   * 聚焦上一个翻转器迭代器项
   */
  public flipLeft(): void {
    this.iterator.previous();
  }

  /**
   * 聚焦下一个flipper迭代器项
   */
  public flipRight(): void {
    this.iterator.next();
  }

  /**
   * 放下 flipper 的迭代器光标
   *
   * @see DomIterator#dropCursor
   */
  private dropCursor(): void {
    this.iterator.dropCursor();
  }

  /**
   * KeyDown 事件处理
   *
   * @param event - keydown 事件对象
   */
  private onKeyDown = (event): void => {
    const isReady = this.isEventReadyForHandling(event);

    if (!isReady) {
      return;
    }

    /**
     * 阻止事件仅使用的键默认行为（例如，允许通过“向下箭头”进行导航）
     */
    if (Flipper.usedKeys.includes(event.keyCode)) {
      event.preventDefault();
    }

    switch (event.keyCode) {
      case _.keyCodes.TAB:
        this.handleTabPress(event);
        break;
      case _.keyCodes.LEFT:
      case _.keyCodes.UP:
        this.flipLeft();
        break;
      case _.keyCodes.RIGHT:
      case _.keyCodes.DOWN:
        this.flipRight();
        break;
      case _.keyCodes.ENTER:
        this.handleEnterPress(event);
        break;
    }
  };

  /**
   * 处理翻转键代码之前会触发此函数
   * 该函数的结果定义是否需要处理
   *
   * @param {KeyboardEvent} event - keydown keyboard event
   * @returns {boolean}
   */
  private isEventReadyForHandling(event: KeyboardEvent): boolean {
    const handlingKeyCodeList = [
      _.keyCodes.TAB,
      _.keyCodes.ENTER,
    ];

    const isCurrentItemIsFocusedInput = this.iterator.currentItem == document.activeElement;

    if (this.allowArrows && !isCurrentItemIsFocusedInput) {
      handlingKeyCodeList.push(
        _.keyCodes.LEFT,
        _.keyCodes.RIGHT,
        _.keyCodes.UP,
        _.keyCodes.DOWN
      );
    }

    return this.activated && handlingKeyCodeList.indexOf(event.keyCode) !== -1;
  }

  /**
   * 激活 flipper 时，按Tab键将使项目掉落
   *
   * @param {KeyboardEvent} event - tab keydown event
   */
  private handleTabPress(event: KeyboardEvent): void {
    /** 此属性定义叶子方向 */
    const shiftKey = event.shiftKey,
        direction = shiftKey ? DomIterator.directions.LEFT : DomIterator.directions.RIGHT;

    switch (direction) {
      case DomIterator.directions.RIGHT:
        this.flipRight();
        break;
      case DomIterator.directions.LEFT:
        this.flipLeft();
        break;
    }
  }

  /**
   * 如果激活 flipper，请按Enter键将单击当前项目
   *
   * @param {KeyboardEvent} event - enter keydown event
   */
  private handleEnterPress(event: KeyboardEvent): void {
    if (!this.activated) {
      return;
    }

    if (this.iterator.currentItem) {
      this.iterator.currentItem.click();
    }

    if (_.isFunction(this.activateCallback)) {
      this.activateCallback(this.iterator.currentItem);
    }

    event.preventDefault();
    event.stopPropagation();
  }
}
