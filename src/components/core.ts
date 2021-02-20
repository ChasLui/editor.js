import $ from './dom';
import * as _ from './utils';
import { EditorConfig, OutputData, SanitizerConfig } from '../../types';
import { EditorModules } from '../types-internal/editor-modules';
import I18n from './i18n';
import { CriticalError } from './errors/critical';

/**
 * @typedef {Core} Core - 编辑器核心类
 */

/**
 * 要求编辑器模块放置在 components/modules 目录中
 */
const contextRequire = require.context('./modules', true);

const modules = [];

contextRequire.keys().forEach((filename) => {
  /**
   * 如果包含文件:
   * - 扩展名为 .js 或者 .ts
   * - 不是以下划线(_)开头的
   */
  if (filename.match(/^\.\/[^_][\w/]*\.([tj])s$/)) {
    modules.push(contextRequire(filename));
  }
});

/**
 * @class Core
 *
 * @classdesc Editor.js 核心类
 *
 * @property {EditorConfig} config - 所有设置
 * @property {EditorModules} moduleInstances - 构造的编辑器组件
 *
 * @type {Core}
 */
export default class Core {
  /**
   * 用户将编辑器配置传递给构造函数
   */
  public config: EditorConfig;

  /**
   * 核心模块实例的对象
   */
  public moduleInstances: EditorModules = {} as EditorModules;

  /**
   * 当所有核心模块都准备好并在页面上渲染 UI 时 resolve 的 Promise
   */
  public isReady: Promise<void>;

  /**
   * @param {EditorConfig} config - 用户配置对象
   *
   */
  constructor(config?: EditorConfig|string) {
    /**
     * 准备就绪的 Promise。resolve 是否 editor.js 准备工作，否则 reject
     */
    let onReady, onFail;

    this.isReady = new Promise((resolve, reject) => {
      onReady = resolve;
      onFail = reject;
    });

    Promise.resolve()
      .then(async () => {
        this.configuration = config;

        await this.validate();
        await this.init();
        await this.start();

        _.logLabeled('I\'m ready! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', 'log', '', 'color: #E24A75');

        setTimeout(async () => {
          await this.render();

          if ((this.configuration as EditorConfig).autofocus) {
            const { BlockManager, Caret } = this.moduleInstances;

            Caret.setToBlock(BlockManager.blocks[0], Caret.positions.START);
            BlockManager.highlightCurrentNode();
          }

          /**
           * 删除加载程序，显示内容
           */
          this.moduleInstances.UI.removeLoader();

          /**
           * Resolve this.isReady promise
           */
          onReady();
        }, 500);
      })
      .catch((error) => {
        _.log(`Editor.js is not ready because of ${error}`, 'error');

        /**
         * Reject this.isReady promise
         */
        onFail(error);
      });
  }

