/**
 * Editor.js Saver
 *
 * @module Saver
 * @author Codex Team
 * @version 2.0.0
 */
import Module from '../__module';
import { OutputData } from '../../../types';
import { ValidatedData } from '../../../types/data-formats';
import Block from '../block';
import * as _ from '../utils';

declare const VERSION: string;

/**
 * @classdesc 该方法以异步方式减少所有块，并调用块的save方法来提取数据
 *
 * @typedef {Saver} Saver
 * @property {Element} html - 编辑器 HTML 内容
 * @property {string} json - 编辑器 JSON 输出
 */
export default class Saver extends Module {
  /**
   * 组成新的 Promises 链以交替触发他们
   *
   * @returns {OutputData}
   */
  public async save(): Promise<OutputData> {
    const { BlockManager, Sanitizer, ModificationsObserver } = this.Editor;
    const blocks = BlockManager.blocks,
        chainData = [];

    /**
     * 保存时禁用修改 modifications observe
     */
    ModificationsObserver.disable();

    try {
      blocks.forEach((block: Block) => {
        chainData.push(this.getSavedData(block));
      });

      const extractedData = await Promise.all(chainData);
      const sanitizedData = await Sanitizer.sanitizeBlocks(extractedData);

      return this.makeOutput(sanitizedData);
    } finally {
      ModificationsObserver.enable();
    }
  }

  /**
   * 校验并保存
   *
   * @param {Block} block - Editor's Tool
   * @returns {ValidatedData} - Tool's 校验后数据
   */
  private async getSavedData(block: Block): Promise<ValidatedData> {
    const blockData = await block.save();
    const isValid = blockData && await block.validate(blockData.data);

    return {
      ...blockData,
      isValid,
    };
  }

  /**
   * 使用保存的数据，时间戳和编辑器版本创建输出对象
   *
   * @param {ValidatedData} allExtractedData - 从块中提取的数据
   * @returns {OutputData}
   */
  private makeOutput(allExtractedData): OutputData {
    let totalTime = 0;
    const blocks = [];

    _.log('[Editor.js saving]:', 'groupCollapsed');

    allExtractedData.forEach(({ tool, data, time, isValid }) => {
      totalTime += time;

      /**
       * 大写工具名称
       */
      _.log(`${tool.charAt(0).toUpperCase() + tool.slice(1)}`, 'group');

      if (isValid) {
        /** Group process info */
        _.log(data);
        _.log(undefined, 'groupEnd');
      } else {
        _.log(`Block «${tool}» skipped because saved data is invalid`);
        _.log(undefined, 'groupEnd');

        return;
      }

      /** 如果它是存根块，获取原始数据 */
      if (tool === this.Editor.Tools.stubTool) {
        blocks.push(data);

        return;
      }

      blocks.push({
        type: tool,
        data,
      });
    });

    _.log('Total', 'log', totalTime);
    _.log(undefined, 'groupEnd');

    return {
      time: +new Date(),
      blocks,
      version: VERSION,
    };
  }
}
