// Fixed fictional teaching data. Never request or generate a complete identity number.
export const idParts=[
 {digits:'44',name:'第1—2位：省级',detail:'身份证地址码前两位表示省、自治区、直辖市等省级行政区划。此处44用作广东省的教学示意。'},
 {digits:'01',name:'第3—4位：中间层级',detail:'一般表示市、地区、自治州等行政区划层级；直辖市等存在特殊划分，不能机械理解为普通地级市。'},
 {digits:'06',name:'第5—6位：区县级',detail:'与前四位一起构成6位行政区划代码，指县、市辖区、县级市等行政单元。'},
 {digits:'2015',name:'第7—10位：出生年',detail:'四位年份，必须连同月日理解。例如这里只用2015作示范，不对应任何真实证件。'},
 {digits:'05',name:'第11—12位：出生月',detail:'月份占两位，5月写05，不能省去前导0，否则后面所有位置就会改变。'},
 {digits:'16',name:'第13—14位：出生日',detail:'日期占两位，示例16表示当月16日。年月日合起来是8位。'},
 {digits:'003',name:'第15—17位：顺序码',detail:'这三位用于区分同一地址码及同年同月同日出生的人员。第17位（整个身份证倒数第二位）是3，奇数对应男性；若为004，末位4是偶数，对应女性。'},
 {digits:'?',name:'第18位：校验码',detail:'最后一位按前17位算出。结果若是10，就用一个字母X代表10；不能随便写X。此处问号表示没有提供真实校验码，本演示不是完整身份证号码。'}
];
export const postalParts=[
 {digits:'10',name:'前2位：省级邮政范围',detail:'邮政编码首两位体现省、自治区、直辖市等邮政区域。邮编与身份证行政区划码是不同体系，不能互相照抄。'},
 {digits:'0',name:'第3位：邮区',detail:'继续细分邮政分拣范围，方便邮件按区域流转。'},
 {digits:'0',name:'第4位：县、市等投递层级',detail:'用来进一步细分邮政区域。具体区划和实际投递组织以邮政部门公布的信息为准。'},
 {digits:'31',name:'最后2位：投递局（所）',detail:'进一步标识投递局所/投递区域。一个邮编下仍可以有许多街道和住户，寄信还需要完整的地址。'}
];
export const codingQuiz=[
 {q:'身份证的出生年份占哪几位？',options:['第1—4位','第7—10位','第15—18位'],correct:1,why:'第7—14位是日期，分成4位年＋2位月＋2位日。'},
 {q:'身份证顺序码是002，哪一位用于区分男女？',options:['第16位2','第17位2（偶数）','最后第18位'],correct:1,why:'顺序码第15—17位，最后一位就是全号第17位；偶数按该规则对应女性。'},
 {q:'身份证校验码位置计算出10，为什么写X？',options:['X占一个字符位置表示10','系统可随机挑字母','X表示身份证无效'],correct:0,why:'校验值10以X表示，仅占一位；其他校验值仍按规则填写。'},
 {q:'邮政编码和详细地址，哪句正确？',options:['同一邮编只能对应一个人','邮编用于邮件分拣，仍要详细地址','邮编末位可表示性别'],correct:1,why:'邮编面向投递区域，身份信息与邮编无关。'},
 {q:'3年级1班7号和3年级2班7号，都记“307”，有什么风险？',options:['不会有任何问题','数字总和改变了','两人会撞号，编码要加足班级信息'],correct:2,why:'编码要能区分不同对象；要规定各段含义和位数。'}
];

export function classCode(grade,classNo,serial){
 if(![grade,classNo,serial].every(Number.isInteger)||grade<1||grade>6||classNo<1||classNo>6||serial<1||serial>45)throw Error('模拟班级字段超出范围');
 return [grade,classNo,serial].map(n=>String(n).padStart(2,'0')).join('-');
}
export function stableCode(year,serial){
 if(!Number.isInteger(year)||year<2023||year>2026||!Number.isInteger(serial)||serial<1||serial>9999)throw Error('模拟校内流水字段超出范围');
 return `${year}-${String(serial).padStart(4,'0')}`;
}

export const identityGroups=[{name:'地址码',from:0,to:3},{name:'出生日期',from:3,to:6},{name:'顺序码',from:6,to:7},{name:'校验码',from:7,to:8}];