  /**
   * 设置配置
   *
   * @param {EditorConfig|string} config - 编辑器的配置设置
   */
  public set configuration(config: EditorConfig|string) {
    /**
     * 处理零配置或仅使用holderId
     * 制作配置对象
     */
    if (!_.isObject(config)) {
      config = {
        holder: config,
      };
    }

    /**
     * 如果预先设置了 holderId，则将其分配给 holder 属性，然后仅与 holder 一起工作
     */
    _.deprecationAssert(!!config.holderId, 'config.holderId', 'config.holder');
    if (config.holderId && !config.holder) {
      config.holder = config.holderId;
      config.holderId = null;
    }

    /**
     * 将配置放入类属性
     *
     * @type {EditorConfig}
     */
    this.config = config;

    /**
     * 如果holder为空，则设置默认值
     */
    if (this.config.holder == null) {
      this.config.holder = 'editorjs';
    }

    if (!this.config.logLevel) {
      this.config.logLevel = _.LogLevels.VERBOSE;
    }

    _.setLogLevel(this.config.logLevel);

    /**
     * 如果未传递默认的块工具，则使用段落工具
     */
    _.deprecationAssert(Boolean(this.config.initialBlock), 'config.initialBlock', 'config.defaultBlock');
    this.config.defaultBlock = this.config.defaultBlock || this.config.initialBlock || 'paragraph';

    /**
     * 编辑器底部区域的高度，可用于将焦点放在最后一块
     *
     * @type {number}
     */
    this.config.minHeight = this.config.minHeight !== undefined ? this.config.minHeight : 300;

    /**
     * 默认块类型
     * 在没有通过 Block 的情况下使用
     *
     * @type {{type: (*), data: {text: null}}}
     */
    const defaultBlockData = {
      type: this.config.defaultBlock,
      data: {},
    };

    this.config.placeholder = this.config.placeholder || false;
    this.config.sanitizer = this.config.sanitizer || {
      p: true,
      b: true,
      a: true,
    } as SanitizerConfig;

    this.config.hideToolbar = this.config.hideToolbar ? this.config.hideToolbar : false;
    this.config.tools = this.config.tools || {};
    this.config.i18n = this.config.i18n || {};
    this.config.data = this.config.data || {} as OutputData;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.config.onReady = this.config.onReady || ((): void => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.config.onChange = this.config.onChange || ((): void => {});
    this.config.inlineToolbar = this.config.inlineToolbar !== undefined ? this.config.inlineToolbar : true;

    /**
     * 初始化默认块以将数据传递到渲染器
     */
    if (_.isEmpty(this.config.data)) {
      this.config.data = {} as OutputData;
      this.config.data.blocks = [ defaultBlockData ];
    } else {
      if (!this.config.data.blocks || this.config.data.blocks.length === 0) {
        this.config.data.blocks = [ defaultBlockData ];
      }
    }

    this.config.readOnly = this.config.readOnly as boolean || false;

    /**
     * 适配 i18n
     */
    if (config.i18n?.messages) {
      I18n.setDictionary(config.i18n.messages);
    }

    /**
     * 文字方向。 如果未设置，则使用 ltr
     */
    this.config.i18n.direction = config.i18n?.direction || 'ltr';
  }

  /**
   * 返回私有属性
   *
   * @returns {EditorConfig}
   */
  public get configuration(): EditorConfig|string {
    return this.config;
  }

  /**
   * 检查编辑器配置中的必填字段
   *
   * @returns {Promise<void>}
   */
  public async validate(): Promise<void> {
    const { holderId, holder } = this.config;

    if (holderId && holder) {
      throw Error('«holderId» and «holder» param can\'t assign at the same time.');
    }

    /**
     * 检查holder元素的存在
     */
    if (_.isString(holder) && !$.get(holder)) {
      throw Error(`element with ID «${holder}» is missing. Pass correct holder's ID.`);
    }

    if (holder && _.isObject(holder) && !$.isElement(holder)) {
      throw Error('«holder» value must be an Element node');
    }
  }

  /**
   * 初始化模块:
   *  - 制作并保存实例
   *  - 配置
   */
  public init(): void {
    /**
     * 制作模块实例并将其保存到 @property this.moduleInstances
     */
    this.constructModules();

    /**
     * 模块配置
     */
    this.configureModules();
  }

  /**
   * 启动编辑器!
   *
   * 获取需要准备的模块列表并返回一个序列 (Promise)
   *
   * @returns {Promise<void>}
   */
  public async start(): Promise<void> {
    const modulesToPrepare = [
      'Tools',
      'UI',
      'BlockManager',
      'Paste',
      'BlockSelection',
      'RectangleSelection',
      'CrossBlockSelection',
      'ReadOnly',
    ];

    await modulesToPrepare.reduce(
      (promise, module) => promise.then(async () => {
        // _.log(`Preparing ${module} module`, 'time');

        try {
          await this.moduleInstances[module].prepare();
        } catch (e) {
          /**
           * 不会捕获CriticalError
           * 当Editor使用不支持的插件以只读模式渲染时使用它
           */
          if (e instanceof CriticalError) {
            throw new Error(e.message);
          }
          _.log(`Module ${module} was skipped because of %o`, 'warn', e);
        }
        // _.log(`Preparing ${module} module`, 'timeEnd');
      }),
      Promise.resolve()
    );
  }

  /**
   * 渲染初始数据
   */
  private render(): Promise<void> {
    return this.moduleInstances.Renderer.render(this.config.data.blocks);
  }

  /**
   * 制作模块实例并将其保存到 @property this.moduleInstances
   */
  private constructModules(): void {
    modules.forEach((module) => {
      /**
       * 如果模块具有非默认导出，则传递的对象将包含所有默认导出，并且默认导出为'default'属性
       */
      const Module = _.isFunction(module) ? module : module.default;

      try {
        /**
         * 我们使用 displayName 属性提供的类名
         *
         * 在构建时，Babel会将所有类转换为函数，因此名称始终为'Function'
         * 为了防止这种情况，我们使用'babel-plugin-class-display-name'插件
         *
         * @see  https://www.npmjs.com/package/babel-plugin-class-display-name
         */
        this.moduleInstances[Module.displayName] = new Module({
          config: this.configuration,
        });
      } catch (e) {
        _.log(`Module ${Module.displayName} skipped because`, 'warn', e);
      }
    });
  }

  /**
   * 模块实例配置:
   *  - 将其他模块传递给'state'属性
   *  - ...
   */
  private configureModules(): void {
    for (const name in this.moduleInstances) {
      if (Object.prototype.hasOwnProperty.call(this.moduleInstances, name)) {
        /**
         * 模块不需要自我实例
         */
        this.moduleInstances[name].state = this.getModulesDiff(name);
      }
    }
  }

  /**
   * 返回没有传递名称的模块
   *
   * @param {string} name - 对于模块，需要计算模块间的差异 
   */
  private getModulesDiff(name: string): EditorModules {
    const diff = {} as EditorModules;

    for (const moduleName in this.moduleInstances) {
      /**
       * 跳过带有传递名称的模块
       */
      if (moduleName === name) {
        continue;
      }
      diff[moduleName] = this.moduleInstances[moduleName];
    }

    return diff;
  }
}
