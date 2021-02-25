import Module from '../__module';
import $ from '../dom';
import * as _ from '../utils';
import {
  BlockTool,
  BlockToolConstructable,
  PasteConfig,
  PasteEvent,
  PasteEventDetail
} from '../../../types';
import Block from '../block';
import { SavedData } from '../../../types/data-formats';

/**
 * 标签替代对象。
 */
interface TagSubstitute {
  /**
   * 相关工具的名称
   *
   * @type {string}
   */
  tool: string;
}

/**
 * 模式替代对象。
 */
interface PatternSubstitute {
  /**
   * 模式键
   *
   * @type {string}
   */
  key: string;

  /**
   * 模式正则
   *
   * @type {RegExp}
   */
  pattern: RegExp;

  /**
   * 相关工具的名称
   *
   * @type {string}
   */
  tool: string;
}

/**
 * 文件的类型替换对象。
 */
interface FilesSubstitution {
  /**
   * 文件扩展名数组工具可以处理
   *
   * @type {string[]}
   */
  extensions: string[];

  /**
   * MIME类型数组工具可以处理
   *
   * @type {string[]}
   */
  mimeTypes: string[];
}

/**
 * 已处理的粘贴数据对象。
 *
 * @interface PasteData
 */
interface PasteData {
  /**
   * 相关工具的名称
   *
   * @type {string}
   */
  tool: string;

  /**
   * 粘贴数据。处理并包装为 HTML 元素
   *
   * @type {HTMLElement}
   */
  content: HTMLElement;

  /**
   * 粘贴后的数据
   */
  event: PasteEvent;

  /**
   * 如果内容应作为新块插入，则为 True
   *
   * @type {boolean}
   */
  isBlock: boolean;
}

/**
 * @class 粘贴
 * @classdesc 包含在编辑器上处理粘贴的方法
 *
 * @module Paste
 *
 * @version 2.0.0
 */
export default class Paste extends Module {
  /** 如果字符串的长度大于这个数字，我们不检查粘贴模式 */
  public static readonly PATTERN_PROCESSING_MAX_LENGTH = 450;

  /** 自定义EditorJS mime-type处理编辑器中的复制/粘贴操作 */
  public readonly MIME_TYPE = 'application/x-editor-js';

  /**
   * 标签的替代参数
   */
  private toolsTags: {[tag: string]: TagSubstitute} = {};

  /**
   * 存储标签以替换工具名称
   */
  private tagsByTool: {[tools: string]: string[]} = {};

  /** 模式的替换参数 */
  private toolsPatterns: PatternSubstitute[] = [];

  /** 文件的替换参数 */
  private toolsFiles: {
    [tool: string]: FilesSubstitution;
  } = {};

  /**
   * 不需要粘贴处理的工具列表
   */
  private exceptionList: string[] = [];

  /**
   * 设置 onPaste 回调并收集工具的粘贴配置
   */
  public async prepare(): Promise<void> {
    this.processTools();
  }

  /**
   * 设置只读状态
   *
   * @param {boolean} readOnlyEnabled - 只读标志值
   */
  public toggleReadOnly(readOnlyEnabled: boolean): void {
    if (!readOnlyEnabled) {
      this.setCallback();
    } else {
      this.unsetCallback();
    }
  }

