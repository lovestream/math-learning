import type {Task} from '../types';
import './measurement.css';

export default function InverseTaskFigure({diagram}:{diagram:NonNullable<Task['diagram']>}){
  if(diagram.type==='fraction'&&'parts' in diagram){
    const parts=diagram.parts??4,selected=diagram.selected??3;
    return <figure className="measurement-question inverse-review-picture"><svg viewBox="0 0 600 155" role="img" aria-label={`同一条纸带平均分成${parts}大格，前${selected}大格涂蓝；请自己在每大格中间画线平分`}>
      {Array.from({length:parts},(_,i)=><g key={i}><rect x={50+i*500/parts} y="42" width={500/parts} height="55" fill={i<selected?'#327c8a':'#fffdf3'} stroke="#294b53" strokeWidth="2"/><text x={50+(i+.5)*500/parts} y="124" textAnchor="middle" fontSize="19">第{i+1}大格</text></g>)}
      <text x="300" y="25" textAnchor="middle" fontSize="19">每大格再平分成2小格</text>
    </svg><figcaption>先自己把每大格一分为二，再分别数整条和蓝色部分的小格。</figcaption></figure>;
  }
  if(diagram.type==='joined-perimeters'&&'eachPerimeter' in diagram)return <figure className="measurement-question inverse-review-picture"><svg viewBox="0 0 600 230" role="img" aria-label={`两块相同长方形沿一整条边贴合，各自周长${diagram.eachPerimeter}厘米，拼后外周长${diagram.totalPerimeter}厘米；虚线是待求的贴合边`}>
    <rect x="140" y="50" width="160" height="120" fill="#327c8a22"/><rect x="300" y="50" width="160" height="120" fill="#b47a2722"/>
    <path d="M300 50H140V170H460V50H300" fill="none" stroke="#294b53" strokeWidth="4"/>
    <path d="M300 50V170" stroke="#a14832" strokeWidth="3" strokeDasharray="7 5"/>
    <text x="215" y="110" textAnchor="middle" fontSize="17">周长{diagram.eachPerimeter}厘米</text><text x="385" y="110" textAnchor="middle" fontSize="17">周长{diagram.eachPerimeter}厘米</text>
    <text x="300" y="28" textAnchor="middle" fontSize="18">拼好后，外边一圈共{diagram.totalPerimeter}厘米</text>
    <text x="300" y="208" textAnchor="middle" fontSize="18">虚线是贴合边：长？厘米</text>
  </svg><figcaption>关系示意，不按比例。虚线留在里面，不属于拼好后的外边一圈。</figcaption></figure>;
  return null;
}
