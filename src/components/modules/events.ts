import Module from '../__module';

/**
 * @module eventDispatcher
 *
 * 有两个重要的方法:
 *    - {Function} on - 将订阅者添加到事件中。 如果事件不存在-创建一个新事件
 *    - {Function} emit - 用数据触发所有订户
 *    - {Function off - 取消订阅回调
 *
 * @version 1.0.0
 *
 * @typedef {Events} Events
 * @property {object} subscribers - 按事件名称分组的所有订阅者
 */
export default class Events extends Module {
  /**
   * 以事件名称作为键并以回调函数数组作为值的对象
   *
   * @type {{}}
   */
  private subscribers: {[name: string]: Array<(data?: object) => object>} = {};

  /**
   * 在回调上订阅任何事件
   *
   * @param {string} eventName - event name
   * @param {Function} callback - subscriber
   */
  public on(eventName: string, callback: (data: object) => object): void {
    if (!(eventName in this.subscribers)) {
      this.subscribers[eventName] = [];
    }

    // 事件分组
    this.subscribers[eventName].push(callback);
  }

  /**
   * 在回调上订阅任何事件。回调将被调用一次，并在调用后从订户数组中删除。
   *
   * @param {string} eventName - event name
   * @param {Function} callback - subscriber
   */
  public once(eventName: string, callback: (data: object) => object): void {
    if (!(eventName in this.subscribers)) {
      this.subscribers[eventName] = [];
    }

    const wrappedCallback = (data: object): object => {
      const result = callback(data);

      const indexOfHandler = this.subscribers[eventName].indexOf(wrappedCallback);

      if (indexOfHandler !== -1) {
        this.subscribers[eventName].splice(indexOfHandler, 1);
      }

      return result;
    };

    // 事件分组
    this.subscribers[eventName].push(wrappedCallback);
  }

  /**
   * 使用传递的数据发出回调
   *
   * @param {string} eventName - 事件名
   * @param {object} data - 订阅者被解除订阅时会获得此数据
   */
  public emit(eventName: string, data?: object): void {
    if (!this.subscribers[eventName]) {
      return;
    }

    this.subscribers[eventName].reduce((previousData, currentHandler) => {
      const newData = currentHandler(previousData);

      return newData || previousData;
    }, data);
  }

  /**
   * 取消订阅事件的回调
   *
   * @param {string} eventName - 事件名
   * @param {Function} callback - 时间处理
   */
  public off(eventName: string, callback: (data: object) => object): void {
    for (let i = 0; i < this.subscribers[eventName].length; i++) {
      if (this.subscribers[eventName][i] === callback) {
        delete this.subscribers[eventName][i];
        break;
      }
    }
  }

  /**
   * 卸载
   * 清除订阅者列表
   */
  public destroy(): void {
    this.subscribers = null;
  }
}
