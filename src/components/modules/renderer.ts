import Module from '../__module';
import * as _ from '../utils';
import { BlockToolConstructable, OutputBlockData } from '../../../types';

/**
 * Editor.js 渲染器模块
 *
 * @module Renderer
 * @author CodeX Team
 *
 * @version 2.0.0
 */
export default class Renderer extends Module {
  /**
   * @typedef {object} RendererBlocks
   * @property {string} type - tool name
   * @property {object} data - tool data
   */

  /**
   * @example
   *
   * blocks: [
   *   {
   *     type : 'paragraph',
   *     data : {
   *       text : 'Hello from Codex!'
   *     }
   *   },
   *   {
   *     type : 'paragraph',
   *     data : {
   *       text : 'Leave feedback if you like it!'
   *     }
   *   },
   * ]
   *
   */

  /**
   * 根据插件数据数组制作插件块
   *
   * @param {OutputBlockData[]} blocks - 渲染块
   */
  public async render(blocks: OutputBlockData[]): Promise<void> {
    const chainData = blocks.map((block) => ({ function: (): Promise<void> => this.insertBlock(block) }));

    const sequence = await _.sequence(chainData as _.ChainData[]);

    this.Editor.UI.checkEmptiness();

    return sequence;
  }

  /**
   * 获取插件实例
   * 添加插件实例到 BlockManager
   * 将块插入工作区
   *
   * @param {object} item - 要插入的块数据
   *
   * @returns {Promise<void>}
   */
  public async insertBlock(item: OutputBlockData): Promise<void> {
    const { Tools, BlockManager } = this.Editor;
    const tool = item.type;
    const data = item.data;

    if (tool in Tools.available) {
      try {
        BlockManager.insert({
          tool,
          data,
        });
      } catch (error) {
        _.log(`Block «${tool}» skipped because of plugins error`, 'warn', data);
        throw Error(error);
      }
    } else {
      /** 如果工具不可用，请为其创建存根块 */
      const stubData = {
        savedData: {
          type: tool,
          data,
        },
        title: tool,
      };

      if (tool in Tools.unavailable) {
        const toolToolboxSettings = (Tools.unavailable[tool] as BlockToolConstructable).toolbox;
        const userToolboxSettings = Tools.getToolSettings(tool).toolbox;

        stubData.title = toolToolboxSettings.title || (userToolboxSettings && userToolboxSettings.title) || stubData.title;
      }

      const stub = BlockManager.insert({
        tool: Tools.stubTool,
        data: stubData,
      });

      stub.stretched = true;

      _.log(`Tool «${tool}» is not found. Check 'tools' property at your initial Editor.js config.`, 'warn');
    }
  }
}
