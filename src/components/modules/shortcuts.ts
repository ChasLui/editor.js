import Shortcut from '@codexteam/shortcuts';

/**
 * Contains keyboard and mouse events binded on each Block by Block Manager
 */
import Module from '../__module';

/**
 * 快捷键接口
 * 每个快捷键必须具有名称和处理程序
 * `name` 一个快捷键, 像 'CMD+K', 'CMD+B' 这样
 * `handler` 是一个回调函数
 *
 * @interface ShortcutData
 */
export interface ShortcutData {

  /**
   * 快捷键名称
   * Ex. CMD+I, CMD+B ....
   */
  name: string;

  /**
   * 快捷键处理
   */
  handler(event): void;
}

/**
 * @class Shortcut
 * @classdesc 允许注册新的快捷键
 *
 * 内部快捷键模块
 */
export default class Shortcuts extends Module {
  /**
   * 所有注册的跨借鉴
   *
   * @type {Shortcut[]}
   */
  private registeredShortcuts: Shortcut[] = [];

  /**
   * 注册快捷键
   *
   * @param {ShortcutData} shortcut - 快捷键选项
   */
  public add(shortcut: ShortcutData): void {
    const newShortcut = new Shortcut({
      name: shortcut.name,
      on: this.Editor.UI.nodes.redactor,
      callback: shortcut.handler,
    });

    this.registeredShortcuts.push(newShortcut);
  }

  /**
   * 删除快捷键
   *
   * @param {string} shortcut - 快捷键名
   */
  public remove(shortcut: string): void {
    const index = this.registeredShortcuts.findIndex((shc) => shc.name === shortcut);

    if (index === -1 || !this.registeredShortcuts[index]) {
      return;
    }

    this.registeredShortcuts[index].remove();
    this.registeredShortcuts.splice(index, 1);
  }
}
