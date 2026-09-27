import catalog from '../content/pets/catalog.json';

export type PetDefinition = {name:string;english:string;price:number;image:string;note:string;favorite:string;color:string;legacy:boolean};
export type PetItem = {name:string;price:number;emoji:string;kind:string;growth:number;bond:number;note:string;image:string};
export const PETS:Record<string,PetDefinition> = catalog.pets;
export const PET_ITEMS:Record<string,PetItem> = catalog.items;
export const PET_LEVELS = catalog.levels;
export function petLevel(growth:number) { return PET_LEVELS.reduce((best,level,index)=>growth>=level.xp?index:best,0); }

export default function PetPortrait({pet,size='large',happy=false}:{pet:string;size?:'small'|'medium'|'large';happy?:boolean}) {
  const info=PETS[pet]??PETS.dongdong;
  return <div className={`pet-image ${size} ${happy?'happy':''} ${info.legacy?'':'official-pet'}`}><img src={info.image} alt={info.name} draggable={false}/></div>;
}
