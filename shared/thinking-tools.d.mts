export type ThinkingToolSpec={type:'balance'|'views'|'venn';conditions:number[];names?:string[]};
export type ThinkingToolState={version:string;values:number[];view:number};
export function thinkingToolSpec(id:string,variant?:unknown):ThinkingToolSpec|null;
export function initialThinkingTool(spec:ThinkingToolSpec):ThinkingToolState;
export function validateThinkingTool(spec:ThinkingToolSpec,s:ThinkingToolState):ThinkingToolState;
export function moveThinkingTool(spec:ThinkingToolSpec,s:ThinkingToolState,command:string,index?:number,value?:number):ThinkingToolState;
export function measureThinkingTool(spec:ThinkingToolSpec,s:ThinkingToolState):Record<string,any>;
