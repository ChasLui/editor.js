/**
 * @class 矩形选择器
 * @classdesc 用鼠标管理块选择
 *
 * @module RectangleSelection
 * @version 1.0.0
 */
import Module from '../__module';
import $ from '../dom';

import SelectionUtils from '../selection';
import Block from '../block';

/**
 *
 */
export default class RectangleSelection extends Module {
  /**
   * Block 的 CSS 类
   *
   * @returns {{wrapper: string, content: string}}
   */
  public static get CSS(): {[name: string]: string} {
    return {
      overlay: 'codex-editor-overlay',
      overlayContainer: 'codex-editor-overlay__container',
      rect: 'codex-editor-overlay__rectangle',
      topScrollZone: 'codex-editor-overlay__scroll-zone--top',
      bottomScrollZone: 'codex-editor-overlay__scroll-zone--bottom',
    };
  }

  /**
   * 使用选择矩形
   *
   * @type {boolean}
   */
  private isRectSelectionActivated = false;

  /**
   *  滚动的速度
   */
  private readonly SCROLL_SPEED: number = 3;

  /**
   *  屏幕边界上滚动区域的高度
   */
  private readonly HEIGHT_OF_SCROLL_ZONE = 40;

  /**
   *  滚动区域类型指示器
   */
  private readonly BOTTOM_SCROLL_ZONE = 1;
  private readonly TOP_SCROLL_ZONE = 2;

  /**
   * event.button的主按钮的ID
   */
  private readonly MAIN_MOUSE_BUTTON = 0;

  /**
   *  鼠标被按住
   */
  private mousedown = false;

  /**
   *  正在滚动
   */
  private isScrolling = false;

  /**
   *  鼠标在滚动区
   */
  private inScrollZone: number | null = null;

  /**
   *  矩形坐标
   */
  private startX = 0;
  private startY = 0;
  private mouseX = 0;
  private mouseY = 0;

  /**
   * 选中的块
   */
  private stackOfSelected: number[] = [];

  /**
   * 这个矩形与块相交吗
   */
  private rectCrossesBlocks: boolean;

  /**
   * 选取矩形
   */
  private overlayRectangle: HTMLDivElement;

  /**
   * 监听器标志
   */
  private listenerIds: string[] = [];

  /**
   * 模块准备
   * 创建矩形和绑定事件处理器
   */
  public prepare(): void {
    this.enableModuleBindings();
  }

  /**
   * 初始化矩形参数
   *
   * @param {number} pageX - 鼠标 X 坐标
   * @param {number} pageY - 鼠标 Y 坐标
   */
  public startSelection(pageX, pageY): void {
    const elemWhereSelectionStart = document.elementFromPoint(pageX - window.pageXOffset, pageY - window.pageYOffset);

    /**
     * 不要通过点击块设置按钮来清除选中的块，因为我们需要继续高亮显示工作块
     */
    const startsInsideToolbar = elemWhereSelectionStart.closest(`.${this.Editor.Toolbar.CSS.toolbar}`);

    if (!startsInsideToolbar) {
      this.Editor.BlockSelection.allBlocksSelected = false;
      this.clearSelection();
      this.stackOfSelected = [];
    }

    const selectorsToAvoid = [
      `.${Block.CSS.content}`,
      `.${this.Editor.Toolbar.CSS.toolbar}`,
      `.${this.Editor.InlineToolbar.CSS.inlineToolbar}`,
    ];

    const startsInsideEditor = elemWhereSelectionStart.closest('.' + this.Editor.UI.CSS.editorWrapper);
    const startsInSelectorToAvoid = selectorsToAvoid.some((selector) => !!elemWhereSelectionStart.closest(selector));

    /**
     * 如果选择在编辑器外部、块内部或编辑器 UI 元素上开始，不要处理它
     */
    if (!startsInsideEditor || startsInSelectorToAvoid) {
      return;
    }

    this.mousedown = true;
    this.startX = pageX;
    this.startY = pageY;
  }

