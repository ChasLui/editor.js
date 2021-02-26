import { Styles } from '../../../../types/api';
import Module from '../../__module';

/**
 *
 */
export default class StylesAPI extends Module {
  /**
   * 导出的类
   */
  public get classes(): Styles {
    return {
      /**
       * 基块样式
       */
      block: 'cdx-block',

      /**
       * 内联工具样式
       */
      inlineToolButton: 'ce-inline-tool',
      inlineToolButtonActive: 'ce-inline-tool--active',

      /**
       * UI元素
       */
      input: 'cdx-input',
      loader: 'cdx-loader',
      button: 'cdx-button',

      /**
       * 设置按钮样式
       */
      settingsButton: 'cdx-settings-button',
      settingsButtonActive: 'cdx-settings-button--active',
    };
  }
}