  /**
   * 处理粘贴或删除的数据传输对象
   *
   * @param {DataTransfer} dataTransfer - 粘贴或删除的数据传输对象
   * @param {boolean} isDragNDrop - 如果数据传输来自拖放事件，则为true
   */
  public async processDataTransfer(dataTransfer: DataTransfer, isDragNDrop = false): Promise<void> {
    const { Sanitizer } = this.Editor;

    const types = dataTransfer.types;

    /**
     * 在Microsoft Edge中，类型为DOMStringList。 因此，“包含”用于检查是否包含“文件”类型
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const includesFiles = types.includes ? types.includes('Files') : (types as any).contains('Files');

    if (includesFiles) {
      await this.processFiles(dataTransfer.files);

      return;
    }

    const editorJSData = dataTransfer.getData(this.MIME_TYPE);
    const plainData = dataTransfer.getData('text/plain');
    let htmlData = dataTransfer.getData('text/html');

    /**
     * 如果传递了 EditorJS json，则将其插入
     */
    if (editorJSData) {
      try {
        this.insertEditorJSData(JSON.parse(editorJSData));

        return;
      } catch (e) {} // 如果出现错误，什么也不做并继续执行
    }

    /**
     *  如果文本被拖放，则用P标记对内容进行换行，将其作为新块插入
     */
    if (isDragNDrop && plainData.trim() && htmlData.trim()) {
      htmlData = '<p>' + (htmlData.trim() ? htmlData : plainData) + '</p>';
    }

    /** 添加所有可以替换为消毒剂配置的标签 */
    const toolsTags = Object.keys(this.toolsTags).reduce((result, tag) => {
      result[tag.toLowerCase()] = true;

      return result;
    }, {});

    const customConfig = Object.assign({}, toolsTags, Sanitizer.getAllInlineToolsConfig(), { br: {} });

    const cleanData = Sanitizer.clean(htmlData, customConfig);

    /** 如果没有 HTML 或 HTML 字符串等于纯文本，则将其作为纯文本处理 */
    if (!cleanData.trim() || cleanData.trim() === plainData || !$.isHTMLString(cleanData)) {
      await this.processText(plainData);
    } else {
      await this.processText(cleanData, true);
    }
  }

  /**
   * 处理粘贴的文本并将其分成块
   *
   * @param {string} data - 要处理的文字。 可以是 HTML 或纯文本。
   * @param {boolean} isHTML - 如果传递的字符串是 HTML，这个参数应该是 true
   */
  public async processText(data: string, isHTML = false): Promise<void> {
    const { Caret, BlockManager, Tools } = this.Editor;
    const dataToInsert = isHTML ? this.processHTML(data) : this.processPlain(data);

    if (!dataToInsert.length) {
      return;
    }

    if (dataToInsert.length === 1) {
      if (!dataToInsert[0].isBlock) {
        this.processInlinePaste(dataToInsert.pop());
      } else {
        this.processSingleBlock(dataToInsert.pop());
      }

      return;
    }

    const isCurrentBlockDefault = BlockManager.currentBlock && Tools.isDefault(BlockManager.currentBlock.tool);
    const needToReplaceCurrentBlock = isCurrentBlockDefault && BlockManager.currentBlock.isEmpty;

    dataToInsert.map(
      async (content, i) => this.insertBlock(content, i === 0 && needToReplaceCurrentBlock)
    );

    if (BlockManager.currentBlock) {
      Caret.setToBlock(BlockManager.currentBlock, Caret.positions.END);
    }
  }

  /**
   * 设置 onPaste 回调处理程序
   */
  private setCallback(): void {
    const { Listeners } = this.Editor;

    Listeners.on(this.Editor.UI.nodes.holder, 'paste', this.handlePasteEvent);
  }

  /**
   * 取消设置 onPaste 回调处理程序
   */
  private unsetCallback(): void {
    const { Listeners } = this.Editor;

    Listeners.off(this.Editor.UI.nodes.holder, 'paste', this.handlePasteEvent);
  }

  /**
   * 获取并处理工具的粘贴配置
   */
  private processTools(): void {
    const tools = this.Editor.Tools.blockTools;

    Object.entries(tools).forEach(this.processTool);
  }

  /**
   * 为每个工具处理粘贴配置
   */
  private processTool = ([name, tool]: [string, BlockToolConstructable]): void => {
    try {
      const toolInstance = new this.Editor.Tools.blockTools[name]({
        api: this.Editor.API.getMethodsForTool(name),
        config: {},
        data: {},
        readOnly: false,
      }) as BlockTool;

      if (tool.pasteConfig === false) {
        this.exceptionList.push(name);

        return;
      }

      if (!_.isFunction(toolInstance.onPaste)) {
        return;
      }

      const toolPasteConfig = tool.pasteConfig || {};

      this.getTagsConfig(name, toolPasteConfig);
      this.getFilesConfig(name, toolPasteConfig);
      this.getPatternsConfig(name, toolPasteConfig);
    } catch (e) {
      _.log(
        `Paste handling for «${name}» Tool hasn't been set up because of the error`,
        'warn',
        e
      );
    }
  }