  /**
   * 清除所有参数以结束选择
   */
  public endSelection(): void {
    this.mousedown = false;
    this.startX = 0;
    this.startY = 0;
    this.overlayRectangle.style.display = 'none';
  }

  /**
   * 矩形选择是否激活
   */
  public isRectActivated(): boolean {
    return this.isRectSelectionActivated;
  }

  /**
   * 标记选择结束
   */
  public clearSelection(): void {
    this.isRectSelectionActivated = false;
  }

  /**
   * 设置模块必需的事件处理器
   */
  private enableModuleBindings(): void {
    const { Listeners } = this.Editor;
    const { container } = this.genHTML();

    Listeners.on(container, 'mousedown', (mouseEvent: MouseEvent) => {
      this.processMouseDown(mouseEvent);
    }, false);

    Listeners.on(document.body, 'mousemove', (mouseEvent: MouseEvent) => {
      this.processMouseMove(mouseEvent);
    }, false);

    Listeners.on(document.body, 'mouseleave', () => {
      this.processMouseLeave();
    });

    Listeners.on(window, 'scroll', (mouseEvent: MouseEvent) => {
      this.processScroll(mouseEvent);
    }, false);

    Listeners.on(document.body, 'mouseup', () => {
      this.processMouseUp();
    }, false);
  }

  /**
   * 处理鼠标按下事件
   *
   * @param {MouseEvent} mouseEvent - 鼠标事件负载
   */
  private processMouseDown(mouseEvent: MouseEvent): void {
    if (mouseEvent.button !== this.MAIN_MOUSE_BUTTON) {
      return;
    }
    this.startSelection(mouseEvent.pageX, mouseEvent.pageY);
  }

  /**
   * 处理鼠标移动事件
   *
   * @param {MouseEvent} mouseEvent - 鼠标事件负载
   */
  private processMouseMove(mouseEvent: MouseEvent): void {
    this.changingRectangle(mouseEvent);
    this.scrollByZones(mouseEvent.clientY);
  }

  /**
   * 处理鼠标离开
   */
  private processMouseLeave(): void {
    this.clearSelection();
    this.endSelection();
  }

  /**
   * @param {MouseEvent} mouseEvent - 鼠标事件负载
   */
  private processScroll(mouseEvent: MouseEvent): void {
    this.changingRectangle(mouseEvent);
  }

  /**
   * 处理鼠标抬起
   */
  private processMouseUp(): void {
    this.endSelection();
  }

  /**
   * 如果鼠标在滚动区，则滚动
   *
   * @param {number} clientY - 鼠标 Y 坐标
   */
  private scrollByZones(clientY): void {
    this.inScrollZone = null;
    if (clientY <= this.HEIGHT_OF_SCROLL_ZONE) {
      this.inScrollZone = this.TOP_SCROLL_ZONE;
    }
    if (document.documentElement.clientHeight - clientY <= this.HEIGHT_OF_SCROLL_ZONE) {
      this.inScrollZone = this.BOTTOM_SCROLL_ZONE;
    }

    if (!this.inScrollZone) {
      this.isScrolling = false;

      return;
    }

    if (!this.isScrolling) {
      this.scrollVertical(this.inScrollZone === this.TOP_SCROLL_ZONE ? -this.SCROLL_SPEED : this.SCROLL_SPEED);
      this.isScrolling = true;
    }
  }

  /**
   * 生成所需的 HTML 元素
   *
   * @returns {object<string, Element>}
   */
  private genHTML(): {container: Element; overlay: Element} {
    const { UI } = this.Editor;

    const container = UI.nodes.holder.querySelector('.' + UI.CSS.editorWrapper);
    const overlay = $.make('div', RectangleSelection.CSS.overlay, {});
    const overlayContainer = $.make('div', RectangleSelection.CSS.overlayContainer, {});
    const overlayRectangle = $.make('div', RectangleSelection.CSS.rect, {});

    overlayContainer.appendChild(overlayRectangle);
    overlay.appendChild(overlayContainer);
    container.appendChild(overlay);

    this.overlayRectangle = overlayRectangle as HTMLDivElement;

    return {
      container,
      overlay,
    };
  }

