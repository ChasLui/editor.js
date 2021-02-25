import $ from '../../dom';
import { API, BlockTool, BlockToolData, BlockToolConstructorOptions } from '../../../../types';

export interface StubData extends BlockToolData {
  title: string;
  savedData: BlockToolData;
}

/**
 * 将显示该工具代替没有相应插件的块
 * 它将在内部存储数据，并通过文章保存将其传递回来
 */
export default class Stub implements BlockTool {
  /**
   * 通知核心该工具支持只读模式
   */
  public static isReadOnlySupported = true;

  /**
   * Stub 样式
   *
   * @type {{wrapper: string, info: string, title: string, subtitle: string}}
   */
  private CSS = {
    wrapper: 'ce-stub',
    info: 'ce-stub__info',
    title: 'ce-stub__title',
    subtitle: 'ce-stub__subtitle',
  };

  /**
   * 主 stub 包裹器
   */
  private readonly wrapper: HTMLElement;

  /**
   * Editor.js API
   */
  private readonly api: API;

  /**
   * Stub 标题 — tool name
   */
  private readonly title: string;

  /**
   * Stub 提示
   */
  private readonly subtitle: string;

  /**
   * 原始 Tool data
   */
  private readonly savedData: BlockToolData;

  /**
   * @param options - constructor options
   * @param options.data - stub tool data
   * @param options.api - Editor.js API
   */
  constructor({ data, api }: BlockToolConstructorOptions<StubData>) {
    this.api = api;
    this.title = data.title || this.api.i18n.t('Error');
    this.subtitle = this.api.i18n.t('The block can not be displayed correctly.');
    this.savedData = data.savedData;

    this.wrapper = this.make();
  }

  /**
   * 返回 stub holder
   *
   * @returns {HTMLElement}
   */
  public render(): HTMLElement {
    return this.wrapper;
  }

  /**
   * 返回原始 Tool data
   *
   * @returns {BlockToolData}
   */
  public save(): BlockToolData {
    return this.savedData;
  }

  /**
   * 创建工具 html 标签
   *
   * @returns {HTMLElement}
   */
  private make(): HTMLElement {
    const wrapper = $.make('div', this.CSS.wrapper);
    const icon = $.svg('sad-face', 52, 52);
    const infoContainer = $.make('div', this.CSS.info);
    const title = $.make('div', this.CSS.title, {
      textContent: this.title,
    });
    const subtitle = $.make('div', this.CSS.subtitle, {
      textContent: this.subtitle,
    });

    wrapper.appendChild(icon);

    infoContainer.appendChild(title);
    infoContainer.appendChild(subtitle);

    wrapper.appendChild(infoContainer);

    return wrapper;
  }
}
