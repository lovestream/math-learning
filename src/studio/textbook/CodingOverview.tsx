import {idParts,postalParts} from '../../../shared/coding-model.mjs';
import './coding-exploration.css';
export default function CodingOverview(){
 return <div className="coding-overview" role="group" aria-label="四种编码的条件示意">
  <article><h4>书架的位置</h4><code>02 ｜ 03 ｜ 05</code><p>架号、层号、格号。先想：数字能帮你找到哪一格？</p></article>
  <article><h4>身份号码片段</h4><code>{idParts.map(p=>p.digits).join(' ')}</code><p>只有教学片段。末尾的？不是有效校验码。</p></article>
  <article><h4>信封上的邮编</h4><code>{postalParts.map(p=>p.digits).join(' ｜ ')}</code><p>这是六位邮编示意。寄信还需要哪些信息？</p></article>
  <article><h4>模拟班级学号</h4><code>03 ｜ 02 ｜ 07</code><p>如果另一个班也有7号，怎样区分他们？</p></article>
 </div>;
}