  /**
   * 获取标签以替换为工具
   *
   * @param {string} name - 工具名称
   * @param {PasteConfig} toolPasteConfig - 工具 onPaste 配置
   */
  private getTagsConfig(name: string, toolPasteConfig: PasteConfig): void {
    const tags = toolPasteConfig.tags || [];

    tags.forEach((tag) => {
      if (Object.prototype.hasOwnProperty.call(this.toolsTags, tag)) {
        _.log(
          `Paste handler for «${name}» Tool on «${tag}» tag is skipped ` +
          `because it is already used by «${this.toolsTags[tag].tool}» Tool.`,
          'warn'
        );

        return;
      }

      this.toolsTags[tag.toUpperCase()] = {
        tool: name,
      };
    });

    this.tagsByTool[name] = tags.map((t) => t.toUpperCase());
  }

  /**
   * 获取文件的类型和扩展名以用工具替代
   *
   * @param {string} name - 工具名称
   * @param {PasteConfig} toolPasteConfig - 工具 onPaste 配置
   */
  private getFilesConfig(name: string, toolPasteConfig: PasteConfig): void {
    const { files = {} } = toolPasteConfig;
    let { extensions, mimeTypes } = files;

    if (!extensions && !mimeTypes) {
      return;
    }

    if (extensions && !Array.isArray(extensions)) {
      _.log(`«extensions» property of the onDrop config for «${name}» Tool should be an array`);
      extensions = [];
    }

    if (mimeTypes && !Array.isArray(mimeTypes)) {
      _.log(`«mimeTypes» property of the onDrop config for «${name}» Tool should be an array`);
      mimeTypes = [];
    }

    if (mimeTypes) {
      mimeTypes = mimeTypes.filter((type) => {
        if (!_.isValidMimeType(type)) {
          _.log(`MIME type value «${type}» for the «${name}» Tool is not a valid MIME type`, 'warn');

          return false;
        }

        return true;
      });
    }

    this.toolsFiles[name] = {
      extensions: extensions || [],
      mimeTypes: mimeTypes || [],
    };
  }

  /**
   * 获取 RegExp 模式以用工具替代
   *
   * @param {string} name - 工具名称
   * @param {PasteConfig} toolPasteConfig - 工具 onPaste 配置
   */
  private getPatternsConfig(name: string, toolPasteConfig: PasteConfig): void {
    if (!toolPasteConfig.patterns || _.isEmpty(toolPasteConfig.patterns)) {
      return;
    }

    Object.entries(toolPasteConfig.patterns).forEach(([key, pattern]: [string, RegExp]) => {
      /** 仍然需要验证用户提供的模式 */
      if (!(pattern instanceof RegExp)) {
        _.log(
          `Pattern ${pattern} for «${name}» Tool is skipped because it should be a Regexp instance.`,
          'warn'
        );
      }

      this.toolsPatterns.push({
        key,
        pattern,
        tool: name,
      });
    });
  }

  /**
   * 检查浏览器的行为是否更适合
   *
   * @param {EventTarget} element - 粘贴内容的元素
   *
   * @returns {boolean}
   */
  private isNativeBehaviour(element: EventTarget): boolean {
    return $.isNativeInput(element);
  }

  /**
   * 检查编辑器是否应处理粘贴的数据并将数据传输对象传递给处理程序
   *
   * @param {ClipboardEvent} event - clipboard event
   */
  private handlePasteEvent = async (event: ClipboardEvent): Promise<void> => {
    const { BlockManager, Toolbar } = this.Editor;

    /** 如果目标是本机输入或不是阻止，请使用浏览器行为 */
    if (
      !BlockManager.currentBlock || (this.isNativeBehaviour(event.target) && !event.clipboardData.types.includes('Files'))
    ) {
      return;
    }

    /**
     * 如果工具在错误列表中，请跳过粘贴事件的处理
     */
    if (BlockManager.currentBlock && this.exceptionList.includes(BlockManager.currentBlock.name)) {
      return;
    }

    event.preventDefault();
    this.processDataTransfer(event.clipboardData);

    BlockManager.clearFocused();
    Toolbar.close();
  }

