export type IntroVisual = {
 type:'money-flow'|'nested-share'|'reverse-routes'|'estimate-bound'|'supply-bar'|'nested-boxes'|'invariant-bars'|'money-columns'|'materials-plan'|'vote-board'|'data-cards'|'box-camera'|'hidden-blocks'|'cube-net'|'cup-scale'|'boat-replacement'|'lines'|'angles'|'angle-reference'|'fraction-strip'|'fraction-collection'|'symmetry'|'movement'|'frame-shapes'|'rectangle'|'joined-squares'|'area-grid'|'unit-square'|'calendar'|'week-calendar'|'timeline'|'length-comparison'|'overlapping-sets'|'outfits'|'shelves'|'dot-array'|'groups';
 title:string;caption:string;values?:number[];labels?:string[];
};
export const rhombusPoints:number[][];
export const introVisualTypes:Set<string>;
