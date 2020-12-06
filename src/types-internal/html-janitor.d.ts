/**
 * 外部JS模块的声明
 * 之后，我们可以在TS模块上使用它
 */
declare module 'html-janitor' {
  interface Config {
    tags: {
      [key: string]: boolean|{[attr: string]: boolean|string}|(() => any)
    };
  }

  export class HTMLJanitor {
    constructor(config: Config);

    public clean(taintString: string): string;
  }

  /**
   * Default export
   */
  export default HTMLJanitor;
}
