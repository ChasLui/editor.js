import Module from '../__module';

/**
 * 使用外部软件包模块进行通知
 *
 * @see https://github.com/codex-team/js-notifier
 */
import notifier, { ConfirmNotifierOptions, NotifierOptions, PromptNotifierOptions } from 'codex-notifier';

/**
 * 通知模块
 */
export default class Notifier extends Module {
  /**
   * 显示网页通知
   *
   * @param {NotifierOptions | ConfirmNotifierOptions | PromptNotifierOptions} options - 通知选项
   */
  public show(options: NotifierOptions | ConfirmNotifierOptions | PromptNotifierOptions): void {
    notifier.show(options);
  }
}
