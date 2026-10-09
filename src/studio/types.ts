import type {Progress} from '../types';
import type {OperationModel} from '../../shared/operation-models.mjs';
import type {HandsOnModel} from '../../shared/hands-on-models.mjs';
import type {TextbookModel} from '../../shared/textbook-models.mjs';
import type {IntroVisual} from '../../shared/intro-visuals.mjs';
export type SetName='warmup'|'core'|'transfer'|'challenge'|'review';
export type WidgetKind='fraction'|'area'|'substitution'|'balance'|'quantity'|'addition'|'subtraction'|'mixedOperations'|'lengthWorkbench'|'conceptLab';
export type WidgetFields={
  textbookVersion?:1;bank?:number[];alloc?:number[];cuts?:number[];width?:number;angle?:number;rotation?:number;sideLength?:number;shirt?:number;pants?:number;offset?:number;year?:number;month?:number;minutes?:number;action?:string;mode?:string;sceneId?:string;modelStateVersion?:string;
  extensionVersion?:1;modelType?:OperationModel['type'];conceptVersion?:number;labVersion?:number;
  prediction?:string;intermediate?:string;error?:string;explanation?:string;guess?:string;
  choice?:string|number;parameter?:number;reverseStep?:number;step?:number;
  top?:number;bottom?:number;left?:number;right?:number;rows?:number;parts?:number;take?:number;whole?:number;
  walk?:number;startMm?:number;overlap?:number;spacing?:number;joint?:number;target?:number;placed?:number;
  filled?:number[];sent?:number[];marked?:number[];opened?:number[];inspected?:number[];
  spread?:boolean;show?:boolean;checked?:boolean;showReason?:boolean;observed?:boolean;
  transposed?:boolean;compared?:boolean;closed?:boolean;zoom?:boolean;broken?:boolean;
  actions?:{action:string;before:string|null;after:string|null;valid?:boolean;at?:string}[];
  handsOnVersion?:2;cameraAzimuth?:number;cameraElevation?:number;rearHeight?:number;foldProgress?:number;faceId?:number;otherFaceId?:number;
  photos?:number[];scaleItems?:number[];weights?:number[];boatStones?:number[];weighed?:number[];massUnit?:string;weighingStone?:number;
  elephant?:boolean;passenger?:boolean;waterlineMarked?:boolean;predicted?:boolean;chapterScreen?:number;parentMode?:boolean;
};
export type WidgetState=(WidgetFields&{stateKind?:'legacy'})
  |(WidgetFields&{stateKind:'operation-extension';extensionVersion:1;modelType:OperationModel['type']})
  |(WidgetFields&{stateKind:'mixed-operations';sceneId:string;modelStateVersion:string})
  |(WidgetFields&{stateKind:'textbook';textbookVersion:1;sceneId:string;modelStateVersion:string})
  |(WidgetFields&{stateKind:'hands-on';handsOnVersion:2;sceneId:string;modelStateVersion:string});