  /**
   * 从数据传输对象获取文件并插入相关工具
   *
   * @param {FileList} items - pasted or dropped items
   */
  private async processFiles(items: FileList): Promise<void> {
    const { BlockManager, Tools } = this.Editor;

    let dataToInsert: Array<{type: string; event: PasteEvent}>;

    dataToInsert = await Promise.all(
      Array
        .from(items)
        .map((item) => this.processFile(item))
    );
    dataToInsert = dataToInsert.filter((data) => !!data);

    const isCurrentBlockDefault = Tools.isDefault(BlockManager.currentBlock.tool);
    const needToReplaceCurrentBlock = isCurrentBlockDefault && BlockManager.currentBlock.isEmpty;

    dataToInsert.forEach(
      (data, i) => {
        BlockManager.paste(data.type, data.event, i === 0 && needToReplaceCurrentBlock);
      }
    );
  }

  /**
   * 获取有关文件的信息并找到用于处理文件的工具
   *
   * @param {File} file - file to process
   */
  private async processFile(file: File): Promise<{event: PasteEvent; type: string}> {
    const extension = _.getFileExtension(file);

    const foundConfig = Object
      .entries(this.toolsFiles)
      .find(([toolName, { mimeTypes, extensions } ]) => {
        const [fileType, fileSubtype] = file.type.split('/');

        const foundExt = extensions.find((ext) => ext.toLowerCase() === extension.toLowerCase());
        const foundMimeType = mimeTypes.find((mime) => {
          const [type, subtype] = mime.split('/');

          return type === fileType && (subtype === fileSubtype || subtype === '*');
        });

        return !!foundExt || !!foundMimeType;
      });

    if (!foundConfig) {
      return;
    }

    const [ tool ] = foundConfig;
    const pasteEvent = this.composePasteEvent('file', {
      file,
    });

    return {
      event: pasteEvent,
      type: tool,
    };
  }

  /**
   * 将 HTML 字符串拆分为块，并将其作为块数据数组返回
   *
   * @param {string} innerHTML - 待处理的 html 字符串
   *
   * @returns {PasteData[]}
   */
  private processHTML(innerHTML: string): PasteData[] {
    const { Tools, Sanitizer } = this.Editor;
    const initialTool = this.config.defaultBlock;
    const wrapper = $.make('DIV');

    wrapper.innerHTML = innerHTML;

    const nodes = this.getNodes(wrapper);

    return nodes
      .map((node) => {
        let content, tool = initialTool, isBlock = false;

        switch (node.nodeType) {
          /** 如果 node 是文档片段，请使用临时包装器获取 innerHTML */
          case Node.DOCUMENT_FRAGMENT_NODE:
            content = $.make('div');
            content.appendChild(node);
            break;

          /** 如果 node 是元素，则可能存在替换 */
          case Node.ELEMENT_NODE:
            content = node as HTMLElement;
            isBlock = true;

            if (this.toolsTags[content.tagName]) {
              tool = this.toolsTags[content.tagName].tool;
            }
            break;
        }

        const { tags } = Tools.blockTools[tool].pasteConfig as PasteConfig;

        const toolTags = tags.reduce((result, tag) => {
          result[tag.toLowerCase()] = {};

          return result;
        }, {});
        const customConfig = Object.assign({}, toolTags, Sanitizer.getInlineToolsConfig(tool));

        content.innerHTML = Sanitizer.clean(content.innerHTML, customConfig);

        const event = this.composePasteEvent('tag', {
          data: content,
        });

        return {
          content,
          isBlock,
          tool,
          event,
        };
      })
      .filter((data) => !$.isNodeEmpty(data.content) || $.isSingleTag(data.content));
  }

  /**
   * 用新的线符号分割纯文本，并将其作为块数据数组返回
   *
   * @param {string} plain - 待处理字符串
   *
   * @returns {PasteData[]}
   */
  private processPlain(plain: string): PasteData[] {
    const { defaultBlock } = this.config as {defaultBlock: string};

    if (!plain) {
      return [];
    }

    const tool = defaultBlock;

    return plain
      .split(/\r?\n/)
      .filter((text) => text.trim())
      .map((text) => {
        const content = $.make('div');

        content.textContent = text;

        const event = this.composePasteEvent('tag', {
          data: content,
        });

        return {
          content,
          tool,
          isBlock: false,
          event,
        };
      });
  }

