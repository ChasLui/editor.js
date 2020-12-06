import { EditorModules } from '../types-internal/editor-modules';
import { EditorConfig } from '../../types';
import { ModuleConfig } from '../types-internal/module-config';

/**
 * Module泛型的类型<T>。
 * 它描述了模块中使用的节点的结构。
 */
export type ModuleNodes = object;

/**
 * @abstract
 * @class      Module
 * @classdesc  所有模块都从此类继承。
 *
 * @typedef {Module} Module
 * @property {object} config - 编辑器用户设置
 * @property {EditorModules} Editor - 编辑器模块列表
 */
export default class Module<T extends ModuleNodes = {}> {
  /**
   * 每个模块都可以提供一些将存储在此属性中的UI元素
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public nodes: T = {} as any;

  /**
   * 编辑器模块列表
   *
   * @type {EditorModules}
   */
  protected Editor: EditorModules;

  /**
   * 编辑器配置对象
   *
   * @type {EditorConfig}
   */
  protected config: EditorConfig;

  /**
   * 该对象提供了一些方法，可用于启用启用只读模式时放入的侦听器集
   */
  protected readOnlyMutableListeners = {
    /**
     * 在DOM元素上分配事件侦听器，并推送到可能会删除的特殊数组中
     *
     * @param {EventTarget} element - DOM 元素
     * @param {string} eventType - 事件名称
     * @param {Function} handler - 事件处理
     * @param {boolean|AddEventListenerOptions} options - 监听选项
     */
    on: (
      element: EventTarget,
      eventType: string,
      handler: (event: Event) => void,
      options: boolean | AddEventListenerOptions = false
    ): void => {
      const { Listeners } = this.Editor;

      this.mutableListenerIds.push(
        Listeners.on(element, eventType, handler, options)
      );
    },

    /**
     * 清除所有可变监听器
     */
    clearAll: (): void => {
      const { Listeners } = this.Editor;

      for (const id of this.mutableListenerIds) {
        Listeners.offById(id);
      }

      this.mutableListenerIds = [];
    },
  };

  /**
   * 侦听器标识符集，将以只读模式删除
   */
  private mutableListenerIds: string[] = [];

  /**
   * @class
   * @param {EditorConfig} config - 编辑器的配置
   */
  constructor({ config }: ModuleConfig) {
    if (new.target === Module) {
      throw new TypeError('Constructors for abstract class Module are not allowed.');
    }

    this.config = config;
  }

  /**
   * 编辑器模块的 setter
   *
   * @param {EditorModules} Editor - Editor's Modules
   */
  public set state(Editor: EditorModules) {
    this.Editor = Editor;
  }

  /**
   * 删除记忆的节点
   */
  public removeAllNodes(): void {
    for (const key in this.nodes) {
      const node = this.nodes[key];

      if (node instanceof HTMLElement) {
        node.remove();
      }
    }
  }

  /**
   * 如果当前方向为RTL（从右至左），则返回true
   */
  protected get isRtl(): boolean {
    return this.config.i18n.direction === 'rtl';
  }
}
