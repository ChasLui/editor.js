import Module from '../__module';
import * as _ from '../utils';

/**
 * 事件监听器的信息
 *
 * @interface ListenerData
 */
export interface ListenerData {
  /**
   * 监听器唯一标识符
   */
  id: string;

  /**
   * 元素在哪里监听调度事件
   */
  element: EventTarget;

  /**
   * 事件驱动
   */
  eventType: string;

  /**
   * 事件处理器
   *
   * @param {Event} event - event object
   */
  handler: (event: Event) => void;

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
   */
  options: boolean | AddEventListenerOptions;
}

/**
 * Editor.js 监听器模块
 *
 * @module Listeners
 *
 * 用于事件监听器分配的模块装饰器
 *
 * @author Codex Team
 * @version 2.0.0
 */

/**
 * @typedef {Listeners} Listeners
 * @property {ListenerData[]} allListeners - 监听器存储
 */
export default class Listeners extends Module {
  /**
   * 存储所有监听器数据以查找/删除/处理它
   *
   * @type {ListenerData[]}
   */
  private allListeners: ListenerData[] = [];

  /**
   * 在元素上分配事件侦听器并返回唯一标识符
   *
   * @param {EventTarget} element - 需要监听的DOM元素
   * @param {string} eventType - 事件类型
   * @param {Function} handler - 将在事件上触发的方法
   * @param {boolean|AddEventListenerOptions} options - useCapture 或 {捕获, 被动, 一次}
   *
   * @returns {string}
   */
  public on(
    element: EventTarget,
    eventType: string,
    handler: (event: Event) => void,
    options: boolean | AddEventListenerOptions = false
  ): string {
    const id = _.generateId('l');
    const assignedEventData = {
      id,
      element,
      eventType,
      handler,
      options,
    };

    const alreadyExist = this.findOne(element, eventType, handler);

    if (alreadyExist) {
      return;
    }

    this.allListeners.push(assignedEventData);
    element.addEventListener(eventType, handler, options);

    return id;
  }

  /**
   * 从元素中移除事件监听器
   *
   * @param {EventTarget} element - 将删除监听器的 DOM 元素
   * @param {string} eventType - 事件类型
   * @param {Function} handler - 如果元素在同一事件类型上侦听多个处理程序，则删除处理程序
   * @param {boolean|AddEventListenerOptions} options - useCapture 或 {捕获, 被动, 一次}
   */
  public off(
    element: EventTarget,
    eventType: string,
    handler?: (event: Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void {
    const existingListeners = this.findAll(element, eventType, handler);

    existingListeners.forEach((listener, i) => {
      const index = this.allListeners.indexOf(existingListeners[i]);

      if (index > 0) {
        this.allListeners.splice(index, 1);

        listener.element.removeEventListener(listener.eventType, listener.handler, listener.options);
      }
    });
  }

  /**
   * 根据 id 删除监听器
   *
   * @param {string} id - 监听器标志
   */
  public offById(id: string): void {
    const listener = this.findById(id);

    if (!listener) {
      return;
    }

    listener.element.removeEventListener(listener.eventType, listener.handler, listener.options);
  }

  /**
   * 通过传递的参数查找并返回第一个侦听器
   *
   * @param {EventTarget} element - 事件目标元素
   * @param {string} [eventType] - 事件类型
   * @param {Function} [handler] - 事件处理器
   *
   * @returns {ListenerData|null}
   */
  public findOne(element: EventTarget, eventType?: string, handler?: (event: Event) => void): ListenerData {
    const foundListeners = this.findAll(element, eventType, handler);

    return foundListeners.length > 0 ? foundListeners[0] : null;
  }

  /**
   * 通过传递的参数返回所有存储的侦听器
   *
   * @param {EventTarget} element - 事件目标元素
   * @param {string} eventType - 事件类型
   * @param {Function} handler - 事件处理器
   *
   * @returns {ListenerData[]}
   */
  public findAll(element: EventTarget, eventType?: string, handler?: (event: Event) => void): ListenerData[] {
    let found;
    const foundByEventTargets = element ? this.findByEventTarget(element) : [];

    if (element && eventType && handler) {
      found = foundByEventTargets.filter((event) => event.eventType === eventType && event.handler === handler);
    } else if (element && eventType) {
      found = foundByEventTargets.filter((event) => event.eventType === eventType);
    } else {
      found = foundByEventTargets;
    }

    return found;
  }

  /**
   * 移除所有监听器
   */
  public removeAll(): void {
    this.allListeners.map((current) => {
      current.element.removeEventListener(current.eventType, current.handler, current.options);
    });

    this.allListeners = [];
  }

  /**
   * 销毁模块清理
   */
  public destroy(): void {
    this.removeAll();
  }

  /**
   * 搜索方法：按传递的元素查找侦听器
   *
   * @param {EventTarget} element - 搜索元素
   *
   * @returns {Array} 元素上找到的监听器
   */
  private findByEventTarget(element: EventTarget): ListenerData[] {
    return this.allListeners.filter((listener) => {
      if (listener.element === element) {
        return listener;
      }
    });
  }

  /**
   * 搜索方法：按传递的事件类型查找侦听器
   *
   * @param {string} eventType - 事件类型
   *
   * @returns {ListenerData[]} 元素上找到的监听器
   */
  private findByType(eventType: string): ListenerData[] {
    return this.allListeners.filter((listener) => {
      if (listener.eventType === eventType) {
        return listener;
      }
    });
  }

  /**
   * 搜索方法：按传递的事件处理器查找侦听器
   *
   * @param {Function} handler - 事件处理器
   *
   * @returns {ListenerData[]} 元素上找到的监听器
   */
  private findByHandler(handler: (event: Event) => void): ListenerData[] {
    return this.allListeners.filter((listener) => {
      if (listener.handler === handler) {
        return listener;
      }
    });
  }

  /**
   * 返回根据 id 找到的侦听器数据
   *
   * @param {string} id - 监听器标志
   *
   * @returns {ListenerData}
   */
  private findById(id: string): ListenerData {
    return this.allListeners.find((listener) => listener.id === id);
  }
}
