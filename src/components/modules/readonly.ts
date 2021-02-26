import Module from '../__module';
import { CriticalError } from '../errors/critical';

/**
 * @module ReadOnly
 *
 * 有一个重要的方法：
 *    - {Function} toggleReadonly - 设置只读模式或切换当前状态设置只读模式或切换当前状态
 *
 * @version 1.0.0
 *
 * @typedef {ReadOnly} ReadOnly
 * @property {boolean} readOnlyEnabled - 只读状态
 */
export default class ReadOnly extends Module {
  /**
   * 不支持只读模式的工具名称数组
   */
  private toolsDontSupportReadOnly: string[] = [];

  /**
   * 用于跟踪只读状态的值
   *
   * @type {boolean}
   */
  private readOnlyEnabled = false;

  /**
   * 返回只读模式的状态
   */
  public get isEnabled(): boolean {
    return this.readOnlyEnabled;
  }

  /**
   * 设置初始状态
   */
  public async prepare(): Promise<void> {
    const { Tools } = this.Editor;
    const { blockTools } = Tools;
    const toolsDontSupportReadOnly: string[] = [];

    Object.entries(blockTools).forEach(([name, tool]) => {
      if (!Tools.isReadOnlySupported(tool)) {
        toolsDontSupportReadOnly.push(name);
      }
    });

    this.toolsDontSupportReadOnly = toolsDontSupportReadOnly;

    if (this.config.readOnly && toolsDontSupportReadOnly.length > 0) {
      this.throwCriticalError();
    }

    this.toggle(this.config.readOnly);
  }

  /**
   * 设置只读模式或切换当前状态设置只读模式或切换当前状态
   * 调用所有模块的 `toggleReadOnly` 方法并重新渲染编辑器
   *
   * @param {boolean} state - (optional) 只读状态或切换
   */
  public async toggle(state = !this.readOnlyEnabled): Promise<boolean> {
    if (state && this.toolsDontSupportReadOnly.length > 0) {
      this.throwCriticalError();
    }

    const oldState = this.readOnlyEnabled;

    this.readOnlyEnabled = state;

    for (const name in this.Editor) {
      /**
       * 验证模块是否具有方法`toggleReadOnly`
       */
      if (!this.Editor[name].toggleReadOnly) {
        continue;
      }

      /**
       * 设置或切换只读状态
       */
      this.Editor[name].toggleReadOnly(state);
    }

    /**
     * 如果新状态等于旧状态，请不要重新渲染块
     */
    if (oldState === state) {
      return this.readOnlyEnabled;
    }

    /**
     * 保存当前的编辑器块并再次渲染
     */
    const savedBlocks = await this.Editor.Saver.save();

    await this.Editor.BlockManager.clear();
    await this.Editor.Renderer.render(savedBlocks.blocks);

    return this.readOnlyEnabled;
  }

  /**
   * 抛出一个关于不支持只读模式的工具的错误
   */
  private throwCriticalError(): never {
    throw new CriticalError(
      `To enable read-only mode all connected tools should support it. Tools ${this.toolsDontSupportReadOnly.join(', ')} don't support read-only mode.`
    );
  }
}