export type QuantityRef={id:string;value:number;unit:string;role:string};
export type ExpressionAST={type:'number';value:number}|{type:'operation';operator:'add'|'subtract'|'multiply'|'divide';left:ExpressionAST;right:ExpressionAST;grouped?:boolean};
export type MathScene={sceneId:string;lessonId:string;story:{text:string;quantities:QuantityRef[]};expressionAST:ExpressionAST;model:{type:string;quantityRefs:string[];state:unknown};target:{prompt:string;responseSpecId:string};expected:{value:number|string;unit:string;explanation:string};taskMode:'A_order_and_model'|'B_equivalent_rewrite'|'C_operation_law'|'other';contentVersion:string};
export type LengthScene={sceneId:string;mode:'ruler'|'boards'|'chain'|'interval'|'route';title:string;prompt:string;pieceLengthsMm?:number[];overlapsMm?:number[];thicknessMm?:number;count?:number;startMm?:number;endMm?:number;spacingMm?:number;closed?:boolean;expectedMm?:number;explanation:string};
export type ConceptFamily='spatial'|'operations'|'mass'|'placeValue'|'coding'|'angles'|'fractions'|'planning'|'transform'|'division'|'boundary'|'areaGrid'|'data'|'time'|'decimals'|'sets';
export type ConceptScene={sceneId:string;family:ConceptFamily;variant:string;title:string;prompt:string;initialState:string;learnerAction:string;observableChange:string;question:string;expectedExplanation:string;wrongActionFeedback:string;guidance:{label:string;explanation:string}[];values:number[];labels:string[];modelSpec?:OperationModel;handsOnSpec?:HandsOnModel;textbookSpec?:TextbookModel;modelStatus?:'registered'|'static-review'};
export type DiagramKind='readingCorner'|'joinedTiles'|'ribbon'|'unequalRibbon'|'groupedRibbon'|'snackBox'|'threeSnacks'|'candyEquality'|'picnicCount'|'countSpacing'|'appleAddition'|'appleTransfer'|'stickerTake'|'stickerCompare';
export type WorkedStep={math:string;why:string;expressionBefore?:string;operation?:string;expressionAfter?:string;units?:string};
export type ArticleBlock={blockId:string;type:string;title:string;text?:string;paragraphs?:string[];widget?:WidgetKind;diagram?:DiagramKind;revisit?:string;examples?:{title:string;steps:WorkedStep[]}[];cases?:{label:string;math:string;explanation:string;valid:boolean}[];methods?:{id:string;name:string;question:string;action:string;condition:string;counterexample:string}[];options?:{text:string;correct:boolean;reason:string}[];prompt?:string;responseSpec?:{type:'self-explanation'};referenceAnswer?:string};
export type MeasurementTaskDiagram={type:'measurement';mode:'chain'|'boards'|'ruler'|'interval'|'route';pieceLengthMm?:number;pieceLengthsMm?:number[];thicknessMm?:number;count?:number;overlapsMm?:number[];startMm?:number;endMm?:number;lengthMm?:number;spacingMm?:number;closed?:boolean;sectionLengthsMm?:number[];sectionLabels?:string[];progressMm?:number;caption?:string};
export type ConceptTaskDiagram={type:'concept';family:ConceptFamily;variant:string;values:number[];labels?:string[];caption?:string};
export type ClaimEvidenceResponseSpec={type:'claim-evidence';evidenceOptions:{id:string;text:string}[];expectedEvidence?:string};
export type ResponseSpec=ClaimEvidenceResponseSpec|{type:'number'|'fields'|'choice'}|{type:'expression';requiredOperators?:string[];requireBrackets?:boolean;forbidBrackets?:boolean;preserveOperands?:boolean;optionalResult?:boolean}|{type:'self-explanation';rubric?:string[]};
export type Task={selfCheckItems?:string[];id:string;level:SetName;kind:'choice'|'number'|'fields'|'expression'|'explanation';prompt:string;objectiveId:string;options?:{id:string;text:string}[];responseSpec?:ResponseSpec;fields?:{key:string;label:string;unit?:string;expected?:string}[];unit?:string;diagram?:{type:string;rows?:number;cols?:number;parts?:number;selected?:number}|MeasurementTaskDiagram|ConceptTaskDiagram;expected?:string;hint?:string;solution?:string;diagnostic?:string;reasonEvidence?:boolean};
export type ChildClassroom={storyVisual?:IntroVisual;predictionVisual?:IntroVisual;story:string;predictQuestion:string;predictionOptions:string[];discovery:string[];symbols:string[];mission:string;retell:string};
export type PilotLesson={interactionStatus?:'spec-only'|'static-visual'|'step-demo'|'direct-manipulation'|'verified';introVisual?:IntroVisual;childClassroom?:ChildClassroom;textbookUnit?:{id:string;title:string;term:string;sourceId:string;printedPages:string;notes:string;sequence:string[]};editorialStatus?:string;schemaVersion:number;lessonId:string;contentVersion:string;status:'draft';title:string;shortTitle:string;question:string;subtitle:string;grade:number[];strand:string;track:string;parentUnitId:string;exampleId:string;coverageIds:string[];coveredSubitemIds:string[];thinkingSkills:string[];recommendedPrerequisites:string[];relatedLessonIds:string[];representation:string[];objectives:{id:string;action:string;scope:string}[];articleBlocks:ArticleBlock[];taskSets:Record<SetName,Task[]>;estimatedActiveMinutes:number;color:string;widget:WidgetKind;prerequisiteNote:string;mathScenes?:MathScene[];lengthScenes?:LengthScene[];conceptScenes?:ConceptScene[]};
export type ReadingRecord={revision:number;blockId:string;widgets:Record<string,WidgetState>;savedAt:string};
export type TaskResult={status:'correct'|'incorrect'|'invalidInput'|'pendingReview';message:string;paid:number;solution?:string;diagnostic?:string;at:string;assisted:boolean;firstAnswer?:Record<string,string>;finalAnswer?:Record<string,string>;selfCorrection?:boolean;helpLevel?:string|null;modelStateVersion?:string;selfCheckEvidence?:SelfCheckEvidence};
export type SelfCheckEvidence={format?:'checklist-v1';checks:string[];reflection:string;firstOperation?:string;intermediate?:string;finalConfirmed:boolean};
export type SelfCheckRecord={firstAnswer:Record<string,string>;checkedAt:string;helpLevel:string|null;modelStateVersion:string;selfCorrection:boolean|null;evidence?:SelfCheckEvidence;evidenceCompletedAt?:string};
export type PilotSession={assessment?:string;id:string;lessonId:string;contentVersion:string;setName:SetName;taskIds:string[];tasks:Task[];revision:number;index:number;answers:Record<string,Record<string,string>>;help:Record<string,'hint'|'solution'|'article'>;results:Record<string,TaskResult>;selfChecks:Record<string,SelfCheckRecord>;createdAt:string;savedAt:string;completedAt:string|null;submittedAt?:string};
export type PilotState={version:1;reading:Record<string,ReadingRecord>;sessions:Record<string,PilotSession>;lastLessonId?:string;notes:{id:string;lessonId:string;text:string;status:'ungraded';at:string}[];events:any[];entitlements:Record<string,number>;daily:Record<string,{tasks:number;completion:number}>;review?:Record<string,{dueAt:string;stage:number}>};
export type StudioData={progress:Progress;lessons:PilotLesson[];design:{version:string;strands:{id:string;title:string}[];units:{unitId:string;scope:string;strand:string}[];counts:Record<string,number>}};