  /**
   * 如果块选择处于活动状态且鼠标位于滚动区域，则激活滚动
   *
   * @param {number} speed - 滚动速度
   */
  private scrollVertical(speed): void {
    if (!(this.inScrollZone && this.mousedown)) {
      return;
    }
    const lastOffset = window.pageYOffset;

    window.scrollBy(0, speed);
    this.mouseY += window.pageYOffset - lastOffset;
    setTimeout(() => {
      this.scrollVertical(speed);
    }, 0);
  }

  /**
   * 处理矩形中的更改及其效果
   *
   * @param {MouseEvent} event - 鼠标事件
   */
  private changingRectangle(event: MouseEvent): void {
    if (!this.mousedown) {
      return;
    }

    if (event.pageY !== undefined) {
      this.mouseX = event.pageX;
      this.mouseY = event.pageY;
    }

    const { rightPos, leftPos, index } = this.genInfoForMouseSelection();
    // 选择中没有新块

    const rectIsOnRighSideOfredactor = this.startX > rightPos && this.mouseX > rightPos;
    const rectISOnLeftSideOfRedactor = this.startX < leftPos && this.mouseX < leftPos;

    this.rectCrossesBlocks = !(rectIsOnRighSideOfredactor || rectISOnLeftSideOfRedactor);

    if (!this.isRectSelectionActivated) {
      this.rectCrossesBlocks = false;
      this.isRectSelectionActivated = true;
      this.shrinkRectangleToPoint();
      this.overlayRectangle.style.display = 'block';
    }

    this.updateRectangleSize();

    if (index === undefined) {
      return;
    }

    this.trySelectNextBlock(index);
    // 例如，当 rect 从块中移出时
    this.inverseSelection();

    SelectionUtils.get().removeAllRanges();
    event.preventDefault();
  }

  /**
   * 收缩矩形到奇点
   */
  private shrinkRectangleToPoint(): void {
    this.overlayRectangle.style.left = `${this.startX - window.pageXOffset}px`;
    this.overlayRectangle.style.top = `${this.startY - window.pageYOffset}px`;
    this.overlayRectangle.style.bottom = `calc(100% - ${this.startY - window.pageYOffset}px`;
    this.overlayRectangle.style.right = `calc(100% - ${this.startX - window.pageXOffset}px`;
  }

  /**
   * 选择或取消选择数组中的所有块（如果rect为out或在可选区域中）
   */
  private inverseSelection(): void {
    const firstBlockInStack = this.Editor.BlockManager.getBlockByIndex(this.stackOfSelected[0]);
    const isSelectedMode = firstBlockInStack.selected;

    if (this.rectCrossesBlocks && !isSelectedMode) {
      for (const it of this.stackOfSelected) {
        this.Editor.BlockSelection.selectBlockByIndex(it);
      }
    }

    if (!this.rectCrossesBlocks && isSelectedMode) {
      for (const it of this.stackOfSelected) {
        this.Editor.BlockSelection.unSelectBlockByIndex(it);
      }
    }
  }

  /**
   * 更新矩形的大小
   */
  private updateRectangleSize(): void {
    // 根据鼠标相对于起始点的位置，更改距屏幕所需边缘 this.e 距离
    if (this.mouseY >= this.startY) {
      this.overlayRectangle.style.top = `${this.startY - window.pageYOffset}px`;
      this.overlayRectangle.style.bottom = `calc(100% - ${this.mouseY - window.pageYOffset}px`;
    } else {
      this.overlayRectangle.style.bottom = `calc(100% - ${this.startY - window.pageYOffset}px`;
      this.overlayRectangle.style.top = `${this.mouseY - window.pageYOffset}px`;
    }

    if (this.mouseX >= this.startX) {
      this.overlayRectangle.style.left = `${this.startX - window.pageXOffset}px`;
      this.overlayRectangle.style.right = `calc(100% - ${this.mouseX - window.pageXOffset}px`;
    } else {
      this.overlayRectangle.style.right = `calc(100% - ${this.startX - window.pageXOffset}px`;
      this.overlayRectangle.style.left = `${this.mouseX - window.pageXOffset}px`;
    }
  }

