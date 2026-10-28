export const navigationEvent='kevin-before-navigation';
export type NavigationEvent=CustomEvent<{waitUntil:(promise:Promise<unknown>)=>void}>;
export function beforeNavigation(){const pending:Promise<unknown>[]=[];window.dispatchEvent(new CustomEvent(navigationEvent,{detail:{waitUntil:(p:Promise<unknown>)=>pending.push(p)}}));return Promise.all(pending);}
