import type {TextbookModel,TextbookState} from './textbook-models.mjs';
export const coreModels:Record<string,TextbookModel>;
export const placeWeights:number[];
export function digits4(n:number):number[];
export function value4(bank:number[]):number;
export function initialCoreState(model:TextbookModel,choice?:number):TextbookState;
export function validateCoreState(model:TextbookModel,s:TextbookState):TextbookState;
export function measureCore(model:TextbookModel,s:TextbookState):Record<string,any>;
