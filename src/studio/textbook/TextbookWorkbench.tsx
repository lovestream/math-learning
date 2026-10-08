import type {WidgetState} from '../types';
import type {TextbookModel} from '../../../shared/textbook-models.mjs';
import BankWorkbench from './BankWorkbench';
import AngleWorkbench from './AngleWorkbench';
import FractionWorkbench from './FractionWorkbench';
import MotionWorkbench from './MotionWorkbench';
import GeometryWorkbench from './GeometryWorkbench';
import DataWorkbench from './DataWorkbench';
import SymbolWorkbench from './SymbolWorkbench';
import TimeWorkbench from './TimeWorkbench';
import './textbook.css';
export default function TextbookWorkbench(props:{model:TextbookModel;sceneId:string;value:WidgetState;onChange:(s:WidgetState)=>void}){
 const type=props.model.type;
 if(type==='place-value'||type==='division')return <BankWorkbench {...props}/>;
 if(type==='angle')return <AngleWorkbench {...props}/>;
 if(type==='fraction')return <FractionWorkbench {...props}/>;
 if(type==='paper-fold'||type==='motion')return <MotionWorkbench {...props}/>;
 if(['boundary','joining','tiling','cut-area'].includes(type))return <GeometryWorkbench {...props}/>;
 if(['vote','data-bins','sets'].includes(type))return <DataWorkbench {...props}/>;
 if(type==='calendar'||type==='clock')return <TimeWorkbench {...props}/>;
 return <SymbolWorkbench {...props}/>;
}
