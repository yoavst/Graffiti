var NinjaKeys=(()=>{var Et=Object.defineProperty,Vi=Object.defineProperties,qi=Object.getOwnPropertyDescriptor,Gi=Object.getOwnPropertyDescriptors,Wi=Object.getOwnPropertyNames,Oe=Object.getOwnPropertySymbols;var He=Object.prototype.hasOwnProperty,Fi=Object.prototype.propertyIsEnumerable;var Te=(s,t,e)=>t in s?Et(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e,X=(s,t)=>{for(var e in t||(t={}))He.call(t,e)&&Te(s,e,t[e]);if(Oe)for(var e of Oe(t))Fi.call(t,e)&&Te(s,e,t[e]);return s},tt=(s,t)=>Vi(s,Gi(t));var Ji=(s,t)=>{for(var e in t)Et(s,e,{get:t[e],enumerable:!0})},Yi=(s,t,e,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of Wi(t))!He.call(s,r)&&r!==e&&Et(s,r,{get:()=>t[r],enumerable:!(i=qi(t,r))||i.enumerable});return s};var Qi=s=>Yi(Et({},"__esModule",{value:!0}),s);var I=(s,t,e)=>new Promise((i,r)=>{var n=a=>{try{l(e.next(a))}catch(c){r(c)}},o=a=>{try{l(e.throw(a))}catch(c){r(c)}},l=a=>a.done?i(a.value):Promise.resolve(a.value).then(n,o);l((e=e.apply(s,t)).next())});var Ss={};Ji(Ss,{NinjaKeys:()=>_});var St=window,Ct=St.ShadowRoot&&(St.ShadyCSS===void 0||St.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Me=Symbol(),Re=new WeakMap,jt=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==Me)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(Ct&&t===void 0){let i=e!==void 0&&e.length===1;i&&(t=Re.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&Re.set(e,t))}return t}toString(){return this.cssText}},Ue=s=>new jt(typeof s=="string"?s:s+"",void 0,Me);var ie=(s,t)=>{Ct?s.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet):t.forEach(e=>{let i=document.createElement("style"),r=St.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=e.cssText,s.appendChild(i)})},kt=Ct?s=>s:s=>s instanceof CSSStyleSheet?(t=>{let e="";for(let i of t.cssRules)e+=i.cssText;return Ue(e)})(s):s;var se,Pt=window,Ne=Pt.trustedTypes,Zi=Ne?Ne.emptyScript:"",De=Pt.reactiveElementPolyfillSupport,ne={toAttribute(s,t){switch(t){case Boolean:s=s?Zi:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,t){let e=s;switch(t){case Boolean:e=s!==null;break;case Number:e=s===null?null:Number(s);break;case Object:case Array:try{e=JSON.parse(s)}catch(i){e=null}}return e}},Le=(s,t)=>t!==s&&(t==t||s==s),re={attribute:!0,type:String,converter:ne,reflect:!1,hasChanged:Le},oe="finalized",z=class extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),((e=this.h)!==null&&e!==void 0?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();let t=[];return this.elementProperties.forEach((e,i)=>{let r=this._$Ep(i,e);r!==void 0&&(this._$Ev.set(r,i),t.push(r))}),t}static createProperty(t,e=re){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){let i=typeof t=="symbol"?Symbol():"__"+t,r=this.getPropertyDescriptor(t,i,e);r!==void 0&&Object.defineProperty(this.prototype,t,r)}}static getPropertyDescriptor(t,e,i){return{get(){return this[e]},set(r){let n=this[t];this[e]=r,this.requestUpdate(t,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||re}static finalize(){if(this.hasOwnProperty(oe))return!1;this[oe]=!0;let t=Object.getPrototypeOf(this);if(t.finalize(),t.h!==void 0&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){let e=this.properties,i=[...Object.getOwnPropertyNames(e),...Object.getOwnPropertySymbols(e)];for(let r of i)this.createProperty(r,e[r])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let i=new Set(t.flat(1/0).reverse());for(let r of i)e.unshift(kt(r))}else t!==void 0&&e.push(kt(t));return e}static _$Ep(t,e){let i=e.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$Eg(),this.requestUpdate(),(t=this.constructor.h)===null||t===void 0||t.forEach(e=>e(this))}addController(t){var e,i;((e=this._$ES)!==null&&e!==void 0?e:this._$ES=[]).push(t),this.renderRoot!==void 0&&this.isConnected&&((i=t.hostConnected)===null||i===void 0||i.call(t))}removeController(t){var e;(e=this._$ES)===null||e===void 0||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var t;let e=(t=this.shadowRoot)!==null&&t!==void 0?t:this.attachShadow(this.constructor.shadowRootOptions);return ie(e,this.constructor.elementStyles),e}connectedCallback(){var t;this.renderRoot===void 0&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$ES)===null||t===void 0||t.forEach(e=>{var i;return(i=e.hostConnected)===null||i===void 0?void 0:i.call(e)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$ES)===null||t===void 0||t.forEach(e=>{var i;return(i=e.hostDisconnected)===null||i===void 0?void 0:i.call(e)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$EO(t,e,i=re){var r;let n=this.constructor._$Ep(t,i);if(n!==void 0&&i.reflect===!0){let o=(((r=i.converter)===null||r===void 0?void 0:r.toAttribute)!==void 0?i.converter:ne).toAttribute(e,i.type);this._$El=t,o==null?this.removeAttribute(n):this.setAttribute(n,o),this._$El=null}}_$AK(t,e){var i;let r=this.constructor,n=r._$Ev.get(t);if(n!==void 0&&this._$El!==n){let o=r.getPropertyOptions(n),l=typeof o.converter=="function"?{fromAttribute:o.converter}:((i=o.converter)===null||i===void 0?void 0:i.fromAttribute)!==void 0?o.converter:ne;this._$El=n,this[n]=l.fromAttribute(e,o.type),this._$El=null}}requestUpdate(t,e,i){let r=!0;t!==void 0&&(((i=i||this.constructor.getPropertyOptions(t)).hasChanged||Le)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),i.reflect===!0&&this._$El!==t&&(this._$EC===void 0&&(this._$EC=new Map),this._$EC.set(t,i))):r=!1),!this.isUpdatePending&&r&&(this._$E_=this._$Ej())}_$Ej(){return I(this,null,function*(){this.isUpdatePending=!0;try{yield this._$E_}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&(yield t),!this.isUpdatePending})}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((r,n)=>this[n]=r),this._$Ei=void 0);let e=!1,i=this._$AL;try{e=this.shouldUpdate(i),e?(this.willUpdate(i),(t=this._$ES)===null||t===void 0||t.forEach(r=>{var n;return(n=r.hostUpdate)===null||n===void 0?void 0:n.call(r)}),this.update(i)):this._$Ek()}catch(r){throw e=!1,this._$Ek(),r}e&&this._$AE(i)}willUpdate(t){}_$AE(t){var e;(e=this._$ES)===null||e===void 0||e.forEach(i=>{var r;return(r=i.hostUpdated)===null||r===void 0?void 0:r.call(i)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){this._$EC!==void 0&&(this._$EC.forEach((e,i)=>this._$EO(i,this[i],e)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}};z[oe]=!0,z.elementProperties=new Map,z.elementStyles=[],z.shadowRootOptions={mode:"open"},De==null||De({ReactiveElement:z}),((se=Pt.reactiveElementVersions)!==null&&se!==void 0?se:Pt.reactiveElementVersions=[]).push("1.6.3");var ae,Ot=window,et=Ot.trustedTypes,Be=et?et.createPolicy("lit-html",{createHTML:s=>s}):void 0,ce="$lit$",N=`lit$${(Math.random()+"").slice(9)}$`,We="?"+N,Xi=`<${We}>`,q=document,Tt=()=>q.createComment(""),lt=s=>s===null||typeof s!="object"&&typeof s!="function",Fe=Array.isArray,ts=s=>Fe(s)||typeof(s==null?void 0:s[Symbol.iterator])=="function",le=`[ 	
\f\r]`,at=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ie=/-->/g,ze=/>/g,K=RegExp(`>|${le}(?:([^\\s"'>=/]+)(${le}*=${le}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ke=/'/g,Ve=/"/g,Je=/^(?:script|style|textarea|title)$/i,Ye=s=>(t,...e)=>({_$litType$:s,strings:t,values:e}),Rs=Ye(1),Ms=Ye(2),ct=Symbol.for("lit-noChange"),b=Symbol.for("lit-nothing"),qe=new WeakMap,V=q.createTreeWalker(q,129,null,!1);function Qe(s,t){if(!Array.isArray(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return Be!==void 0?Be.createHTML(t):t}var es=(s,t)=>{let e=s.length-1,i=[],r,n=t===2?"<svg>":"",o=at;for(let l=0;l<e;l++){let a=s[l],c,d,h=-1,p=0;for(;p<a.length&&(o.lastIndex=p,d=o.exec(a),d!==null);)p=o.lastIndex,o===at?d[1]==="!--"?o=Ie:d[1]!==void 0?o=ze:d[2]!==void 0?(Je.test(d[2])&&(r=RegExp("</"+d[2],"g")),o=K):d[3]!==void 0&&(o=K):o===K?d[0]===">"?(o=r!=null?r:at,h=-1):d[1]===void 0?h=-2:(h=o.lastIndex-d[2].length,c=d[1],o=d[3]===void 0?K:d[3]==='"'?Ve:Ke):o===Ve||o===Ke?o=K:o===Ie||o===ze?o=at:(o=K,r=void 0);let u=o===K&&s[l+1].startsWith("/>")?" ":"";n+=o===at?a+Xi:h>=0?(i.push(c),a.slice(0,h)+ce+a.slice(h)+N+u):a+N+(h===-2?(i.push(void 0),l):u)}return[Qe(s,n+(s[e]||"<?>")+(t===2?"</svg>":"")),i]},ht=class s{constructor({strings:t,_$litType$:e},i){let r;this.parts=[];let n=0,o=0,l=t.length-1,a=this.parts,[c,d]=es(t,e);if(this.el=s.createElement(c,i),V.currentNode=this.el.content,e===2){let h=this.el.content,p=h.firstChild;p.remove(),h.append(...p.childNodes)}for(;(r=V.nextNode())!==null&&a.length<l;){if(r.nodeType===1){if(r.hasAttributes()){let h=[];for(let p of r.getAttributeNames())if(p.endsWith(ce)||p.startsWith(N)){let u=d[o++];if(h.push(p),u!==void 0){let f=r.getAttribute(u.toLowerCase()+ce).split(N),P=/([.?@])?(.*)/.exec(u);a.push({type:1,index:n,name:P[2],strings:f,ctor:P[1]==="."?de:P[1]==="?"?pe:P[1]==="@"?ue:st})}else a.push({type:6,index:n})}for(let p of h)r.removeAttribute(p)}if(Je.test(r.tagName)){let h=r.textContent.split(N),p=h.length-1;if(p>0){r.textContent=et?et.emptyScript:"";for(let u=0;u<p;u++)r.append(h[u],Tt()),V.nextNode(),a.push({type:2,index:++n});r.append(h[p],Tt())}}}else if(r.nodeType===8)if(r.data===We)a.push({type:2,index:n});else{let h=-1;for(;(h=r.data.indexOf(N,h+1))!==-1;)a.push({type:7,index:n}),h+=N.length-1}n++}}static createElement(t,e){let i=q.createElement("template");return i.innerHTML=t,i}};function it(s,t,e=s,i){var r,n,o,l;if(t===ct)return t;let a=i!==void 0?(r=e._$Co)===null||r===void 0?void 0:r[i]:e._$Cl,c=lt(t)?void 0:t._$litDirective$;return(a==null?void 0:a.constructor)!==c&&((n=a==null?void 0:a._$AO)===null||n===void 0||n.call(a,!1),c===void 0?a=void 0:(a=new c(s),a._$AT(s,e,i)),i!==void 0?((o=(l=e)._$Co)!==null&&o!==void 0?o:l._$Co=[])[i]=a:e._$Cl=a),a!==void 0&&(t=it(s,a._$AS(s,t.values),a,i)),t}var he=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;let{el:{content:i},parts:r}=this._$AD,n=((e=t==null?void 0:t.creationScope)!==null&&e!==void 0?e:q).importNode(i,!0);V.currentNode=n;let o=V.nextNode(),l=0,a=0,c=r[0];for(;c!==void 0;){if(l===c.index){let d;c.type===2?d=new Ht(o,o.nextSibling,this,t):c.type===1?d=new c.ctor(o,c.name,c.strings,this,t):c.type===6&&(d=new fe(o,this,t)),this._$AV.push(d),c=r[++a]}l!==(c==null?void 0:c.index)&&(o=V.nextNode(),l++)}return V.currentNode=q,n}v(t){let e=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}},Ht=class s{constructor(t,e,i,r){var n;this.type=2,this._$AH=b,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=r,this._$Cp=(n=r==null?void 0:r.isConnected)===null||n===void 0||n}get _$AU(){var t,e;return(e=(t=this._$AM)===null||t===void 0?void 0:t._$AU)!==null&&e!==void 0?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=it(this,t,e),lt(t)?t===b||t==null||t===""?(this._$AH!==b&&this._$AR(),this._$AH=b):t!==this._$AH&&t!==ct&&this._(t):t._$litType$!==void 0?this.g(t):t.nodeType!==void 0?this.$(t):ts(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==b&&lt(this._$AH)?this._$AA.nextSibling.data=t:this.$(q.createTextNode(t)),this._$AH=t}g(t){var e;let{values:i,_$litType$:r}=t,n=typeof r=="number"?this._$AC(t):(r.el===void 0&&(r.el=ht.createElement(Qe(r.h,r.h[0]),this.options)),r);if(((e=this._$AH)===null||e===void 0?void 0:e._$AD)===n)this._$AH.v(i);else{let o=new he(n,this),l=o.u(this.options);o.v(i),this.$(l),this._$AH=o}}_$AC(t){let e=qe.get(t.strings);return e===void 0&&qe.set(t.strings,e=new ht(t)),e}T(t){Fe(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,i,r=0;for(let n of t)r===e.length?e.push(i=new s(this.k(Tt()),this.k(Tt()),this,this.options)):i=e[r],i._$AI(n),r++;r<e.length&&(this._$AR(i&&i._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){var i;for((i=this._$AP)===null||i===void 0||i.call(this,!1,!0,e);t&&t!==this._$AB;){let r=t.nextSibling;t.remove(),t=r}}setConnected(t){var e;this._$AM===void 0&&(this._$Cp=t,(e=this._$AP)===null||e===void 0||e.call(this,t))}},st=class{constructor(t,e,i,r,n){this.type=1,this._$AH=b,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=b}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,i,r){let n=this.strings,o=!1;if(n===void 0)t=it(this,t,e,0),o=!lt(t)||t!==this._$AH&&t!==ct,o&&(this._$AH=t);else{let l=t,a,c;for(t=n[0],a=0;a<n.length-1;a++)c=it(this,l[i+a],e,a),c===ct&&(c=this._$AH[a]),o||(o=!lt(c)||c!==this._$AH[a]),c===b?t=b:t!==b&&(t+=(c!=null?c:"")+n[a+1]),this._$AH[a]=c}o&&!r&&this.j(t)}j(t){t===b?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t!=null?t:"")}},de=class extends st{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===b?void 0:t}},is=et?et.emptyScript:"",pe=class extends st{constructor(){super(...arguments),this.type=4}j(t){t&&t!==b?this.element.setAttribute(this.name,is):this.element.removeAttribute(this.name)}},ue=class extends st{constructor(t,e,i,r,n){super(t,e,i,r,n),this.type=5}_$AI(t,e=this){var i;if((t=(i=it(this,t,e,0))!==null&&i!==void 0?i:b)===ct)return;let r=this._$AH,n=t===b&&r!==b||t.capture!==r.capture||t.once!==r.once||t.passive!==r.passive,o=t!==b&&(r===b||n);n&&this.element.removeEventListener(this.name,this,r),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;typeof this._$AH=="function"?this._$AH.call((i=(e=this.options)===null||e===void 0?void 0:e.host)!==null&&i!==void 0?i:this.element,t):this._$AH.handleEvent(t)}},fe=class{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){it(this,t)}};var Ge=Ot.litHtmlPolyfillSupport;Ge==null||Ge(ht,Ht),((ae=Ot.litHtmlVersions)!==null&&ae!==void 0?ae:Ot.litHtmlVersions=[]).push("2.8.0");var Rt=globalThis,Mt=Rt.ShadowRoot&&(Rt.ShadyCSS===void 0||Rt.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,me=Symbol(),Ze=new WeakMap,dt=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==me)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(Mt&&t===void 0){let i=e!==void 0&&e.length===1;i&&(t=Ze.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&Ze.set(e,t))}return t}toString(){return this.cssText}},Xe=s=>new dt(typeof s=="string"?s:s+"",void 0,me),T=(s,...t)=>{let e=s.length===1?s[0]:t.reduce((i,r,n)=>i+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+s[n+1],s[0]);return new dt(e,s,me)},ye=(s,t)=>{if(Mt)s.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let i=document.createElement("style"),r=Rt.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=e.cssText,s.appendChild(i)}},Ut=Mt?s=>s:s=>s instanceof CSSStyleSheet?(t=>{let e="";for(let i of t.cssRules)e+=i.cssText;return Xe(e)})(s):s;var{is:ss,defineProperty:rs,getOwnPropertyDescriptor:ns,getOwnPropertyNames:os,getOwnPropertySymbols:as,getPrototypeOf:ls}=Object,D=globalThis,ti=D.trustedTypes,cs=ti?ti.emptyScript:"",ve=D.reactiveElementPolyfillSupport,pt=(s,t)=>s,ut={toAttribute(s,t){switch(t){case Boolean:s=s?cs:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,t){let e=s;switch(t){case Boolean:e=s!==null;break;case Number:e=s===null?null:Number(s);break;case Object:case Array:try{e=JSON.parse(s)}catch(i){e=null}}return e}},Nt=(s,t)=>!ss(s,t),ei={attribute:!0,type:String,converter:ut,reflect:!1,hasChanged:Nt},ii,si;(ii=Symbol.metadata)!=null||(Symbol.metadata=Symbol("metadata")),(si=D.litPropertyMetadata)!=null||(D.litPropertyMetadata=new WeakMap);var H=class extends HTMLElement{static addInitializer(t){var e;this._$Ei(),((e=this.l)!=null?e:this.l=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=ei){if(e.state&&(e.attribute=!1),this._$Ei(),this.elementProperties.set(t,e),!e.noAccessor){let i=Symbol(),r=this.getPropertyDescriptor(t,i,e);r!==void 0&&rs(this.prototype,t,r)}}static getPropertyDescriptor(t,e,i){var o;let{get:r,set:n}=(o=ns(this.prototype,t))!=null?o:{get(){return this[e]},set(l){this[e]=l}};return{get(){return r==null?void 0:r.call(this)},set(l){let a=r==null?void 0:r.call(this);n.call(this,l),this.requestUpdate(t,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){var e;return(e=this.elementProperties.get(t))!=null?e:ei}static _$Ei(){if(this.hasOwnProperty(pt("elementProperties")))return;let t=ls(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(pt("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(pt("properties"))){let e=this.properties,i=[...os(e),...as(e)];for(let r of i)this.createProperty(r,e[r])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[i,r]of e)this.elementProperties.set(i,r)}this._$Eh=new Map;for(let[e,i]of this.elementProperties){let r=this._$Eu(e,i);r!==void 0&&this._$Eh.set(r,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let i=new Set(t.flat(1/0).reverse());for(let r of i)e.unshift(Ut(r))}else t!==void 0&&e.push(Ut(t));return e}static _$Eu(t,e){let i=e.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$Eg=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$ES(),this.requestUpdate(),(t=this.constructor.l)==null||t.forEach(e=>e(this))}addController(t){var e,i;((e=this._$E_)!=null?e:this._$E_=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&((i=t.hostConnected)==null||i.call(t))}removeController(t){var e;(e=this._$E_)==null||e.delete(t)}_$ES(){let t=new Map,e=this.constructor.elementProperties;for(let i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){var e;let t=(e=this.shadowRoot)!=null?e:this.attachShadow(this.constructor.shadowRootOptions);return ye(t,this.constructor.elementStyles),t}connectedCallback(){var t,e;(t=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$E_)==null||e.forEach(i=>{var r;return(r=i.hostConnected)==null?void 0:r.call(i)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$E_)==null||t.forEach(e=>{var i;return(i=e.hostDisconnected)==null?void 0:i.call(e)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$EO(t,e){var n;let i=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,i);if(r!==void 0&&i.reflect===!0){let o=(((n=i.converter)==null?void 0:n.toAttribute)!==void 0?i.converter:ut).toAttribute(e,i.type);this._$Em=t,o==null?this.removeAttribute(r):this.setAttribute(r,o),this._$Em=null}}_$AK(t,e){var n;let i=this.constructor,r=i._$Eh.get(t);if(r!==void 0&&this._$Em!==r){let o=i.getPropertyOptions(r),l=typeof o.converter=="function"?{fromAttribute:o.converter}:((n=o.converter)==null?void 0:n.fromAttribute)!==void 0?o.converter:ut;this._$Em=r,this[r]=l.fromAttribute(e,o.type),this._$Em=null}}requestUpdate(t,e,i,r=!1,n){var o;if(t!==void 0){if(i!=null||(i=this.constructor.getPropertyOptions(t)),!((o=i.hasChanged)!=null?o:Nt)(r?n:this[t],e))return;this.C(t,e,i)}this.isUpdatePending===!1&&(this._$Eg=this._$EP())}C(t,e,i){var r;this._$AL.has(t)||this._$AL.set(t,e),i.reflect===!0&&this._$Em!==t&&((r=this._$Ej)!=null?r:this._$Ej=new Set).add(t)}_$EP(){return I(this,null,function*(){this.isUpdatePending=!0;try{yield this._$Eg}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&(yield t),!this.isUpdatePending})}scheduleUpdate(){return this.performUpdate()}performUpdate(){var i,r;if(!this.isUpdatePending)return;if(!this.hasUpdated){if((i=this.renderRoot)!=null||(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[o,l]of this._$Ep)this[o]=l;this._$Ep=void 0}let n=this.constructor.elementProperties;if(n.size>0)for(let[o,l]of n)l.wrapped!==!0||this._$AL.has(o)||this[o]===void 0||this.C(o,this[o],l)}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),(r=this._$E_)==null||r.forEach(n=>{var o;return(o=n.hostUpdate)==null?void 0:o.call(n)}),this.update(e)):this._$ET()}catch(n){throw t=!1,this._$ET(),n}t&&this._$AE(e)}willUpdate(t){}_$AE(t){var e;(e=this._$E_)==null||e.forEach(i=>{var r;return(r=i.hostUpdated)==null?void 0:r.call(i)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$ET(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$Eg}shouldUpdate(t){return!0}update(t){this._$Ej&&(this._$Ej=this._$Ej.forEach(e=>this._$EO(e,this[e]))),this._$ET()}updated(t){}firstUpdated(t){}},ri;H.elementStyles=[],H.shadowRootOptions={mode:"open"},H[pt("elementProperties")]=new Map,H[pt("finalized")]=new Map,ve==null||ve({ReactiveElement:H}),((ri=D.reactiveElementVersions)!=null?ri:D.reactiveElementVersions=[]).push("2.0.2");var mt=globalThis,Dt=mt.trustedTypes,ni=Dt?Dt.createPolicy("lit-html",{createHTML:s=>s}):void 0,$e="$lit$",R=`lit$${(Math.random()+"").slice(9)}$`,be="?"+R,hs=`<${be}>`,F=document,yt=()=>F.createComment(""),vt=s=>s===null||typeof s!="object"&&typeof s!="function",pi=Array.isArray,ui=s=>pi(s)||typeof(s==null?void 0:s[Symbol.iterator])=="function",_e=`[ 	
\f\r]`,ft=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,oi=/-->/g,ai=/>/g,G=RegExp(`>|${_e}(?:([^\\s"'>=/]+)(${_e}*=${_e}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),li=/'/g,ci=/"/g,fi=/^(?:script|style|textarea|title)$/i,mi=s=>(t,...e)=>({_$litType$:s,strings:t,values:e}),g=mi(1),zs=mi(2),A=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),hi=new WeakMap,W=F.createTreeWalker(F,129);function yi(s,t){if(!Array.isArray(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return ni!==void 0?ni.createHTML(t):t}var vi=(s,t)=>{let e=s.length-1,i=[],r,n=t===2?"<svg>":"",o=ft;for(let l=0;l<e;l++){let a=s[l],c,d,h=-1,p=0;for(;p<a.length&&(o.lastIndex=p,d=o.exec(a),d!==null);)p=o.lastIndex,o===ft?d[1]==="!--"?o=oi:d[1]!==void 0?o=ai:d[2]!==void 0?(fi.test(d[2])&&(r=RegExp("</"+d[2],"g")),o=G):d[3]!==void 0&&(o=G):o===G?d[0]===">"?(o=r!=null?r:ft,h=-1):d[1]===void 0?h=-2:(h=o.lastIndex-d[2].length,c=d[1],o=d[3]===void 0?G:d[3]==='"'?ci:li):o===ci||o===li?o=G:o===oi||o===ai?o=ft:(o=G,r=void 0);let u=o===G&&s[l+1].startsWith("/>")?" ":"";n+=o===ft?a+hs:h>=0?(i.push(c),a.slice(0,h)+$e+a.slice(h)+R+u):a+R+(h===-2?l:u)}return[yi(s,n+(s[e]||"<?>")+(t===2?"</svg>":"")),i]},_t=class s{constructor({strings:t,_$litType$:e},i){let r;this.parts=[];let n=0,o=0,l=t.length-1,a=this.parts,[c,d]=vi(t,e);if(this.el=s.createElement(c,i),W.currentNode=this.el.content,e===2){let h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(r=W.nextNode())!==null&&a.length<l;){if(r.nodeType===1){if(r.hasAttributes())for(let h of r.getAttributeNames())if(h.endsWith($e)){let p=d[o++],u=r.getAttribute(h).split(R),f=/([.?@])?(.*)/.exec(p);a.push({type:1,index:n,name:f[2],strings:u,ctor:f[1]==="."?Bt:f[1]==="?"?It:f[1]==="@"?zt:Y}),r.removeAttribute(h)}else h.startsWith(R)&&(a.push({type:6,index:n}),r.removeAttribute(h));if(fi.test(r.tagName)){let h=r.textContent.split(R),p=h.length-1;if(p>0){r.textContent=Dt?Dt.emptyScript:"";for(let u=0;u<p;u++)r.append(h[u],yt()),W.nextNode(),a.push({type:2,index:++n});r.append(h[p],yt())}}}else if(r.nodeType===8)if(r.data===be)a.push({type:2,index:n});else{let h=-1;for(;(h=r.data.indexOf(R,h+1))!==-1;)a.push({type:7,index:n}),h+=R.length-1}n++}}static createElement(t,e){let i=F.createElement("template");return i.innerHTML=t,i}};function J(s,t,e=s,i){var o,l,a;if(t===A)return t;let r=i!==void 0?(o=e._$Co)==null?void 0:o[i]:e._$Cl,n=vt(t)?void 0:t._$litDirective$;return(r==null?void 0:r.constructor)!==n&&((l=r==null?void 0:r._$AO)==null||l.call(r,!1),n===void 0?r=void 0:(r=new n(s),r._$AT(s,e,i)),i!==void 0?((a=e._$Co)!=null?a:e._$Co=[])[i]=r:e._$Cl=r),r!==void 0&&(t=J(s,r._$AS(s,t.values),r,i)),t}var Lt=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var c;let{el:{content:e},parts:i}=this._$AD,r=((c=t==null?void 0:t.creationScope)!=null?c:F).importNode(e,!0);W.currentNode=r;let n=W.nextNode(),o=0,l=0,a=i[0];for(;a!==void 0;){if(o===a.index){let d;a.type===2?d=new rt(n,n.nextSibling,this,t):a.type===1?d=new a.ctor(n,a.name,a.strings,this,t):a.type===6&&(d=new Kt(n,this,t)),this._$AV.push(d),a=i[++l]}o!==(a==null?void 0:a.index)&&(n=W.nextNode(),o++)}return W.currentNode=F,r}p(t){let e=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}},rt=class s{get _$AU(){var t,e;return(e=(t=this._$AM)==null?void 0:t._$AU)!=null?e:this._$Cv}constructor(t,e,i,r){var n;this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=r,this._$Cv=(n=r==null?void 0:r.isConnected)!=null?n:!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=J(this,t,e),vt(t)?t===m||t==null||t===""?(this._$AH!==m&&this._$AR(),this._$AH=m):t!==this._$AH&&t!==A&&this._(t):t._$litType$!==void 0?this.g(t):t.nodeType!==void 0?this.$(t):ui(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==m&&vt(this._$AH)?this._$AA.nextSibling.data=t:this.$(F.createTextNode(t)),this._$AH=t}g(t){var n;let{values:e,_$litType$:i}=t,r=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=_t.createElement(yi(i.h,i.h[0]),this.options)),i);if(((n=this._$AH)==null?void 0:n._$AD)===r)this._$AH.p(e);else{let o=new Lt(r,this),l=o.u(this.options);o.p(e),this.$(l),this._$AH=o}}_$AC(t){let e=hi.get(t.strings);return e===void 0&&hi.set(t.strings,e=new _t(t)),e}T(t){pi(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,i,r=0;for(let n of t)r===e.length?e.push(i=new s(this.k(yt()),this.k(yt()),this,this.options)):i=e[r],i._$AI(n),r++;r<e.length&&(this._$AR(i&&i._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){var i;for((i=this._$AP)==null?void 0:i.call(this,!1,!0,e);t&&t!==this._$AB;){let r=t.nextSibling;t.remove(),t=r}}setConnected(t){var e;this._$AM===void 0&&(this._$Cv=t,(e=this._$AP)==null||e.call(this,t))}},Y=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,r,n){this.type=1,this._$AH=m,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=m}_$AI(t,e=this,i,r){let n=this.strings,o=!1;if(n===void 0)t=J(this,t,e,0),o=!vt(t)||t!==this._$AH&&t!==A,o&&(this._$AH=t);else{let l=t,a,c;for(t=n[0],a=0;a<n.length-1;a++)c=J(this,l[i+a],e,a),c===A&&(c=this._$AH[a]),o||(o=!vt(c)||c!==this._$AH[a]),c===m?t=m:t!==m&&(t+=(c!=null?c:"")+n[a+1]),this._$AH[a]=c}o&&!r&&this.O(t)}O(t){t===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t!=null?t:"")}},Bt=class extends Y{constructor(){super(...arguments),this.type=3}O(t){this.element[this.name]=t===m?void 0:t}},It=class extends Y{constructor(){super(...arguments),this.type=4}O(t){this.element.toggleAttribute(this.name,!!t&&t!==m)}},zt=class extends Y{constructor(t,e,i,r,n){super(t,e,i,r,n),this.type=5}_$AI(t,e=this){var o;if((t=(o=J(this,t,e,0))!=null?o:m)===A)return;let i=this._$AH,r=t===m&&i!==m||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==m&&(i===m||r);r&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;typeof this._$AH=="function"?this._$AH.call((i=(e=this.options)==null?void 0:e.host)!=null?i:this.element,t):this._$AH.handleEvent(t)}},Kt=class{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){J(this,t)}},_i={j:$e,P:R,A:be,C:1,M:vi,L:Lt,R:ui,V:J,D:rt,I:Y,H:It,N:zt,U:Bt,B:Kt},ge=mt.litHtmlPolyfillSupport,di;ge==null||ge(_t,rt),((di=mt.litHtmlVersions)!=null?di:mt.litHtmlVersions=[]).push("3.1.0");var gi=(s,t,e)=>{var n,o;let i=(n=e==null?void 0:e.renderBefore)!=null?n:t,r=i._$litPart$;if(r===void 0){let l=(o=e==null?void 0:e.renderBefore)!=null?o:null;i._$litPart$=r=new rt(t.insertBefore(yt(),l),l,void 0,e!=null?e:{})}return r._$AI(s),r};var S=class extends H{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e,i;let t=super.createRenderRoot();return(i=(e=this.renderOptions).renderBefore)!=null||(e.renderBefore=t.firstChild),t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=gi(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)==null||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)==null||t.setConnected(!1)}render(){return A}},$i;S._$litElement$=!0,S["finalized"]=!0,($i=globalThis.litElementHydrateSupport)==null||$i.call(globalThis,{LitElement:S});var Ae=globalThis.litElementPolyfillSupport;Ae==null||Ae({LitElement:S});var bi;((bi=globalThis.litElementVersions)!=null?bi:globalThis.litElementVersions=[]).push("4.0.2");var L=s=>(t,e)=>{e!==void 0?e.addInitializer(()=>{customElements.define(s,t)}):customElements.define(s,t)};var ds={attribute:!0,type:String,converter:ut,reflect:!1,hasChanged:Nt},ps=(s=ds,t,e)=>{let{kind:i,metadata:r}=e,n=globalThis.litPropertyMetadata.get(r);if(n===void 0&&globalThis.litPropertyMetadata.set(r,n=new Map),n.set(e.name,s),i==="accessor"){let{name:o}=e;return{set(l){let a=t.get.call(this);t.set.call(this,l),this.requestUpdate(o,a,s)},init(l){return l!==void 0&&this.C(o,void 0,s),l}}}if(i==="setter"){let{name:o}=e;return function(l){let a=this[o];t.call(this,l),this.requestUpdate(o,a,s)}}throw Error("Unsupported decorator location: "+i)};function y(s){return(t,e)=>typeof e=="object"?ps(s,t,e):((i,r,n)=>{let o=r.hasOwnProperty(n);return r.constructor.createProperty(n,o?tt(X({},i),{wrapped:!0}):i),o?Object.getOwnPropertyDescriptor(r,n):void 0})(s,t,e)}function M(s){return y(tt(X({},s),{state:!0,attribute:!1}))}var E={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},k=s=>(...t)=>({_$litDirective$:s,values:t}),C=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};var{D:us}=_i;var qt=s=>s.strings===void 0,Ai=()=>document.createComment(""),nt=(s,t,e)=>{var n;let i=s._$AA.parentNode,r=t===void 0?s._$AB:t._$AA;if(e===void 0){let o=i.insertBefore(Ai(),r),l=i.insertBefore(Ai(),r);e=new us(o,l,s,s.options)}else{let o=e._$AB.nextSibling,l=e._$AM,a=l!==s;if(a){let c;(n=e._$AQ)==null||n.call(e,s),e._$AM=s,e._$AP!==void 0&&(c=s._$AU)!==l._$AU&&e._$AP(c)}if(o!==r||a){let c=e._$AA;for(;c!==o;){let d=c.nextSibling;i.insertBefore(c,r),c=d}}}return e},B=(s,t,e=s)=>(s._$AI(t,e),s),fs={},Gt=(s,t=fs)=>s._$AH=t,wi=s=>s._$AH,Wt=s=>{var i;(i=s._$AP)==null||i.call(s,!1,!0);let t=s._$AA,e=s._$AB.nextSibling;for(;t!==e;){let r=t.nextSibling;t.remove(),t=r}};var xi=(s,t,e)=>{let i=new Map;for(let r=t;r<=e;r++)i.set(s[r],r);return i},Ei=k(class extends C{constructor(s){if(super(s),s.type!==E.CHILD)throw Error("repeat() can only be used in text expressions")}ht(s,t,e){let i;e===void 0?e=t:t!==void 0&&(i=t);let r=[],n=[],o=0;for(let l of s)r[o]=i?i(l,o):o,n[o]=e(l,o),o++;return{values:n,keys:r}}render(s,t,e){return this.ht(s,t,e).values}update(s,[t,e,i]){var P;let r=wi(s),{values:n,keys:o}=this.ht(t,e,i);if(!Array.isArray(r))return this.dt=o,n;let l=(P=this.dt)!=null?P:this.dt=[],a=[],c,d,h=0,p=r.length-1,u=0,f=n.length-1;for(;h<=p&&u<=f;)if(r[h]===null)h++;else if(r[p]===null)p--;else if(l[h]===o[u])a[u]=B(r[h],n[u]),h++,u++;else if(l[p]===o[f])a[f]=B(r[p],n[f]),p--,f--;else if(l[h]===o[f])a[f]=B(r[h],n[f]),nt(s,a[f+1],r[h]),h++,f--;else if(l[p]===o[u])a[u]=B(r[p],n[u]),nt(s,r[h],r[p]),p--,u++;else if(c===void 0&&(c=xi(o,u,f),d=xi(l,h,p)),c.has(l[h]))if(c.has(l[p])){let O=d.get(o[u]),ee=O!==void 0?r[O]:null;if(ee===null){let Pe=nt(s,r[h]);B(Pe,n[u]),a[u]=Pe}else a[u]=B(ee,n[u]),nt(s,r[h],ee),r[O]=null;u++}else Wt(r[p]),p--;else Wt(r[h]),h++;for(;u<=f;){let O=nt(s,a[f+1]);B(O,n[u]),a[u++]=O}for(;h<=p;){let O=r[h++];O!==null&&Wt(O)}return this.dt=o,Gt(s,a),A}});var Si=k(class extends C{constructor(s){if(super(s),s.type!==E.PROPERTY&&s.type!==E.ATTRIBUTE&&s.type!==E.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!qt(s))throw Error("`live` bindings can only contain a single expression")}render(s){return s}update(s,[t]){if(t===A||t===m)return t;let e=s.element,i=s.name;if(s.type===E.PROPERTY){if(t===e[i])return A}else if(s.type===E.BOOLEAN_ATTRIBUTE){if(!!t===e.hasAttribute(i))return A}else if(s.type===E.ATTRIBUTE&&e.getAttribute(i)===t+"")return A;return Gt(s),t}});var gt=(s,t)=>{var i;let e=s._$AN;if(e===void 0)return!1;for(let r of e)(i=r._$AO)==null||i.call(r,t,!1),gt(r,t);return!0},Ft=s=>{let t,e;do{if((t=s._$AM)===void 0)break;e=t._$AN,e.delete(s),s=t}while((e==null?void 0:e.size)===0)},ji=s=>{for(let t;t=s._$AM;s=t){let e=t._$AN;if(e===void 0)t._$AN=e=new Set;else if(e.has(s))break;e.add(s),vs(t)}};function ms(s){this._$AN!==void 0?(Ft(this),this._$AM=s,ji(this)):this._$AM=s}function ys(s,t=!1,e=0){let i=this._$AH,r=this._$AN;if(r!==void 0&&r.size!==0)if(t)if(Array.isArray(i))for(let n=e;n<i.length;n++)gt(i[n],!1),Ft(i[n]);else i!=null&&(gt(i,!1),Ft(i));else gt(this,s)}var vs=s=>{var t,e;s.type==E.CHILD&&((t=s._$AP)!=null||(s._$AP=ys),(e=s._$AQ)!=null||(s._$AQ=ms))},Jt=class extends C{constructor(){super(...arguments),this._$AN=void 0}_$AT(t,e,i){super._$AT(t,e,i),ji(this),this.isConnected=t._$AU}_$AO(t,e=!0){var i,r;t!==this.isConnected&&(this.isConnected=t,t?(i=this.reconnected)==null||i.call(this):(r=this.disconnected)==null||r.call(this)),e&&(gt(this,t),Ft(this))}setValue(t){if(qt(this._$Ct))this._$Ct._$AI(t,this);else{let e=[...this._$Ct._$AH];e[this._$Ci]=t,this._$Ct._$AI(e,this,0)}}disconnected(){}reconnected(){}};var Yt=()=>new xe,xe=class{},we=new WeakMap,Qt=k(class extends Jt{render(s){return m}update(s,[t]){var i;let e=t!==this.G;return e&&this.G!==void 0&&this.ot(void 0),(e||this.rt!==this.lt)&&(this.G=t,this.ct=(i=s.options)==null?void 0:i.host,this.ot(this.lt=s.element)),m}ot(s){var t;if(typeof this.G=="function"){let e=(t=this.ct)!=null?t:globalThis,i=we.get(e);i===void 0&&(i=new WeakMap,we.set(e,i)),i.get(this.G)!==void 0&&this.G.call(this.ct,void 0),i.set(this.G,s),s!==void 0&&this.G.call(this.ct,s)}else this.G.value=s}get rt(){var s,t,e;return typeof this.G=="function"?(t=we.get((s=this.ct)!=null?s:globalThis))==null?void 0:t.get(this.G):(e=this.G)==null?void 0:e.value}disconnected(){this.rt===this.lt&&this.ot(void 0)}reconnected(){this.ot(this.lt)}});var $t=k(class extends C{constructor(s){var t;if(super(s),s.type!==E.ATTRIBUTE||s.name!=="class"||((t=s.strings)==null?void 0:t.length)>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(s){return" "+Object.keys(s).filter(t=>s[t]).join(" ")+" "}update(s,[t]){var i,r;if(this.it===void 0){this.it=new Set,s.strings!==void 0&&(this.st=new Set(s.strings.join(" ").split(/\s/).filter(n=>n!=="")));for(let n in t)t[n]&&!((i=this.st)!=null&&i.has(n))&&this.it.add(n);return this.render(t)}let e=s.element.classList;for(let n of this.it)n in t||(e.remove(n),this.it.delete(n));for(let n in t){let o=!!t[n];o===this.it.has(n)||(r=this.st)!=null&&r.has(n)||(o?(e.add(n),this.it.add(n)):(e.remove(n),this.it.delete(n)))}return A}});var Ee=typeof navigator!="undefined"?navigator.userAgent.toLowerCase().indexOf("firefox")>0:!1;function Se(s,t,e){s.addEventListener?s.addEventListener(t,e,!1):s.attachEvent&&s.attachEvent("on".concat(t),function(){e(window.event)})}function Ti(s,t){for(var e=t.slice(0,t.length-1),i=0;i<e.length;i++)e[i]=s[e[i].toLowerCase()];return e}function Hi(s){typeof s!="string"&&(s=""),s=s.replace(/\s/g,"");for(var t=s.split(","),e=t.lastIndexOf("");e>=0;)t[e-1]+=",",t.splice(e,1),e=t.lastIndexOf("");return t}function _s(s,t){for(var e=s.length>=t.length?s:t,i=s.length>=t.length?t:s,r=!0,n=0;n<e.length;n++)i.indexOf(e[n])===-1&&(r=!1);return r}var Ri={backspace:8,tab:9,clear:12,enter:13,return:13,esc:27,escape:27,space:32,left:37,up:38,right:39,down:40,del:46,delete:46,ins:45,insert:45,home:36,end:35,pageup:33,pagedown:34,capslock:20,num_0:96,num_1:97,num_2:98,num_3:99,num_4:100,num_5:101,num_6:102,num_7:103,num_8:104,num_9:105,num_multiply:106,num_add:107,num_enter:108,num_subtract:109,num_decimal:110,num_divide:111,"\u21EA":20,",":188,".":190,"/":191,"`":192,"-":Ee?173:189,"=":Ee?61:187,";":Ee?59:186,"'":222,"[":219,"]":221,"\\":220},Q={"\u21E7":16,shift:16,"\u2325":18,alt:18,option:18,"\u2303":17,ctrl:17,control:17,"\u2318":91,cmd:91,command:91},Ci={16:"shiftKey",18:"altKey",17:"ctrlKey",91:"metaKey",shiftKey:16,ctrlKey:17,altKey:18,metaKey:91},x={16:!1,18:!1,17:!1,91:!1},w={};for(bt=1;bt<20;bt++)Ri["f".concat(bt)]=111+bt;var bt,v=[],Mi="all",Ui=[],Xt=function(t){return Ri[t.toLowerCase()]||Q[t.toLowerCase()]||t.toUpperCase().charCodeAt(0)};function Ni(s){Mi=s||"all"}function At(){return Mi||"all"}function gs(){return v.slice(0)}function $s(s){var t=s.target||s.srcElement,e=t.tagName,i=!0;return(t.isContentEditable||(e==="INPUT"||e==="TEXTAREA"||e==="SELECT")&&!t.readOnly)&&(i=!1),i}function bs(s){return typeof s=="string"&&(s=Xt(s)),v.indexOf(s)!==-1}function As(s,t){var e,i;s||(s=At());for(var r in w)if(Object.prototype.hasOwnProperty.call(w,r))for(e=w[r],i=0;i<e.length;)e[i].scope===s?e.splice(i,1):i++;At()===s&&Ni(t||"all")}function ws(s){var t=s.keyCode||s.which||s.charCode,e=v.indexOf(t);if(e>=0&&v.splice(e,1),s.key&&s.key.toLowerCase()==="meta"&&v.splice(0,v.length),(t===93||t===224)&&(t=91),t in x){x[t]=!1;for(var i in Q)Q[i]===t&&(U[i]=!1)}}function xs(s){if(!s)Object.keys(w).forEach(function(o){return delete w[o]});else if(Array.isArray(s))s.forEach(function(o){o.key&&je(o)});else if(typeof s=="object")s.key&&je(s);else if(typeof s=="string"){for(var t=arguments.length,e=new Array(t>1?t-1:0),i=1;i<t;i++)e[i-1]=arguments[i];var r=e[0],n=e[1];typeof r=="function"&&(n=r,r=""),je({key:s,scope:r,method:n,splitKey:"+"})}}var je=function(t){var e=t.key,i=t.scope,r=t.method,n=t.splitKey,o=n===void 0?"+":n,l=Hi(e);l.forEach(function(a){var c=a.split(o),d=c.length,h=c[d-1],p=h==="*"?"*":Xt(h);if(w[p]){i||(i=At());var u=d>1?Ti(Q,c):[];w[p]=w[p].map(function(f){var P=r?f.method===r:!0;return P&&f.scope===i&&_s(f.mods,u)?{}:f})}})};function ki(s,t,e){var i;if(t.scope===e||t.scope==="all"){i=t.mods.length>0;for(var r in x)Object.prototype.hasOwnProperty.call(x,r)&&(!x[r]&&t.mods.indexOf(+r)>-1||x[r]&&t.mods.indexOf(+r)===-1)&&(i=!1);(t.mods.length===0&&!x[16]&&!x[18]&&!x[17]&&!x[91]||i||t.shortcut==="*")&&t.method(s,t)===!1&&(s.preventDefault?s.preventDefault():s.returnValue=!1,s.stopPropagation&&s.stopPropagation(),s.cancelBubble&&(s.cancelBubble=!0))}}function Pi(s){var t=w["*"],e=s.keyCode||s.which||s.charCode;if(U.filter.call(this,s)){if((e===93||e===224)&&(e=91),v.indexOf(e)===-1&&e!==229&&v.push(e),["ctrlKey","altKey","shiftKey","metaKey"].forEach(function(u){var f=Ci[u];s[u]&&v.indexOf(f)===-1?v.push(f):!s[u]&&v.indexOf(f)>-1?v.splice(v.indexOf(f),1):u==="metaKey"&&s[u]&&v.length===3&&(s.ctrlKey||s.shiftKey||s.altKey||(v=v.slice(v.indexOf(f))))}),e in x){x[e]=!0;for(var i in Q)Q[i]===e&&(U[i]=!0);if(!t)return}for(var r in x)Object.prototype.hasOwnProperty.call(x,r)&&(x[r]=s[Ci[r]]);s.getModifierState&&!(s.altKey&&!s.ctrlKey)&&s.getModifierState("AltGraph")&&(v.indexOf(17)===-1&&v.push(17),v.indexOf(18)===-1&&v.push(18),x[17]=!0,x[18]=!0);var n=At();if(t)for(var o=0;o<t.length;o++)t[o].scope===n&&(s.type==="keydown"&&t[o].keydown||s.type==="keyup"&&t[o].keyup)&&ki(s,t[o],n);if(e in w){for(var l=0;l<w[e].length;l++)if((s.type==="keydown"&&w[e][l].keydown||s.type==="keyup"&&w[e][l].keyup)&&w[e][l].key){for(var a=w[e][l],c=a.splitKey,d=a.key.split(c),h=[],p=0;p<d.length;p++)h.push(Xt(d[p]));h.sort().join("")===v.sort().join("")&&ki(s,a,n)}}}}function Es(s){return Ui.indexOf(s)>-1}function U(s,t,e){v=[];var i=Hi(s),r=[],n="all",o=document,l=0,a=!1,c=!0,d="+";for(e===void 0&&typeof t=="function"&&(e=t),Object.prototype.toString.call(t)==="[object Object]"&&(t.scope&&(n=t.scope),t.element&&(o=t.element),t.keyup&&(a=t.keyup),t.keydown!==void 0&&(c=t.keydown),typeof t.splitKey=="string"&&(d=t.splitKey)),typeof t=="string"&&(n=t);l<i.length;l++)s=i[l].split(d),r=[],s.length>1&&(r=Ti(Q,s)),s=s[s.length-1],s=s==="*"?"*":Xt(s),s in w||(w[s]=[]),w[s].push({keyup:a,keydown:c,scope:n,mods:r,shortcut:i[l],method:e,key:i[l],splitKey:d});typeof o!="undefined"&&!Es(o)&&window&&(Ui.push(o),Se(o,"keydown",function(h){Pi(h)}),Se(window,"focus",function(){v=[]}),Se(o,"keyup",function(h){Pi(h),ws(h)}))}var Ce={setScope:Ni,getScope:At,deleteScope:As,getPressedKeyCodes:gs,isPressed:bs,filter:$s,unbind:xs};for(Zt in Ce)Object.prototype.hasOwnProperty.call(Ce,Zt)&&(U[Zt]=Ce[Zt]);var Zt;typeof window!="undefined"&&(Oi=window.hotkeys,U.noConflict=function(s){return s&&window.hotkeys===U&&(window.hotkeys=Oi),U},window.hotkeys=U);var Oi,j=U;var wt=function(s,t,e,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,e):i,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,i);else for(var l=s.length-1;l>=0;l--)(o=s[l])&&(n=(r<3?o(n):r>3?o(t,e,n):o(t,e))||n);return r>3&&n&&Object.defineProperty(t,e,n),n},Z=class extends S{constructor(){super(...arguments),this.placeholder="",this.hideBreadcrumbs=!1,this.breadcrumbHome="Home",this.breadcrumbs=[],this._inputRef=Yt()}render(){let t="";if(!this.hideBreadcrumbs){let e=[];for(let i of this.breadcrumbs)e.push(g`<button
            tabindex="-1"
            @click=${()=>this.selectParent(i)}
            class="breadcrumb"
          >
            ${i}
          </button>`);t=g`<div class="breadcrumb-list">
        <button
          tabindex="-1"
          @click=${()=>this.selectParent()}
          class="breadcrumb"
        >
          ${this.breadcrumbHome}
        </button>
        ${e}
      </div>`}return g`
      ${t}
      <div part="ninja-input-wrapper" class="search-wrapper">
        <input
          part="ninja-input"
          type="text"
          id="search"
          spellcheck="false"
          autocomplete="off"
          @input="${this._handleInput}"
          ${Qt(this._inputRef)}
          placeholder="${this.placeholder}"
          class="search"
        />
      </div>
    `}setSearch(t){this._inputRef.value&&(this._inputRef.value.value=t)}focusSearch(){requestAnimationFrame(()=>this._inputRef.value.focus())}_handleInput(t){let e=t.target;this.dispatchEvent(new CustomEvent("change",{detail:{search:e.value},bubbles:!1,composed:!1}))}selectParent(t){this.dispatchEvent(new CustomEvent("setParent",{detail:{parent:t},bubbles:!0,composed:!0}))}firstUpdated(){this.focusSearch()}_close(){this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}};Z.styles=T`
    :host {
      flex: 1;
      position: relative;
    }
    .search {
      padding: 1.25em;
      flex-grow: 1;
      flex-shrink: 0;
      margin: 0px;
      border: none;
      appearance: none;
      font-size: 1.125em;
      background: transparent;
      caret-color: var(--ninja-accent-color);
      color: var(--ninja-text-color);
      outline: none;
      font-family: var(--ninja-font-family);
    }
    .search::placeholder {
      color: var(--ninja-placeholder-color);
    }
    .breadcrumb-list {
      padding: 1em 4em 0 1em;
      display: flex;
      flex-direction: row;
      align-items: stretch;
      justify-content: flex-start;
      flex: initial;
    }

    .breadcrumb {
      background: var(--ninja-secondary-background-color);
      text-align: center;
      line-height: 1.2em;
      border-radius: var(--ninja-key-border-radius);
      border: 0;
      cursor: pointer;
      padding: 0.1em 0.5em;
      color: var(--ninja-secondary-text-color);
      margin-right: 0.5em;
      outline: none;
      font-family: var(--ninja-font-family);
    }

    .search-wrapper {
      display: flex;
      border-bottom: var(--ninja-separate-border);
    }
  `;wt([y()],Z.prototype,"placeholder",void 0);wt([y({type:Boolean})],Z.prototype,"hideBreadcrumbs",void 0);wt([y()],Z.prototype,"breadcrumbHome",void 0);wt([y({type:Array})],Z.prototype,"breadcrumbs",void 0);Z=wt([L("ninja-header")],Z);var xt=class extends C{constructor(t){if(super(t),this.et=m,t.type!==E.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===m||t==null)return this.vt=void 0,this.et=t;if(t===A)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.et)return this.vt;this.et=t;let e=[t];return e.raw=e,this.vt={_$litType$:this.constructor.resultType,strings:e,values:[]}}};xt.directiveName="unsafeHTML",xt.resultType=1;var Di=k(xt);function*Li(s,t){let e=typeof t=="function";if(s!==void 0){let i=-1;for(let r of s)i>-1&&(yield e?t(i):t),i++,yield r}}function Bi(s,t,e,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,e):i,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,i);else for(var l=s.length-1;l>=0;l--)(o=s[l])&&(n=(r<3?o(n):r>3?o(t,e,n):o(t,e))||n);return r>3&&n&&Object.defineProperty(t,e,n),n}var Ii=T`:host{font-family:var(--mdc-icon-font, "Material Icons");font-weight:normal;font-style:normal;font-size:var(--mdc-icon-size, 24px);line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale;font-feature-settings:"liga"}`;var ke=class extends S{render(){return g`<span><slot></slot></span>`}};ke.styles=[Ii];ke=Bi([L("mwc-icon")],ke);var te=function(s,t,e,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,e):i,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,i);else for(var l=s.length-1;l>=0;l--)(o=s[l])&&(n=(r<3?o(n):r>3?o(t,e,n):o(t,e))||n);return r>3&&n&&Object.defineProperty(t,e,n),n},ot=class extends S{constructor(){super(),this.selected=!1,this.hotKeysJoinedView=!0,this.addEventListener("click",this.click)}ensureInView(){requestAnimationFrame(()=>this.scrollIntoView({block:"nearest"}))}click(){this.dispatchEvent(new CustomEvent("actionsSelected",{detail:this.action,bubbles:!0,composed:!0}))}updated(t){t.has("selected")&&this.selected&&this.ensureInView()}render(){let t;this.action.mdIcon?t=g`<mwc-icon part="ninja-icon" class="ninja-icon"
        >${this.action.mdIcon}</mwc-icon
      >`:this.action.icon&&(t=Di(this.action.icon||""));let e;this.action.hotkey&&(this.hotKeysJoinedView?e=this.action.hotkey.split(",").map(r=>{let n=r.split("+"),o=g`${Li(n.map(l=>g`<kbd>${l}</kbd>`),"+")}`;return g`<div class="ninja-hotkey ninja-hotkeys">
            ${o}
          </div>`}):e=this.action.hotkey.split(",").map(r=>{let o=r.split("+").map(l=>g`<kbd class="ninja-hotkey">${l}</kbd>`);return g`<kbd class="ninja-hotkeys">${o}</kbd>`}));let i={selected:this.selected,"ninja-action":!0};return g`
      <div
        class="ninja-action"
        part="ninja-action ${this.selected?"ninja-selected":""}"
        class=${$t(i)}
      >
        ${t}
        <div class="ninja-title">${this.action.title}</div>
        ${e}
      </div>
    `}};ot.styles=T`
    :host {
      display: flex;
      width: 100%;
    }
    .ninja-action {
      padding: 0.75em 1em;
      display: flex;
      border-left: 2px solid transparent;
      align-items: center;
      justify-content: start;
      outline: none;
      transition: color 0s ease 0s;
      width: 100%;
    }
    .ninja-action.selected {
      cursor: pointer;
      color: var(--ninja-selected-text-color);
      background-color: var(--ninja-selected-background);
      border-left: 2px solid var(--ninja-accent-color);
      outline: none;
    }
    .ninja-action.selected .ninja-icon {
      color: var(--ninja-selected-text-color);
    }
    .ninja-icon {
      font-size: var(--ninja-icon-size);
      max-width: var(--ninja-icon-size);
      max-height: var(--ninja-icon-size);
      margin-right: 1em;
      color: var(--ninja-icon-color);
      margin-right: 1em;
      position: relative;
    }

    .ninja-title {
      flex-shrink: 0.01;
      margin-right: 0.5em;
      flex-grow: 1;
      font-size: 0.8125em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ninja-hotkeys {
      flex-shrink: 0;
      width: min-content;
      display: flex;
    }

    .ninja-hotkeys kbd {
      font-family: inherit;
    }
    .ninja-hotkey {
      background: var(--ninja-secondary-background-color);
      padding: 0.06em 0.25em;
      border-radius: var(--ninja-key-border-radius);
      text-transform: capitalize;
      color: var(--ninja-secondary-text-color);
      font-size: 0.75em;
      font-family: inherit;
    }

    .ninja-hotkey + .ninja-hotkey {
      margin-left: 0.5em;
    }
    .ninja-hotkeys + .ninja-hotkeys {
      margin-left: 1em;
    }
  `;te([y({type:Object})],ot.prototype,"action",void 0);te([y({type:Boolean})],ot.prototype,"selected",void 0);te([y({type:Boolean})],ot.prototype,"hotKeysJoinedView",void 0);ot=te([L("ninja-action")],ot);var zi=g` <div class="modal-footer" slot="footer">
  <span class="help">
    <svg
      version="1.0"
      class="ninja-examplekey"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1280 1280"
    >
      <path
        d="M1013 376c0 73.4-.4 113.3-1.1 120.2a159.9 159.9 0 0 1-90.2 127.3c-20 9.6-36.7 14-59.2 15.5-7.1.5-121.9.9-255 1h-242l95.5-95.5 95.5-95.5-38.3-38.2-38.2-38.3-160 160c-88 88-160 160.4-160 161 0 .6 72 73 160 161l160 160 38.2-38.3 38.3-38.2-95.5-95.5-95.5-95.5h251.1c252.9 0 259.8-.1 281.4-3.6 72.1-11.8 136.9-54.1 178.5-116.4 8.6-12.9 22.6-40.5 28-55.4 4.4-12 10.7-36.1 13.1-50.6 1.6-9.6 1.8-21 2.1-132.8l.4-122.2H1013v110z"
      />
    </svg>

    to select
  </span>
  <span class="help">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="ninja-examplekey"
      viewBox="0 0 24 24"
    >
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path
        d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"
      />
    </svg>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="ninja-examplekey"
      viewBox="0 0 24 24"
    >
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
    </svg>
    to navigate
  </span>
  <span class="help">
    <span class="ninja-examplekey esc">esc</span>
    to close
  </span>
  <span class="help">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="ninja-examplekey backspace"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fill-rule="evenodd"
        d="M6.707 4.879A3 3 0 018.828 4H15a3 3 0 013 3v6a3 3 0 01-3 3H8.828a3 3 0 01-2.12-.879l-4.415-4.414a1 1 0 010-1.414l4.414-4.414zm4 2.414a1 1 0 00-1.414 1.414L10.586 10l-1.293 1.293a1 1 0 101.414 1.414L12 11.414l1.293 1.293a1 1 0 001.414-1.414L13.414 10l1.293-1.293a1 1 0 00-1.414-1.414L12 8.586l-1.293-1.293z"
        clip-rule="evenodd"
      />
    </svg>
    move to parent
  </span>
</div>`;var Ki=T`
  :host {
    --ninja-width: 640px;
    --ninja-backdrop-filter: none;
    --ninja-overflow-background: rgba(255, 255, 255, 0.5);
    --ninja-text-color: rgb(60, 65, 73);
    --ninja-font-size: 16px;
    --ninja-top: 20%;

    --ninja-key-border-radius: 0.25em;
    --ninja-accent-color: rgb(110, 94, 210);
    --ninja-secondary-background-color: rgb(239, 241, 244);
    --ninja-secondary-text-color: rgb(107, 111, 118);

    --ninja-selected-background: rgb(248, 249, 251);

    --ninja-icon-color: var(--ninja-secondary-text-color);
    --ninja-icon-size: 1.2em;
    --ninja-separate-border: 1px solid var(--ninja-secondary-background-color);

    --ninja-modal-background: #fff;
    --ninja-modal-shadow: rgb(0 0 0 / 50%) 0px 16px 70px;

    --ninja-actions-height: 300px;
    --ninja-group-text-color: rgb(144, 149, 157);

    --ninja-footer-background: rgba(242, 242, 242, 0.4);

    --ninja-placeholder-color: #8e8e8e;

    font-size: var(--ninja-font-size);

    --ninja-z-index: 1;
  }

  :host(.dark) {
    --ninja-backdrop-filter: none;
    --ninja-overflow-background: rgba(0, 0, 0, 0.7);
    --ninja-text-color: #7d7d7d;

    --ninja-modal-background: rgba(17, 17, 17, 0.85);
    --ninja-accent-color: rgb(110, 94, 210);
    --ninja-secondary-background-color: rgba(51, 51, 51, 0.44);
    --ninja-secondary-text-color: #888;

    --ninja-selected-text-color: #eaeaea;
    --ninja-selected-background: rgba(51, 51, 51, 0.44);

    --ninja-icon-color: var(--ninja-secondary-text-color);
    --ninja-separate-border: 1px solid var(--ninja-secondary-background-color);

    --ninja-modal-shadow: 0 16px 70px rgba(0, 0, 0, 0.2);

    --ninja-group-text-color: rgb(144, 149, 157);

    --ninja-footer-background: rgba(30, 30, 30, 85%);
  }

  .modal {
    display: none;
    position: fixed;
    z-index: var(--ninja-z-index);
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background: var(--ninja-overflow-background);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-backdrop-filter: var(--ninja-backdrop-filter);
    backdrop-filter: var(--ninja-backdrop-filter);
    text-align: left;
    color: var(--ninja-text-color);
    font-family: var(--ninja-font-family);
  }
  .modal.visible {
    display: block;
  }

  .modal-content {
    position: relative;
    top: var(--ninja-top);
    margin: auto;
    padding: 0;
    display: flex;
    flex-direction: column;
    flex-shrink: 1;
    -webkit-box-flex: 1;
    flex-grow: 1;
    min-width: 0px;
    will-change: transform;
    background: var(--ninja-modal-background);
    border-radius: 0.5em;
    box-shadow: var(--ninja-modal-shadow);
    max-width: var(--ninja-width);
    overflow: hidden;
  }

  .bump {
    animation: zoom-in-zoom-out 0.2s ease;
  }

  @keyframes zoom-in-zoom-out {
    0% {
      transform: scale(0.99);
    }
    50% {
      transform: scale(1.01, 1.01);
    }
    100% {
      transform: scale(1, 1);
    }
  }

  .ninja-github {
    color: var(--ninja-keys-text-color);
    font-weight: normal;
    text-decoration: none;
  }

  .actions-list {
    max-height: var(--ninja-actions-height);
    overflow: auto;
    scroll-behavior: smooth;
    position: relative;
    margin: 0;
    padding: 0.5em 0;
    list-style: none;
    scroll-behavior: smooth;
  }

  .group-header {
    height: 1.375em;
    line-height: 1.375em;
    padding-left: 1.25em;
    padding-top: 0.5em;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-size: 0.75em;
    line-height: 1em;
    color: var(--ninja-group-text-color);
    margin: 1px 0;
  }

  .modal-footer {
    background: var(--ninja-footer-background);
    padding: 0.5em 1em;
    display: flex;
    /* font-size: 0.75em; */
    border-top: var(--ninja-separate-border);
    color: var(--ninja-secondary-text-color);
  }

  .modal-footer .help {
    display: flex;
    margin-right: 1em;
    align-items: center;
    font-size: 0.75em;
  }

  .ninja-examplekey {
    background: var(--ninja-secondary-background-color);
    padding: 0.06em 0.25em;
    border-radius: var(--ninja-key-border-radius);
    color: var(--ninja-secondary-text-color);
    width: 1em;
    height: 1em;
    margin-right: 0.5em;
    font-size: 1.25em;
    fill: currentColor;
  }
  .ninja-examplekey.esc {
    width: auto;
    height: auto;
    font-size: 1.1em;
  }
  .ninja-examplekey.backspace {
    opacity: 0.7;
  }
`;var $=function(s,t,e,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,e):i,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,i);else for(var l=s.length-1;l>=0;l--)(o=s[l])&&(n=(r<3?o(n):r>3?o(t,e,n):o(t,e))||n);return r>3&&n&&Object.defineProperty(t,e,n),n},_=class extends S{constructor(){super(...arguments),this.placeholder="Type a command or search...",this.disableHotkeys=!1,this.hideBreadcrumbs=!1,this.openHotkey="cmd+k,ctrl+k",this.navigationUpHotkey="up,shift+tab",this.navigationDownHotkey="down,tab",this.closeHotkey="esc",this.goBackHotkey="backspace",this.selectHotkey="enter",this.hotKeysJoinedView=!1,this.noAutoLoadMdIcons=!1,this.data=[],this.visible=!1,this._bump=!0,this._actionMatches=[],this._search="",this._flatData=[],this._headerRef=Yt()}open(t={}){this._bump=!0,this.visible=!0,this._headerRef.value.focusSearch(),this._actionMatches.length>0&&(this._selected=this._actionMatches[0]),this.setParent(t.parent)}close(){this._bump=!1,this.visible=!1}setParent(t){t?this._currentRoot=t:this._currentRoot=void 0,this._selected=void 0,this._search="",this._headerRef.value.setSearch("")}get breadcrumbs(){var t;let e=[],i=(t=this._selected)===null||t===void 0?void 0:t.parent;if(i)for(e.push(i);i;){let r=this._flatData.find(n=>n.id===i);r!=null&&r.parent&&e.push(r.parent),i=r?r.parent:void 0}return e.reverse()}connectedCallback(){super.connectedCallback(),this.noAutoLoadMdIcons||document.fonts.load("24px Material Icons","apps").then(()=>{}),this._registerInternalHotkeys()}disconnectedCallback(){super.disconnectedCallback(),this._unregisterInternalHotkeys()}_flattern(t,e){let i=[];return t||(t=[]),t.map(r=>{let n=r.children&&r.children.some(l=>typeof l=="string"),o=tt(X({},r),{parent:r.parent||e});return n||(o.children&&o.children.length&&(e=r.id,i=[...i,...o.children]),o.children=o.children?o.children.map(l=>l.id):[]),o}).concat(i.length?this._flattern(i,e):i)}update(t){t.has("data")&&(this._flatData=this._flattern(this.data)),super.update(t)}_registerInternalHotkeys(){this.openHotkey&&j(this.openHotkey,t=>{t.preventDefault(),this.visible?this.close():this.open()}),this.selectHotkey&&j(this.selectHotkey,t=>{this.visible&&(t.preventDefault(),this._actionSelected(this._actionMatches[this._selectedIndex]))}),this.goBackHotkey&&j(this.goBackHotkey,t=>{this.visible&&(this._search||(t.preventDefault(),this._goBack()))}),this.navigationDownHotkey&&j(this.navigationDownHotkey,t=>{this.visible&&(t.preventDefault(),this._selectedIndex>=this._actionMatches.length-1?this._selected=this._actionMatches[0]:this._selected=this._actionMatches[this._selectedIndex+1])}),this.navigationUpHotkey&&j(this.navigationUpHotkey,t=>{this.visible&&(t.preventDefault(),this._selectedIndex===0?this._selected=this._actionMatches[this._actionMatches.length-1]:this._selected=this._actionMatches[this._selectedIndex-1])}),this.closeHotkey&&j(this.closeHotkey,()=>{this.visible&&this.close()})}_unregisterInternalHotkeys(){this.openHotkey&&j.unbind(this.openHotkey),this.selectHotkey&&j.unbind(this.selectHotkey),this.goBackHotkey&&j.unbind(this.goBackHotkey),this.navigationDownHotkey&&j.unbind(this.navigationDownHotkey),this.navigationUpHotkey&&j.unbind(this.navigationUpHotkey),this.closeHotkey&&j.unbind(this.closeHotkey)}_actionFocused(t,e){this._selected=t,e.target.ensureInView()}_onTransitionEnd(){this._bump=!1}_goBack(){let t=this.breadcrumbs.length>1?this.breadcrumbs[this.breadcrumbs.length-2]:void 0;this.setParent(t)}render(){let t={bump:this._bump,"modal-content":!0},e={visible:this.visible,modal:!0},r=this._flatData.filter(l=>{var a;let c=new RegExp(this._search,"gi"),d=l.title.match(c)||((a=l.keywords)===null||a===void 0?void 0:a.match(c));return(!this._currentRoot&&this._search||l.parent===this._currentRoot)&&d}).reduce((l,a)=>l.set(a.section,[...l.get(a.section)||[],a]),new Map);this._actionMatches=[...r.values()].flat(),this._actionMatches.length>0&&this._selectedIndex===-1&&(this._selected=this._actionMatches[0]),this._actionMatches.length===0&&(this._selected=void 0);let n=l=>g` ${Ei(l,a=>a.id,a=>{var c;return g`<ninja-action
            exportparts="ninja-action,ninja-selected,ninja-icon"
            .selected=${Si(a.id===((c=this._selected)===null||c===void 0?void 0:c.id))}
            .hotKeysJoinedView=${this.hotKeysJoinedView}
            @mouseover=${d=>this._actionFocused(a,d)}
            @actionsSelected=${d=>this._actionSelected(d.detail)}
            .action=${a}
          ></ninja-action>`})}`,o=[];return r.forEach((l,a)=>{let c=a?g`<div class="group-header">${a}</div>`:void 0;o.push(g`${c}${n(l)}`)}),g`
      <div @click=${this._overlayClick} class=${$t(e)}>
        <div class=${$t(t)} @animationend=${this._onTransitionEnd}>
          <ninja-header
            exportparts="ninja-input,ninja-input-wrapper"
            ${Qt(this._headerRef)}
            .placeholder=${this.placeholder}
            .hideBreadcrumbs=${this.hideBreadcrumbs}
            .breadcrumbs=${this.breadcrumbs}
            @change=${this._handleInput}
            @setParent=${l=>this.setParent(l.detail.parent)}
            @close=${this.close}
          >
          </ninja-header>
          <div class="modal-body">
            <div class="actions-list" part="actions-list">${o}</div>
          </div>
          <slot name="footer"> ${zi} </slot>
        </div>
      </div>
    `}get _selectedIndex(){return this._selected?this._actionMatches.indexOf(this._selected):-1}_actionSelected(t){var e;if(this.dispatchEvent(new CustomEvent("selected",{detail:{search:this._search,action:t},bubbles:!0,composed:!0})),!!t){if(t.children&&((e=t.children)===null||e===void 0?void 0:e.length)>0&&(this._currentRoot=t.id,this._search=""),this._headerRef.value.setSearch(""),this._headerRef.value.focusSearch(),t.handler){let i=t.handler(t);i!=null&&i.keepOpen||this.close()}this._bump=!0}}_handleInput(t){return I(this,null,function*(){this._search=t.detail.search,yield this.updateComplete,this.dispatchEvent(new CustomEvent("change",{detail:{search:this._search,actions:this._actionMatches},bubbles:!0,composed:!0}))})}_overlayClick(t){var e;!((e=t.target)===null||e===void 0)&&e.classList.contains("modal")&&this.close()}};_.styles=[Ki];$([y({type:String})],_.prototype,"placeholder",void 0);$([y({type:Boolean})],_.prototype,"disableHotkeys",void 0);$([y({type:Boolean})],_.prototype,"hideBreadcrumbs",void 0);$([y()],_.prototype,"openHotkey",void 0);$([y()],_.prototype,"navigationUpHotkey",void 0);$([y()],_.prototype,"navigationDownHotkey",void 0);$([y()],_.prototype,"closeHotkey",void 0);$([y()],_.prototype,"goBackHotkey",void 0);$([y()],_.prototype,"selectHotkey",void 0);$([y({type:Boolean})],_.prototype,"hotKeysJoinedView",void 0);$([y({type:Boolean})],_.prototype,"noAutoLoadMdIcons",void 0);$([y({type:Array,hasChanged(){return!0}})],_.prototype,"data",void 0);$([M()],_.prototype,"visible",void 0);$([M()],_.prototype,"_bump",void 0);$([M()],_.prototype,"_actionMatches",void 0);$([M()],_.prototype,"_search",void 0);$([M()],_.prototype,"_currentRoot",void 0);$([M()],_.prototype,"_flatData",void 0);$([M()],_.prototype,"breadcrumbs",null);$([M()],_.prototype,"_selected",void 0);_=$([L("ninja-keys")],_);return Qi(Ss);})();
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/*!
 * hotkeys-js v3.8.7
 * A simple micro-library for defining and dispatching keyboard shortcuts. It has no dependencies.
 * 
 * Copyright (c) 2021 kenny wong <wowohoo@qq.com>
 * http://jaywcjlove.github.io/hotkeys
 * 
 * Licensed under the MIT license.
 */
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-LIcense-Identifier: Apache-2.0
 */
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
