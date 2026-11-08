import {chainJointGeometry} from '../../../shared/length-model.mjs';
import {Dimension} from './Primitives';

/** Two outside-length ranges offset vertically so their shared x interval is visible. */
export default function ChainJointFigure({thickness,index=0}:{thickness:number;index?:number}){
  const joint=chainJointGeometry(thickness),x=(mm:number)=>180+mm/thickness*60;
  const previous=index%2?'#b47a27':'#327c8a',next=index%2?'#327c8a':'#b47a27';
  return <svg className="chain-joint-figure" viewBox="0 0 480 252" role="img" aria-label={`一个接头的左右位置放大图。前环右外缘在框右边，后环左外缘在框左边。框宽是两段${thickness}毫米厚度。`}>
    <rect className="chain-shared-zone" x={x(joint.left)} y="38" width={x(joint.right)-x(joint.left)} height="161" rx="3"/>
    <text x="24" y="24">沿拉直方向看 →</text>
    <text x="24" y="58">前一个环的外长范围</text>
    <rect x="24" y="70" width={x(joint.previousEnd)-24} height="29" fill={previous} fillOpacity=".18"/>
    <rect data-metal="previous" x={x(joint.previousMetal[0])} y="70" width="60" height="29" fill={previous}/>
    <path d={`M${x(joint.previousEnd)} 62v42`} stroke={previous} strokeWidth="3"/>
    <text x="324" y="90" fill={previous}>右外缘</text>
    <Dimension x1={x(joint.previousMetal[0])} x2={x(joint.previousEnd)} y={126} label={`${thickness}毫米`}/>
    <text x="24" y="151">后一个环的外长范围</text>
    <rect x={x(joint.nextStart)} y="162" width={456-x(joint.nextStart)} height="29" fill={next} fillOpacity=".18"/>
    <rect data-metal="next" x={x(joint.nextMetal[0])} y="162" width="60" height="29" fill={next}/>
    <path d={`M${x(joint.nextStart)} 155v41`} stroke={next} strokeWidth="3"/>
    <text x="92" y="183" fill={next}>左外缘</text>
    <Dimension x1={x(joint.nextStart)} x2={x(joint.nextMetal[1])} y={217} label={`${thickness}毫米`}/>
    <path d={`M${x(joint.middle)} 38v161`} className="chain-contact-line"/>
    <text x="240" y="246" textAnchor="middle">虚线框＝接头重叠范围</text>
  </svg>;
}