  /**
   * 处理单个块工具内容的粘贴
   *
   * @param {PasteData} dataToInsert - 块插入数据
   */
  private async processSingleBlock(dataToInsert: PasteData): Promise<void> {
    const { Caret, BlockManager, Tools } = this.Editor;
    const { currentBlock } = BlockManager;

    /**
     * 如果粘贴的工具不等于当前块，或者粘贴的内容包含块元素，则将其插入为新的块
     */
    if (
      !currentBlock ||
      dataToInsert.tool !== currentBlock.name ||
      !$.containsOnlyInlineElements(dataToInsert.content.innerHTML)
    ) {
      this.insertBlock(dataToInsert, currentBlock && Tools.isDefault(currentBlock.tool) && currentBlock.isEmpty);

      return;
    }

    Caret.insertContentAtCaretPosition(dataToInsert.content.innerHTML);
  }

  /**
   * 处理粘贴到单个块：
   * 1. 查找模式的匹配项
   * 2. 如果与当前块类型不同，则插入新块
   * 3. 如果没有替代，只需插入文本
   *
   * @param {PasteData} dataToInsert - 插入块的数据
   */
  private async processInlinePaste(dataToInsert: PasteData): Promise<void> {
    const { BlockManager, Caret, Sanitizer, Tools } = this.Editor;
    const { content } = dataToInsert;

    const currentBlockIsDefault = BlockManager.currentBlock && Tools.isDefault(BlockManager.currentBlock.tool);

    if (currentBlockIsDefault && content.textContent.length < Paste.PATTERN_PROCESSING_MAX_LENGTH) {
      const blockData = await this.processPattern(content.textContent);

      if (blockData) {
        const needToReplaceCurrentBlock = BlockManager.currentBlock &&
          Tools.isDefault(BlockManager.currentBlock.tool) &&
          BlockManager.currentBlock.isEmpty;

        const insertedBlock = BlockManager.paste(blockData.tool, blockData.event, needToReplaceCurrentBlock);

        Caret.setToBlock(insertedBlock, Caret.positions.END);

        return;
      }
    }

    /** 如果没有模式替换-按原样插入字符串 */
    if (BlockManager.currentBlock && BlockManager.currentBlock.currentInput) {
      const currentToolSanitizeConfig = Sanitizer.getInlineToolsConfig(BlockManager.currentBlock.name);

      document.execCommand(
        'insertHTML',
        false,
        Sanitizer.clean(content.innerHTML, currentToolSanitizeConfig)
      );
    } else {
      this.insertBlock(dataToInsert);
    }
  }

  /**
   * 获取模式匹配
   *
   * @param {string} text - 待处理的文本
   *
   * @returns {Promise<{event: PasteEvent, tool: string}>}
   */
  private async processPattern(text: string): Promise<{event: PasteEvent; tool: string}> {
    const pattern = this.toolsPatterns.find((substitute) => {
      const execResult = substitute.pattern.exec(text);

      if (!execResult) {
        return false;
      }

      return text === execResult.shift();
    });

    if (!pattern) {
      return;
    }

    const event = this.composePasteEvent('pattern', {
      key: pattern.key,
      data: text,
    });

    return {
      event,
      tool: pattern.tool,
    };
  }

  /**
   * 插入粘贴块内容到编辑器
   *
   * @param {PasteData} data - 要插入的数据
   * @param {boolean} canReplaceCurrentBlock - 如果为 true 并且当前块为空，则将替换当前块
   *
   * @returns {void}
   */
  private insertBlock(data: PasteData, canReplaceCurrentBlock = false): void {
    const { BlockManager, Caret } = this.Editor;
    const { currentBlock } = BlockManager;
    let block: Block;

    if (canReplaceCurrentBlock && currentBlock && currentBlock.isEmpty) {
      block = BlockManager.paste(data.tool, data.event, true);
      Caret.setToBlock(block, Caret.positions.END);

      return;
    }

    block = BlockManager.paste(data.tool, data.event);

    Caret.setToBlock(block, Caret.positions.END);
  }

