import { Toolbar } from '../../../../types/api';
import Module from '../../__module';
import * as _ from './../../utils';
/**
 * @class ToolbarAPI
 * 提供使用工具栏的方法
 */
export default class ToolbarAPI extends Module {
  /**
   * 可用方法
   *
   * @returns {Toolbar}
   */
  public get methods(): Toolbar {
    return {
      close: (): void => this.close(),
      open: (): void => this.open(),
      toggleBlockSettings: (openingState?: boolean): void => this.toggleBlockSettings(openingState),
    };
  }

  /**
   * 打开工具栏
   */
  public open(): void {
    this.Editor.Toolbar.open();
  }

  /**
   * 关闭工具栏和所有包含的元素
   */
  public close(): void {
    this.Editor.Toolbar.close();
  }

  /**
   * 切换当前块的块设置按钮
   *
   * @param {boolean} openingState —  块设置按钮的打开状态
   */
  public toggleBlockSettings(openingState?: boolean): void {
    if (this.Editor.BlockManager.currentBlockIndex === -1) {
      _.logLabeled('Could\'t toggle the Toolbar because there is no block selected ', 'warn');

      return;
    }

    /** 检查是否设置按钮了开启状态 */
    const canOpenBlockSettings = openingState ?? !this.Editor.BlockSettings.opened;

    /** 检查状态是否与当前状态相同 */
    if (openingState === this.Editor.BlockSettings.opened) {
      return;
    }

    if (canOpenBlockSettings) {
      if (!this.Editor.Toolbar.opened) {
        this.Editor.Toolbar.open(true, false);
        this.Editor.Toolbar.plusButton.hide();
      }
      this.Editor.BlockSettings.open();
    } else {
      this.Editor.BlockSettings.close();
    }
  }
}