  /**
   * 收集确定矩形行为所需的信息
   *
   * @returns {object} index - 索引下一个块，leftPos -开始块的左边框，rightPos -右边框
   */
  private genInfoForMouseSelection(): {index: number; leftPos: number; rightPos: number} {
    const widthOfRedactor = document.body.offsetWidth;
    const centerOfRedactor = widthOfRedactor / 2;
    const Y = this.mouseY - window.pageYOffset;
    const elementUnderMouse = document.elementFromPoint(centerOfRedactor, Y);
    const blockInCurrentPos = this.Editor.BlockManager.getBlockByChildNode(elementUnderMouse);
    let index;

    if (blockInCurrentPos !== undefined) {
      index = this.Editor.BlockManager.blocks.findIndex((block) => block.holder === blockInCurrentPos.holder);
    }
    const contentElement = this.Editor.BlockManager.lastBlock.holder.querySelector('.' + Block.CSS.content);
    const centerOfBlock = Number.parseInt(window.getComputedStyle(contentElement).width, 10) / 2;
    const leftPos = centerOfRedactor - centerOfBlock;
    const rightPos = centerOfRedactor + centerOfBlock;

    return {
      index,
      leftPos,
      rightPos,
    };
  }

  /**
   * 用索引选择块
   *
   * @param index - 编辑器中的块索引
   */
  private addBlockInSelection(index): void {
    if (this.rectCrossesBlocks) {
      this.Editor.BlockSelection.selectBlockByIndex(index);
    }
    this.stackOfSelected.push(index);
  }

  /**
   * 将一个块添加到选择中，并确定应该选择哪些块
   *
   * @param {object} index - 反应器中新块的索引
   */
  private trySelectNextBlock(index): void {
    const sameBlock = this.stackOfSelected[this.stackOfSelected.length - 1] === index;
    const sizeStack = this.stackOfSelected.length;
    const down = 1, up = -1, undef = 0;

    if (sameBlock) {
      return;
    }

    const blockNumbersIncrease = this.stackOfSelected[sizeStack - 1] - this.stackOfSelected[sizeStack - 2] > 0;

    let direction = undef;

    if (sizeStack > 1) {
      direction = blockNumbersIncrease ? down : up;
    }

    const selectionInDownDirection = index > this.stackOfSelected[sizeStack - 1] && direction === down;
    const selectionInUpDirection = index < this.stackOfSelected[sizeStack - 1] && direction === up;
    const generalSelection = selectionInDownDirection || selectionInUpDirection || direction === undef;
    const reduction = !generalSelection;

    // 当选择太快时，有些方块没有时间被注意到。解决它。
    if (!reduction && (index > this.stackOfSelected[sizeStack - 1] ||
      this.stackOfSelected[sizeStack - 1] === undefined)) {
      let ind = this.stackOfSelected[sizeStack - 1] + 1 || index;

      for (ind; ind <= index; ind++) {
        this.addBlockInSelection(ind);
      }

      return;
    }

    // 对于两个方向
    if (!reduction && (index < this.stackOfSelected[sizeStack - 1])) {
      for (let ind = this.stackOfSelected[sizeStack - 1] - 1; ind >= index; ind--) {
        this.addBlockInSelection(ind);
      }

      return;
    }

    if (!reduction) {
      return;
    }

    let i = sizeStack - 1;
    let cmp;

    // 不同方向的cmp
    if (index > this.stackOfSelected[sizeStack - 1]) {
      cmp = (): boolean => index > this.stackOfSelected[i];
    } else {
      cmp = (): boolean => index < this.stackOfSelected[i];
    }

    // 移除因速度而丢失的块。
    // cmp 检查我们是否已经移除了所有必要的块
    while (cmp()) {
      if (this.rectCrossesBlocks) {
        this.Editor.BlockSelection.unSelectBlockByIndex(this.stackOfSelected[i]);
      }
      this.stackOfSelected.pop();
      i--;
    }
  }
}
