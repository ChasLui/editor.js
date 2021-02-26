/**
 * @module ModificationsObserver
 *
 * 处理任何突变，并给外部处理的机会
 */

import Module from '../__module';
import * as _ from '../utils';
import Block from '../block';

/**
 *
 */
export default class ModificationsObserver extends Module {
  /**
   * 防抖定时器
   *
   * @type {number}
   */
  public static readonly DebounceTimer = 450;

  /**
   * MutationObserver 实例
   */
  private observer: MutationObserver;

  /**
   * 允许临时禁用突变处理
   */
  private disabled = false;

  /**
   * 用于防止执行多个突变回调
   *
   * @type {Function}
   */
  private mutationDebouncer = _.debounce(() => {
    this.updateNativeInputs();

    if (_.isFunction(this.config.onChange)) {
      this.config.onChange(this.Editor.API.methods);
    }
  }, ModificationsObserver.DebounceTimer);

  /**
   * 块中的原生输入数组。
   * 原生输入中的更改不会由修改观察器处理，因此我们需要在它们上设置更改事件监听器
   */
  private nativeInputs: HTMLElement[] = [];

  /**
   * 清除 timeout 并将 mutationDebouncer 属性设置为 null
   */
  public destroy(): void {
    this.mutationDebouncer = null;
    if (this.observer) {
      this.observer.disconnect();
    }
    this.observer = null;
    this.nativeInputs.forEach((input) => this.Editor.Listeners.off(input, 'input', this.mutationDebouncer));
    this.mutationDebouncer = null;
  }

  /**
   * 设置只读状态
   *
   * @param {boolean} readOnlyEnabled - 只读标志值
   */
  public toggleReadOnly(readOnlyEnabled: boolean): void {
    if (readOnlyEnabled) {
      this.disableModule();
    } else {
      this.enableModule();
    }
  }

  /**
   * 允许禁用观察者，例如当编辑器想偷偷地改变 DOM
   */
  public disable(): void {
    this.disabled = true;
  }

  /**
   * 启用突变处理器
   * 应该在 .disable() 之后调用
   */
  public enable(): void {
    this.disabled = false;
  }

  /**
   * 设置观察者
   *
   * 在编辑器的UI.nodes上设置'DOMSubtreeModified'监听器
   * 这样用户就可以从API中进行外部处理
   */
  private setObserver(): void {
    const { UI } = this.Editor;
    const observerOptions = {
      childList: true,
      attributes: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    };

    this.observer = new MutationObserver((mutationList, observer) => {
      this.mutationHandler(mutationList, observer);
    });
    this.observer.observe(UI.nodes.redactor, observerOptions);
  }

  /**
   * MutationObserver 事件处理器
   *
   * @param {MutationRecord[]} mutationList - mutations 列表
   * @param {MutationObserver} observer - 观察者实例
   */
  private mutationHandler(mutationList: MutationRecord[], observer: MutationObserver): void {
    /**
     * 在隐身模式下跳过突变
     */
    if (this.disabled) {
      return;
    }

    /**
     * 我们分为两种突变类型:
     * 1) 与客户端更改有关的突变：设置更改、添加符号、删除、插入等等
     * 2) 功能的变化。在每个客户端操作上，我们设置与用户交互的功能标识符
     */
    let contentMutated = false;

    mutationList.forEach((mutation) => {
      switch (mutation.type) {
        case 'childList':
        case 'characterData':
          contentMutated = true;
          break;
        case 'attributes':
          /**
           * Element.ce-block 上变更通常是功能性的
           */
          if (!(mutation.target as Element).classList.contains(Block.CSS.wrapper)) {
            contentMutated = true;
          }
          break;
      }
    });

    /** 调用一次 */
    if (contentMutated) {
      this.mutationDebouncer();
    }
  }

  /**
   * 获取原生输入并设置 oninput 事件处理程序
   */
  private updateNativeInputs(): void {
    if (this.nativeInputs) {
      this.nativeInputs.forEach((input) => {
        this.Editor.Listeners.off(input, 'input');
      });
    }

    this.nativeInputs = Array.from(this.Editor.UI.nodes.redactor.querySelectorAll('textarea, input, select'));

    this.nativeInputs.forEach((input) => this.Editor.Listeners.on(input, 'input', this.mutationDebouncer));
  }

  /**
   * 设置观察器并启用它
   */
  private enableModule(): void {
    /**
     * 等待浏览器渲染编辑器块
     */
    window.setTimeout(() => {
      this.setObserver();
      this.updateNativeInputs();
      this.enable();
    }, 1000);
  }

  /**
   * 禁用观察者
   */
  private disableModule(): void {
    this.disable();
  }
}
