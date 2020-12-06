/**
 * 允许从 TypeScript 文件中的 `components/modules/ui` 中导入 `.svg`
 */
declare module '*.svg' {
  const content: string;
  export default content;
}