  /**
   * 插入作为 application/x-editor-js JSON 传递的数据
   *
   * @param {Array} blocks — 要插入的数据块
   *
   * @returns {void}
   */
  private insertEditorJSData(blocks: Array<Pick<SavedData, 'data' | 'tool'>>): void {
    const { BlockManager, Caret, Sanitizer, Tools } = this.Editor;
    const sanitizedBlocks = Sanitizer.sanitizeBlocks(blocks);

    sanitizedBlocks.forEach(({ tool, data }, i) => {
      let needToReplaceCurrentBlock = false;

      if (i === 0) {
        const isCurrentBlockDefault = BlockManager.currentBlock && Tools.isDefault(BlockManager.currentBlock.tool);

        needToReplaceCurrentBlock = isCurrentBlockDefault && BlockManager.currentBlock.isEmpty;
      }

      const block = BlockManager.insert({
        tool,
        data,
        replace: needToReplaceCurrentBlock,
      });

      Caret.setToBlock(block, Caret.positions.END);
    });
  }

  /**
   * 从元素节点获取节点
   *
   * @param {Node} node - 当前节点
   * @param {Node[]} nodes - 处理的节点
   * @param {Node} destNode - 目的节点
   *
   * @returns {Node[]}
   */
  private processElementNode(node: Node, nodes: Node[], destNode: Node): Node[] | void {
    const tags = Object.keys(this.toolsTags);

    const element = node as HTMLElement;

    const { tool = '' } = this.toolsTags[element.tagName] || {};
    const toolTags = this.tagsByTool[tool] || [];

    const isSubstitutable = tags.includes(element.tagName);
    const isBlockElement = $.blockElements.includes(element.tagName.toLowerCase());
    const containsAnotherToolTags = Array
      .from(element.children)
      .some(
        ({ tagName }) => tags.includes(tagName) && !toolTags.includes(tagName)
      );

    const containsBlockElements = Array.from(element.children).some(
      ({ tagName }) => $.blockElements.includes(tagName.toLowerCase())
    );

    /** 将内联元素附加到以前的片段 */
    if (!isBlockElement && !isSubstitutable && !containsAnotherToolTags) {
      destNode.appendChild(element);

      return [...nodes, destNode];
    }

    if (
      (isSubstitutable && !containsAnotherToolTags) ||
      (isBlockElement && !containsBlockElements && !containsAnotherToolTags)
    ) {
      return [...nodes, destNode, element];
    }
  }

  /**
   * 将 HTML 字符串递归地分为两种类型的节点：
   * 1. Block element
   * 2. Document Fragments 包含文本和标记标签 like a, b, i 等。
   *
   * @param {Node} wrapper - 粘贴 HTML 内容的包装器
   *
   * @returns {Node[]}
   */
  private getNodes(wrapper: Node): Node[] {
    const children = Array.from(wrapper.childNodes);
    let elementNodeProcessingResult: Node[] | void;

    const reducer = (nodes: Node[], node: Node): Node[] => {
      if ($.isEmpty(node) && !$.isSingleTag(node as HTMLElement)) {
        return nodes;
      }

      const lastNode = nodes[nodes.length - 1];

      let destNode: Node = new DocumentFragment();

      if (lastNode && $.isFragment(lastNode)) {
        destNode = nodes.pop();
      }

      switch (node.nodeType) {
        /**
         * 如果 node 是 HTML 元素:
         * 1. 检查它是否是内联元素
         * 2. 检查它是否包含另一个块或可替换元素
         */
        case Node.ELEMENT_NODE:
          elementNodeProcessingResult = this.processElementNode(node, nodes, destNode);

          if (elementNodeProcessingResult) {
            return elementNodeProcessingResult;
          }
          break;

        /**
         * 如果节点是文本节点，则用 DocumentFragment 包裹它
         */
        case Node.TEXT_NODE:
          destNode.appendChild(node);

          return [...nodes, destNode];

        default:
          return [...nodes, destNode];
      }

      return [...nodes, ...Array.from(node.childNodes).reduce(reducer, [])];
    };

    return children.reduce(reducer, []);
  }

  /**
   * 使用传递的类型和详细信息组合粘贴事件
   *
   * @param {string} type - 事件类型
   * @param {PasteEventDetail} detail - 事件详情
   */
  private composePasteEvent(type: string, detail: PasteEventDetail): PasteEvent {
    return new CustomEvent(type, {
      detail,
    }) as PasteEvent;
  }
}
