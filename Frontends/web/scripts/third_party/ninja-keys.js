var NinjaKeys=(()=>{var Zt=Object.defineProperty;var Ci=Object.getOwnPropertyDescriptor;var ki=Object.getOwnPropertyNames;var Pi=Object.prototype.hasOwnProperty;var Oi=(s,t)=>{for(var e in t)Zt(s,e,{get:t[e],enumerable:!0})},Ti=(s,t,e,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of ki(t))!Pi.call(s,r)&&r!==e&&Zt(s,r,{get:()=>t[r],enumerable:!(i=Ci(t,r))||i.enumerable});return s};var Hi=s=>Ti(Zt({},"__esModule",{value:!0}),s);var ds={};Oi(ds,{NinjaKeys:()=>_});var gt=window,bt=gt.ShadowRoot&&(gt.ShadyCSS===void 0||gt.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ee=Symbol(),xe=new WeakMap,$t=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==Ee)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(bt&&t===void 0){let i=e!==void 0&&e.length===1;i&&(t=xe.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&xe.set(e,t))}return t}toString(){return this.cssText}},Se=s=>new $t(typeof s=="string"?s:s+"",void 0,Ee);var Yt=(s,t)=>{bt?s.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet):t.forEach(e=>{let i=document.createElement("style"),r=gt.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=e.cssText,s.appendChild(i)})},At=bt?s=>s:s=>s instanceof CSSStyleSheet?(t=>{let e="";for(let i of t.cssRules)e+=i.cssText;return Se(e)})(s):s;var Qt,wt=window,je=wt.trustedTypes,Ri=je?je.emptyScript:"",Ce=wt.reactiveElementPolyfillSupport,te={toAttribute(s,t){switch(t){case Boolean:s=s?Ri:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,t){let e=s;switch(t){case Boolean:e=s!==null;break;case Number:e=s===null?null:Number(s);break;case Object:case Array:try{e=JSON.parse(s)}catch{e=null}}return e}},ke=(s,t)=>t!==s&&(t==t||s==s),Xt={attribute:!0,type:String,converter:te,reflect:!1,hasChanged:ke},ee="finalized",L=class extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),((e=this.h)!==null&&e!==void 0?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();let t=[];return this.elementProperties.forEach((e,i)=>{let r=this._$Ep(i,e);r!==void 0&&(this._$Ev.set(r,i),t.push(r))}),t}static createProperty(t,e=Xt){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){let i=typeof t=="symbol"?Symbol():"__"+t,r=this.getPropertyDescriptor(t,i,e);r!==void 0&&Object.defineProperty(this.prototype,t,r)}}static getPropertyDescriptor(t,e,i){return{get(){return this[e]},set(r){let n=this[t];this[e]=r,this.requestUpdate(t,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||Xt}static finalize(){if(this.hasOwnProperty(ee))return!1;this[ee]=!0;let t=Object.getPrototypeOf(this);if(t.finalize(),t.h!==void 0&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){let e=this.properties,i=[...Object.getOwnPropertyNames(e),...Object.getOwnPropertySymbols(e)];for(let r of i)this.createProperty(r,e[r])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let i=new Set(t.flat(1/0).reverse());for(let r of i)e.unshift(At(r))}else t!==void 0&&e.push(At(t));return e}static _$Ep(t,e){let i=e.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$Eg(),this.requestUpdate(),(t=this.constructor.h)===null||t===void 0||t.forEach(e=>e(this))}addController(t){var e,i;((e=this._$ES)!==null&&e!==void 0?e:this._$ES=[]).push(t),this.renderRoot!==void 0&&this.isConnected&&((i=t.hostConnected)===null||i===void 0||i.call(t))}removeController(t){var e;(e=this._$ES)===null||e===void 0||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var t;let e=(t=this.shadowRoot)!==null&&t!==void 0?t:this.attachShadow(this.constructor.shadowRootOptions);return Yt(e,this.constructor.elementStyles),e}connectedCallback(){var t;this.renderRoot===void 0&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$ES)===null||t===void 0||t.forEach(e=>{var i;return(i=e.hostConnected)===null||i===void 0?void 0:i.call(e)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$ES)===null||t===void 0||t.forEach(e=>{var i;return(i=e.hostDisconnected)===null||i===void 0?void 0:i.call(e)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$EO(t,e,i=Xt){var r;let n=this.constructor._$Ep(t,i);if(n!==void 0&&i.reflect===!0){let o=(((r=i.converter)===null||r===void 0?void 0:r.toAttribute)!==void 0?i.converter:te).toAttribute(e,i.type);this._$El=t,o==null?this.removeAttribute(n):this.setAttribute(n,o),this._$El=null}}_$AK(t,e){var i;let r=this.constructor,n=r._$Ev.get(t);if(n!==void 0&&this._$El!==n){let o=r.getPropertyOptions(n),l=typeof o.converter=="function"?{fromAttribute:o.converter}:((i=o.converter)===null||i===void 0?void 0:i.fromAttribute)!==void 0?o.converter:te;this._$El=n,this[n]=l.fromAttribute(e,o.type),this._$El=null}}requestUpdate(t,e,i){let r=!0;t!==void 0&&(((i=i||this.constructor.getPropertyOptions(t)).hasChanged||ke)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),i.reflect===!0&&this._$El!==t&&(this._$EC===void 0&&(this._$EC=new Map),this._$EC.set(t,i))):r=!1),!this.isUpdatePending&&r&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((r,n)=>this[n]=r),this._$Ei=void 0);let e=!1,i=this._$AL;try{e=this.shouldUpdate(i),e?(this.willUpdate(i),(t=this._$ES)===null||t===void 0||t.forEach(r=>{var n;return(n=r.hostUpdate)===null||n===void 0?void 0:n.call(r)}),this.update(i)):this._$Ek()}catch(r){throw e=!1,this._$Ek(),r}e&&this._$AE(i)}willUpdate(t){}_$AE(t){var e;(e=this._$ES)===null||e===void 0||e.forEach(i=>{var r;return(r=i.hostUpdated)===null||r===void 0?void 0:r.call(i)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){this._$EC!==void 0&&(this._$EC.forEach((e,i)=>this._$EO(i,this[i],e)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}};L[ee]=!0,L.elementProperties=new Map,L.elementStyles=[],L.shadowRootOptions={mode:"open"},Ce?.({ReactiveElement:L}),((Qt=wt.reactiveElementVersions)!==null&&Qt!==void 0?Qt:wt.reactiveElementVersions=[]).push("1.6.3");var ie,xt=window,Z=xt.trustedTypes,Pe=Z?Z.createPolicy("lit-html",{createHTML:s=>s}):void 0,re="$lit$",U=`lit$${(Math.random()+"").slice(9)}$`,Ne="?"+U,Mi=`<${Ne}>`,z=document,Et=()=>z.createComment(""),st=s=>s===null||typeof s!="object"&&typeof s!="function",De=Array.isArray,Ui=s=>De(s)||typeof s?.[Symbol.iterator]=="function",se=`[ 	
\f\r]`,it=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Oe=/-->/g,Te=/>/g,B=RegExp(`>|${se}(?:([^\\s"'>=/]+)(${se}*=${se}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),He=/'/g,Re=/"/g,Le=/^(?:script|style|textarea|title)$/i,Be=s=>(t,...e)=>({_$litType$:s,strings:t,values:e}),_s=Be(1),gs=Be(2),rt=Symbol.for("lit-noChange"),b=Symbol.for("lit-nothing"),Me=new WeakMap,I=z.createTreeWalker(z,129,null,!1);function Ie(s,t){if(!Array.isArray(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return Pe!==void 0?Pe.createHTML(t):t}var Ni=(s,t)=>{let e=s.length-1,i=[],r,n=t===2?"<svg>":"",o=it;for(let l=0;l<e;l++){let a=s[l],h,d,c=-1,p=0;for(;p<a.length&&(o.lastIndex=p,d=o.exec(a),d!==null);)p=o.lastIndex,o===it?d[1]==="!--"?o=Oe:d[1]!==void 0?o=Te:d[2]!==void 0?(Le.test(d[2])&&(r=RegExp("</"+d[2],"g")),o=B):d[3]!==void 0&&(o=B):o===B?d[0]===">"?(o=r??it,c=-1):d[1]===void 0?c=-2:(c=o.lastIndex-d[2].length,h=d[1],o=d[3]===void 0?B:d[3]==='"'?Re:He):o===Re||o===He?o=B:o===Oe||o===Te?o=it:(o=B,r=void 0);let u=o===B&&s[l+1].startsWith("/>")?" ":"";n+=o===it?a+Mi:c>=0?(i.push(h),a.slice(0,c)+re+a.slice(c)+U+u):a+U+(c===-2?(i.push(void 0),l):u)}return[Ie(s,n+(s[e]||"<?>")+(t===2?"</svg>":"")),i]},nt=class s{constructor({strings:t,_$litType$:e},i){let r;this.parts=[];let n=0,o=0,l=t.length-1,a=this.parts,[h,d]=Ni(t,e);if(this.el=s.createElement(h,i),I.currentNode=this.el.content,e===2){let c=this.el.content,p=c.firstChild;p.remove(),c.append(...p.childNodes)}for(;(r=I.nextNode())!==null&&a.length<l;){if(r.nodeType===1){if(r.hasAttributes()){let c=[];for(let p of r.getAttributeNames())if(p.endsWith(re)||p.startsWith(U)){let u=d[o++];if(c.push(p),u!==void 0){let f=r.getAttribute(u.toLowerCase()+re).split(U),E=/([.?@])?(.*)/.exec(u);a.push({type:1,index:n,name:E[2],strings:f,ctor:E[1]==="."?oe:E[1]==="?"?ae:E[1]==="@"?le:Q})}else a.push({type:6,index:n})}for(let p of c)r.removeAttribute(p)}if(Le.test(r.tagName)){let c=r.textContent.split(U),p=c.length-1;if(p>0){r.textContent=Z?Z.emptyScript:"";for(let u=0;u<p;u++)r.append(c[u],Et()),I.nextNode(),a.push({type:2,index:++n});r.append(c[p],Et())}}}else if(r.nodeType===8)if(r.data===Ne)a.push({type:2,index:n});else{let c=-1;for(;(c=r.data.indexOf(U,c+1))!==-1;)a.push({type:7,index:n}),c+=U.length-1}n++}}static createElement(t,e){let i=z.createElement("template");return i.innerHTML=t,i}};function Y(s,t,e=s,i){var r,n,o,l;if(t===rt)return t;let a=i!==void 0?(r=e._$Co)===null||r===void 0?void 0:r[i]:e._$Cl,h=st(t)?void 0:t._$litDirective$;return a?.constructor!==h&&((n=a?._$AO)===null||n===void 0||n.call(a,!1),h===void 0?a=void 0:(a=new h(s),a._$AT(s,e,i)),i!==void 0?((o=(l=e)._$Co)!==null&&o!==void 0?o:l._$Co=[])[i]=a:e._$Cl=a),a!==void 0&&(t=Y(s,a._$AS(s,t.values),a,i)),t}var ne=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;let{el:{content:i},parts:r}=this._$AD,n=((e=t?.creationScope)!==null&&e!==void 0?e:z).importNode(i,!0);I.currentNode=n;let o=I.nextNode(),l=0,a=0,h=r[0];for(;h!==void 0;){if(l===h.index){let d;h.type===2?d=new St(o,o.nextSibling,this,t):h.type===1?d=new h.ctor(o,h.name,h.strings,this,t):h.type===6&&(d=new ce(o,this,t)),this._$AV.push(d),h=r[++a]}l!==h?.index&&(o=I.nextNode(),l++)}return I.currentNode=z,n}v(t){let e=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}},St=class s{constructor(t,e,i,r){var n;this.type=2,this._$AH=b,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=r,this._$Cp=(n=r?.isConnected)===null||n===void 0||n}get _$AU(){var t,e;return(e=(t=this._$AM)===null||t===void 0?void 0:t._$AU)!==null&&e!==void 0?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Y(this,t,e),st(t)?t===b||t==null||t===""?(this._$AH!==b&&this._$AR(),this._$AH=b):t!==this._$AH&&t!==rt&&this._(t):t._$litType$!==void 0?this.g(t):t.nodeType!==void 0?this.$(t):Ui(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==b&&st(this._$AH)?this._$AA.nextSibling.data=t:this.$(z.createTextNode(t)),this._$AH=t}g(t){var e;let{values:i,_$litType$:r}=t,n=typeof r=="number"?this._$AC(t):(r.el===void 0&&(r.el=nt.createElement(Ie(r.h,r.h[0]),this.options)),r);if(((e=this._$AH)===null||e===void 0?void 0:e._$AD)===n)this._$AH.v(i);else{let o=new ne(n,this),l=o.u(this.options);o.v(i),this.$(l),this._$AH=o}}_$AC(t){let e=Me.get(t.strings);return e===void 0&&Me.set(t.strings,e=new nt(t)),e}T(t){De(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,i,r=0;for(let n of t)r===e.length?e.push(i=new s(this.k(Et()),this.k(Et()),this,this.options)):i=e[r],i._$AI(n),r++;r<e.length&&(this._$AR(i&&i._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){var i;for((i=this._$AP)===null||i===void 0||i.call(this,!1,!0,e);t&&t!==this._$AB;){let r=t.nextSibling;t.remove(),t=r}}setConnected(t){var e;this._$AM===void 0&&(this._$Cp=t,(e=this._$AP)===null||e===void 0||e.call(this,t))}},Q=class{constructor(t,e,i,r,n){this.type=1,this._$AH=b,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=b}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,i,r){let n=this.strings,o=!1;if(n===void 0)t=Y(this,t,e,0),o=!st(t)||t!==this._$AH&&t!==rt,o&&(this._$AH=t);else{let l=t,a,h;for(t=n[0],a=0;a<n.length-1;a++)h=Y(this,l[i+a],e,a),h===rt&&(h=this._$AH[a]),o||(o=!st(h)||h!==this._$AH[a]),h===b?t=b:t!==b&&(t+=(h??"")+n[a+1]),this._$AH[a]=h}o&&!r&&this.j(t)}j(t){t===b?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},oe=class extends Q{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===b?void 0:t}},Di=Z?Z.emptyScript:"",ae=class extends Q{constructor(){super(...arguments),this.type=4}j(t){t&&t!==b?this.element.setAttribute(this.name,Di):this.element.removeAttribute(this.name)}},le=class extends Q{constructor(t,e,i,r,n){super(t,e,i,r,n),this.type=5}_$AI(t,e=this){var i;if((t=(i=Y(this,t,e,0))!==null&&i!==void 0?i:b)===rt)return;let r=this._$AH,n=t===b&&r!==b||t.capture!==r.capture||t.once!==r.once||t.passive!==r.passive,o=t!==b&&(r===b||n);n&&this.element.removeEventListener(this.name,this,r),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;typeof this._$AH=="function"?this._$AH.call((i=(e=this.options)===null||e===void 0?void 0:e.host)!==null&&i!==void 0?i:this.element,t):this._$AH.handleEvent(t)}},ce=class{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Y(this,t)}};var Ue=xt.litHtmlPolyfillSupport;Ue?.(nt,St),((ie=xt.litHtmlVersions)!==null&&ie!==void 0?ie:xt.litHtmlVersions=[]).push("2.8.0");var jt=globalThis,Ct=jt.ShadowRoot&&(jt.ShadyCSS===void 0||jt.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,he=Symbol(),ze=new WeakMap,ot=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==he)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(Ct&&t===void 0){let i=e!==void 0&&e.length===1;i&&(t=ze.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&ze.set(e,t))}return t}toString(){return this.cssText}},Ke=s=>new ot(typeof s=="string"?s:s+"",void 0,he),O=(s,...t)=>{let e=s.length===1?s[0]:t.reduce((i,r,n)=>i+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+s[n+1],s[0]);return new ot(e,s,he)},de=(s,t)=>{if(Ct)s.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let i=document.createElement("style"),r=jt.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=e.cssText,s.appendChild(i)}},kt=Ct?s=>s:s=>s instanceof CSSStyleSheet?(t=>{let e="";for(let i of t.cssRules)e+=i.cssText;return Ke(e)})(s):s;var{is:Li,defineProperty:Bi,getOwnPropertyDescriptor:Ii,getOwnPropertyNames:zi,getOwnPropertySymbols:Ki,getPrototypeOf:Vi}=Object,Pt=globalThis,Ve=Pt.trustedTypes,qi=Ve?Ve.emptyScript:"",Gi=Pt.reactiveElementPolyfillSupport,at=(s,t)=>s,lt={toAttribute(s,t){switch(t){case Boolean:s=s?qi:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,t){let e=s;switch(t){case Boolean:e=s!==null;break;case Number:e=s===null?null:Number(s);break;case Object:case Array:try{e=JSON.parse(s)}catch{e=null}}return e}},Ot=(s,t)=>!Li(s,t),qe={attribute:!0,type:String,converter:lt,reflect:!1,hasChanged:Ot};Symbol.metadata??=Symbol("metadata"),Pt.litPropertyMetadata??=new WeakMap;var T=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=qe){if(e.state&&(e.attribute=!1),this._$Ei(),this.elementProperties.set(t,e),!e.noAccessor){let i=Symbol(),r=this.getPropertyDescriptor(t,i,e);r!==void 0&&Bi(this.prototype,t,r)}}static getPropertyDescriptor(t,e,i){let{get:r,set:n}=Ii(this.prototype,t)??{get(){return this[e]},set(o){this[e]=o}};return{get(){return r?.call(this)},set(o){let l=r?.call(this);n.call(this,o),this.requestUpdate(t,l,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??qe}static _$Ei(){if(this.hasOwnProperty(at("elementProperties")))return;let t=Vi(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(at("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(at("properties"))){let e=this.properties,i=[...zi(e),...Ki(e)];for(let r of i)this.createProperty(r,e[r])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[i,r]of e)this.elementProperties.set(i,r)}this._$Eh=new Map;for(let[e,i]of this.elementProperties){let r=this._$Eu(e,i);r!==void 0&&this._$Eh.set(r,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let i=new Set(t.flat(1/0).reverse());for(let r of i)e.unshift(kt(r))}else t!==void 0&&e.push(kt(t));return e}static _$Eu(t,e){let i=e.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$Eg=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$ES(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$E_??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$E_?.delete(t)}_$ES(){let t=new Map,e=this.constructor.elementProperties;for(let i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return de(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$E_?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$E_?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$EO(t,e){let i=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,i);if(r!==void 0&&i.reflect===!0){let n=(i.converter?.toAttribute!==void 0?i.converter:lt).toAttribute(e,i.type);this._$Em=t,n==null?this.removeAttribute(r):this.setAttribute(r,n),this._$Em=null}}_$AK(t,e){let i=this.constructor,r=i._$Eh.get(t);if(r!==void 0&&this._$Em!==r){let n=i.getPropertyOptions(r),o=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:lt;this._$Em=r,this[r]=o.fromAttribute(e,n.type),this._$Em=null}}requestUpdate(t,e,i,r=!1,n){if(t!==void 0){if(i??=this.constructor.getPropertyOptions(t),!(i.hasChanged??Ot)(r?n:this[t],e))return;this.C(t,e,i)}this.isUpdatePending===!1&&(this._$Eg=this._$EP())}C(t,e,i){this._$AL.has(t)||this._$AL.set(t,e),i.reflect===!0&&this._$Em!==t&&(this._$Ej??=new Set).add(t)}async _$EP(){this.isUpdatePending=!0;try{await this._$Eg}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,n]of this._$Ep)this[r]=n;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[r,n]of i)n.wrapped!==!0||this._$AL.has(r)||this[r]===void 0||this.C(r,this[r],n)}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$E_?.forEach(i=>i.hostUpdate?.()),this.update(e)):this._$ET()}catch(i){throw t=!1,this._$ET(),i}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$E_?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$ET(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$Eg}shouldUpdate(t){return!0}update(t){this._$Ej&&=this._$Ej.forEach(e=>this._$EO(e,this[e])),this._$ET()}updated(t){}firstUpdated(t){}};T.elementStyles=[],T.shadowRootOptions={mode:"open"},T[at("elementProperties")]=new Map,T[at("finalized")]=new Map,Gi?.({ReactiveElement:T}),(Pt.reactiveElementVersions??=[]).push("2.0.2");var ue=globalThis,Tt=ue.trustedTypes,Ge=Tt?Tt.createPolicy("lit-html",{createHTML:s=>s}):void 0,fe="$lit$",H=`lit$${(Math.random()+"").slice(9)}$`,me="?"+H,Wi=`<${me}>`,q=document,ht=()=>q.createComment(""),dt=s=>s===null||typeof s!="object"&&typeof s!="function",Qe=Array.isArray,Xe=s=>Qe(s)||typeof s?.[Symbol.iterator]=="function",pe=`[ 	
\f\r]`,ct=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,We=/-->/g,Fe=/>/g,K=RegExp(`>|${pe}(?:([^\\s"'>=/]+)(${pe}*=${pe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Je=/'/g,Ze=/"/g,ti=/^(?:script|style|textarea|title)$/i,ei=s=>(t,...e)=>({_$litType$:s,strings:t,values:e}),g=ei(1),Es=ei(2),A=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),Ye=new WeakMap,V=q.createTreeWalker(q,129);function ii(s,t){if(!Array.isArray(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ge!==void 0?Ge.createHTML(t):t}var si=(s,t)=>{let e=s.length-1,i=[],r,n=t===2?"<svg>":"",o=ct;for(let l=0;l<e;l++){let a=s[l],h,d,c=-1,p=0;for(;p<a.length&&(o.lastIndex=p,d=o.exec(a),d!==null);)p=o.lastIndex,o===ct?d[1]==="!--"?o=We:d[1]!==void 0?o=Fe:d[2]!==void 0?(ti.test(d[2])&&(r=RegExp("</"+d[2],"g")),o=K):d[3]!==void 0&&(o=K):o===K?d[0]===">"?(o=r??ct,c=-1):d[1]===void 0?c=-2:(c=o.lastIndex-d[2].length,h=d[1],o=d[3]===void 0?K:d[3]==='"'?Ze:Je):o===Ze||o===Je?o=K:o===We||o===Fe?o=ct:(o=K,r=void 0);let u=o===K&&s[l+1].startsWith("/>")?" ":"";n+=o===ct?a+Wi:c>=0?(i.push(h),a.slice(0,c)+fe+a.slice(c)+H+u):a+H+(c===-2?l:u)}return[ii(s,n+(s[e]||"<?>")+(t===2?"</svg>":"")),i]},pt=class s{constructor({strings:t,_$litType$:e},i){let r;this.parts=[];let n=0,o=0,l=t.length-1,a=this.parts,[h,d]=si(t,e);if(this.el=s.createElement(h,i),V.currentNode=this.el.content,e===2){let c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(r=V.nextNode())!==null&&a.length<l;){if(r.nodeType===1){if(r.hasAttributes())for(let c of r.getAttributeNames())if(c.endsWith(fe)){let p=d[o++],u=r.getAttribute(c).split(H),f=/([.?@])?(.*)/.exec(p);a.push({type:1,index:n,name:f[2],strings:u,ctor:f[1]==="."?Rt:f[1]==="?"?Mt:f[1]==="@"?Ut:W}),r.removeAttribute(c)}else c.startsWith(H)&&(a.push({type:6,index:n}),r.removeAttribute(c));if(ti.test(r.tagName)){let c=r.textContent.split(H),p=c.length-1;if(p>0){r.textContent=Tt?Tt.emptyScript:"";for(let u=0;u<p;u++)r.append(c[u],ht()),V.nextNode(),a.push({type:2,index:++n});r.append(c[p],ht())}}}else if(r.nodeType===8)if(r.data===me)a.push({type:2,index:n});else{let c=-1;for(;(c=r.data.indexOf(H,c+1))!==-1;)a.push({type:7,index:n}),c+=H.length-1}n++}}static createElement(t,e){let i=q.createElement("template");return i.innerHTML=t,i}};function G(s,t,e=s,i){if(t===A)return t;let r=i!==void 0?e._$Co?.[i]:e._$Cl,n=dt(t)?void 0:t._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),n===void 0?r=void 0:(r=new n(s),r._$AT(s,e,i)),i!==void 0?(e._$Co??=[])[i]=r:e._$Cl=r),r!==void 0&&(t=G(s,r._$AS(s,t.values),r,i)),t}var Ht=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:i}=this._$AD,r=(t?.creationScope??q).importNode(e,!0);V.currentNode=r;let n=V.nextNode(),o=0,l=0,a=i[0];for(;a!==void 0;){if(o===a.index){let h;a.type===2?h=new X(n,n.nextSibling,this,t):a.type===1?h=new a.ctor(n,a.name,a.strings,this,t):a.type===6&&(h=new Nt(n,this,t)),this._$AV.push(h),a=i[++l]}o!==a?.index&&(n=V.nextNode(),o++)}return V.currentNode=q,r}p(t){let e=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}},X=class s{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,r){this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=G(this,t,e),dt(t)?t===m||t==null||t===""?(this._$AH!==m&&this._$AR(),this._$AH=m):t!==this._$AH&&t!==A&&this._(t):t._$litType$!==void 0?this.g(t):t.nodeType!==void 0?this.$(t):Xe(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==m&&dt(this._$AH)?this._$AA.nextSibling.data=t:this.$(q.createTextNode(t)),this._$AH=t}g(t){let{values:e,_$litType$:i}=t,r=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=pt.createElement(ii(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===r)this._$AH.p(e);else{let n=new Ht(r,this),o=n.u(this.options);n.p(e),this.$(o),this._$AH=n}}_$AC(t){let e=Ye.get(t.strings);return e===void 0&&Ye.set(t.strings,e=new pt(t)),e}T(t){Qe(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,i,r=0;for(let n of t)r===e.length?e.push(i=new s(this.k(ht()),this.k(ht()),this,this.options)):i=e[r],i._$AI(n),r++;r<e.length&&(this._$AR(i&&i._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t&&t!==this._$AB;){let i=t.nextSibling;t.remove(),t=i}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},W=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,r,n){this.type=1,this._$AH=m,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=m}_$AI(t,e=this,i,r){let n=this.strings,o=!1;if(n===void 0)t=G(this,t,e,0),o=!dt(t)||t!==this._$AH&&t!==A,o&&(this._$AH=t);else{let l=t,a,h;for(t=n[0],a=0;a<n.length-1;a++)h=G(this,l[i+a],e,a),h===A&&(h=this._$AH[a]),o||=!dt(h)||h!==this._$AH[a],h===m?t=m:t!==m&&(t+=(h??"")+n[a+1]),this._$AH[a]=h}o&&!r&&this.O(t)}O(t){t===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Rt=class extends W{constructor(){super(...arguments),this.type=3}O(t){this.element[this.name]=t===m?void 0:t}},Mt=class extends W{constructor(){super(...arguments),this.type=4}O(t){this.element.toggleAttribute(this.name,!!t&&t!==m)}},Ut=class extends W{constructor(t,e,i,r,n){super(t,e,i,r,n),this.type=5}_$AI(t,e=this){if((t=G(this,t,e,0)??m)===A)return;let i=this._$AH,r=t===m&&i!==m||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==m&&(i===m||r);r&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Nt=class{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){G(this,t)}},ri={j:fe,P:H,A:me,C:1,M:si,L:Ht,R:Xe,V:G,D:X,I:W,H:Mt,N:Ut,U:Rt,B:Nt},Fi=ue.litHtmlPolyfillSupport;Fi?.(pt,X),(ue.litHtmlVersions??=[]).push("3.1.0");var ni=(s,t,e)=>{let i=e?.renderBefore??t,r=i._$litPart$;if(r===void 0){let n=e?.renderBefore??null;i._$litPart$=r=new X(t.insertBefore(ht(),n),n,void 0,e??{})}return r._$AI(s),r};var j=class extends T{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=ni(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return A}};j._$litElement$=!0,j["finalized"]=!0,globalThis.litElementHydrateSupport?.({LitElement:j});var Ji=globalThis.litElementPolyfillSupport;Ji?.({LitElement:j});(globalThis.litElementVersions??=[]).push("4.0.2");var N=s=>(t,e)=>{e!==void 0?e.addInitializer(()=>{customElements.define(s,t)}):customElements.define(s,t)};var Zi={attribute:!0,type:String,converter:lt,reflect:!1,hasChanged:Ot},Yi=(s=Zi,t,e)=>{let{kind:i,metadata:r}=e,n=globalThis.litPropertyMetadata.get(r);if(n===void 0&&globalThis.litPropertyMetadata.set(r,n=new Map),n.set(e.name,s),i==="accessor"){let{name:o}=e;return{set(l){let a=t.get.call(this);t.set.call(this,l),this.requestUpdate(o,a,s)},init(l){return l!==void 0&&this.C(o,void 0,s),l}}}if(i==="setter"){let{name:o}=e;return function(l){let a=this[o];t.call(this,l),this.requestUpdate(o,a,s)}}throw Error("Unsupported decorator location: "+i)};function y(s){return(t,e)=>typeof e=="object"?Yi(s,t,e):((i,r,n)=>{let o=r.hasOwnProperty(n);return r.constructor.createProperty(n,o?{...i,wrapped:!0}:i),o?Object.getOwnPropertyDescriptor(r,n):void 0})(s,t,e)}function R(s){return y({...s,state:!0,attribute:!1})}var S={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},P=s=>(...t)=>({_$litDirective$:s,values:t}),k=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};var{D:Qi}=ri;var Lt=s=>s.strings===void 0,oi=()=>document.createComment(""),tt=(s,t,e)=>{let i=s._$AA.parentNode,r=t===void 0?s._$AB:t._$AA;if(e===void 0){let n=i.insertBefore(oi(),r),o=i.insertBefore(oi(),r);e=new Qi(n,o,s,s.options)}else{let n=e._$AB.nextSibling,o=e._$AM,l=o!==s;if(l){let a;e._$AQ?.(s),e._$AM=s,e._$AP!==void 0&&(a=s._$AU)!==o._$AU&&e._$AP(a)}if(n!==r||l){let a=e._$AA;for(;a!==n;){let h=a.nextSibling;i.insertBefore(a,r),a=h}}}return e},D=(s,t,e=s)=>(s._$AI(t,e),s),Xi={},Bt=(s,t=Xi)=>s._$AH=t,ai=s=>s._$AH,It=s=>{s._$AP?.(!1,!0);let t=s._$AA,e=s._$AB.nextSibling;for(;t!==e;){let i=t.nextSibling;t.remove(),t=i}};var li=(s,t,e)=>{let i=new Map;for(let r=t;r<=e;r++)i.set(s[r],r);return i},ci=P(class extends k{constructor(s){if(super(s),s.type!==S.CHILD)throw Error("repeat() can only be used in text expressions")}ht(s,t,e){let i;e===void 0?e=t:t!==void 0&&(i=t);let r=[],n=[],o=0;for(let l of s)r[o]=i?i(l,o):o,n[o]=e(l,o),o++;return{values:n,keys:r}}render(s,t,e){return this.ht(s,t,e).values}update(s,[t,e,i]){let r=ai(s),{values:n,keys:o}=this.ht(t,e,i);if(!Array.isArray(r))return this.dt=o,n;let l=this.dt??=[],a=[],h,d,c=0,p=r.length-1,u=0,f=n.length-1;for(;c<=p&&u<=f;)if(r[c]===null)c++;else if(r[p]===null)p--;else if(l[c]===o[u])a[u]=D(r[c],n[u]),c++,u++;else if(l[p]===o[f])a[f]=D(r[p],n[f]),p--,f--;else if(l[c]===o[f])a[f]=D(r[c],n[f]),tt(s,a[f+1],r[c]),c++,f--;else if(l[p]===o[u])a[u]=D(r[p],n[u]),tt(s,r[c],r[p]),p--,u++;else if(h===void 0&&(h=li(o,u,f),d=li(l,c,p)),h.has(l[c]))if(h.has(l[p])){let E=d.get(o[u]),Jt=E!==void 0?r[E]:null;if(Jt===null){let we=tt(s,r[c]);D(we,n[u]),a[u]=we}else a[u]=D(Jt,n[u]),tt(s,r[c],Jt),r[E]=null;u++}else It(r[p]),p--;else It(r[c]),c++;for(;u<=f;){let E=tt(s,a[f+1]);D(E,n[u]),a[u++]=E}for(;c<=p;){let E=r[c++];E!==null&&It(E)}return this.dt=o,Bt(s,a),A}});var hi=P(class extends k{constructor(s){if(super(s),s.type!==S.PROPERTY&&s.type!==S.ATTRIBUTE&&s.type!==S.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!Lt(s))throw Error("`live` bindings can only contain a single expression")}render(s){return s}update(s,[t]){if(t===A||t===m)return t;let e=s.element,i=s.name;if(s.type===S.PROPERTY){if(t===e[i])return A}else if(s.type===S.BOOLEAN_ATTRIBUTE){if(!!t===e.hasAttribute(i))return A}else if(s.type===S.ATTRIBUTE&&e.getAttribute(i)===t+"")return A;return Bt(s),t}});var ut=(s,t)=>{let e=s._$AN;if(e===void 0)return!1;for(let i of e)i._$AO?.(t,!1),ut(i,t);return!0},zt=s=>{let t,e;do{if((t=s._$AM)===void 0)break;e=t._$AN,e.delete(s),s=t}while(e?.size===0)},di=s=>{for(let t;t=s._$AM;s=t){let e=t._$AN;if(e===void 0)t._$AN=e=new Set;else if(e.has(s))break;e.add(s),is(t)}};function ts(s){this._$AN!==void 0?(zt(this),this._$AM=s,di(this)):this._$AM=s}function es(s,t=!1,e=0){let i=this._$AH,r=this._$AN;if(r!==void 0&&r.size!==0)if(t)if(Array.isArray(i))for(let n=e;n<i.length;n++)ut(i[n],!1),zt(i[n]);else i!=null&&(ut(i,!1),zt(i));else ut(this,s)}var is=s=>{s.type==S.CHILD&&(s._$AP??=es,s._$AQ??=ts)},Kt=class extends k{constructor(){super(...arguments),this._$AN=void 0}_$AT(t,e,i){super._$AT(t,e,i),di(this),this.isConnected=t._$AU}_$AO(t,e=!0){t!==this.isConnected&&(this.isConnected=t,t?this.reconnected?.():this.disconnected?.()),e&&(ut(this,t),zt(this))}setValue(t){if(Lt(this._$Ct))this._$Ct._$AI(t,this);else{let e=[...this._$Ct._$AH];e[this._$Ci]=t,this._$Ct._$AI(e,this,0)}}disconnected(){}reconnected(){}};var Vt=()=>new ve,ve=class{},ye=new WeakMap,qt=P(class extends Kt{render(s){return m}update(s,[t]){let e=t!==this.G;return e&&this.G!==void 0&&this.ot(void 0),(e||this.rt!==this.lt)&&(this.G=t,this.ct=s.options?.host,this.ot(this.lt=s.element)),m}ot(s){if(typeof this.G=="function"){let t=this.ct??globalThis,e=ye.get(t);e===void 0&&(e=new WeakMap,ye.set(t,e)),e.get(this.G)!==void 0&&this.G.call(this.ct,void 0),e.set(this.G,s),s!==void 0&&this.G.call(this.ct,s)}else this.G.value=s}get rt(){return typeof this.G=="function"?ye.get(this.ct??globalThis)?.get(this.G):this.G?.value}disconnected(){this.rt===this.lt&&this.ot(void 0)}reconnected(){this.ot(this.lt)}});var ft=P(class extends k{constructor(s){if(super(s),s.type!==S.ATTRIBUTE||s.name!=="class"||s.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(s){return" "+Object.keys(s).filter(t=>s[t]).join(" ")+" "}update(s,[t]){if(this.it===void 0){this.it=new Set,s.strings!==void 0&&(this.st=new Set(s.strings.join(" ").split(/\s/).filter(i=>i!=="")));for(let i in t)t[i]&&!this.st?.has(i)&&this.it.add(i);return this.render(t)}let e=s.element.classList;for(let i of this.it)i in t||(e.remove(i),this.it.delete(i));for(let i in t){let r=!!t[i];r===this.it.has(i)||this.st?.has(i)||(r?(e.add(i),this.it.add(i)):(e.remove(i),this.it.delete(i)))}return A}});var _e=typeof navigator<"u"?navigator.userAgent.toLowerCase().indexOf("firefox")>0:!1;function ge(s,t,e){s.addEventListener?s.addEventListener(t,e,!1):s.attachEvent&&s.attachEvent("on".concat(t),function(){e(window.event)})}function yi(s,t){for(var e=t.slice(0,t.length-1),i=0;i<e.length;i++)e[i]=s[e[i].toLowerCase()];return e}function vi(s){typeof s!="string"&&(s=""),s=s.replace(/\s/g,"");for(var t=s.split(","),e=t.lastIndexOf("");e>=0;)t[e-1]+=",",t.splice(e,1),e=t.lastIndexOf("");return t}function ss(s,t){for(var e=s.length>=t.length?s:t,i=s.length>=t.length?t:s,r=!0,n=0;n<e.length;n++)i.indexOf(e[n])===-1&&(r=!1);return r}var _i={backspace:8,tab:9,clear:12,enter:13,return:13,esc:27,escape:27,space:32,left:37,up:38,right:39,down:40,del:46,delete:46,ins:45,insert:45,home:36,end:35,pageup:33,pagedown:34,capslock:20,num_0:96,num_1:97,num_2:98,num_3:99,num_4:100,num_5:101,num_6:102,num_7:103,num_8:104,num_9:105,num_multiply:106,num_add:107,num_enter:108,num_subtract:109,num_decimal:110,num_divide:111,"\u21EA":20,",":188,".":190,"/":191,"`":192,"-":_e?173:189,"=":_e?61:187,";":_e?59:186,"'":222,"[":219,"]":221,"\\":220},F={"\u21E7":16,shift:16,"\u2325":18,alt:18,option:18,"\u2303":17,ctrl:17,control:17,"\u2318":91,cmd:91,command:91},pi={16:"shiftKey",18:"altKey",17:"ctrlKey",91:"metaKey",shiftKey:16,ctrlKey:17,altKey:18,metaKey:91},x={16:!1,18:!1,17:!1,91:!1},w={};for(mt=1;mt<20;mt++)_i["f".concat(mt)]=111+mt;var mt,v=[],gi="all",$i=[],Wt=function(t){return _i[t.toLowerCase()]||F[t.toLowerCase()]||t.toUpperCase().charCodeAt(0)};function bi(s){gi=s||"all"}function yt(){return gi||"all"}function rs(){return v.slice(0)}function ns(s){var t=s.target||s.srcElement,e=t.tagName,i=!0;return(t.isContentEditable||(e==="INPUT"||e==="TEXTAREA"||e==="SELECT")&&!t.readOnly)&&(i=!1),i}function os(s){return typeof s=="string"&&(s=Wt(s)),v.indexOf(s)!==-1}function as(s,t){var e,i;s||(s=yt());for(var r in w)if(Object.prototype.hasOwnProperty.call(w,r))for(e=w[r],i=0;i<e.length;)e[i].scope===s?e.splice(i,1):i++;yt()===s&&bi(t||"all")}function ls(s){var t=s.keyCode||s.which||s.charCode,e=v.indexOf(t);if(e>=0&&v.splice(e,1),s.key&&s.key.toLowerCase()==="meta"&&v.splice(0,v.length),(t===93||t===224)&&(t=91),t in x){x[t]=!1;for(var i in F)F[i]===t&&(M[i]=!1)}}function cs(s){if(!s)Object.keys(w).forEach(function(o){return delete w[o]});else if(Array.isArray(s))s.forEach(function(o){o.key&&$e(o)});else if(typeof s=="object")s.key&&$e(s);else if(typeof s=="string"){for(var t=arguments.length,e=new Array(t>1?t-1:0),i=1;i<t;i++)e[i-1]=arguments[i];var r=e[0],n=e[1];typeof r=="function"&&(n=r,r=""),$e({key:s,scope:r,method:n,splitKey:"+"})}}var $e=function(t){var e=t.key,i=t.scope,r=t.method,n=t.splitKey,o=n===void 0?"+":n,l=vi(e);l.forEach(function(a){var h=a.split(o),d=h.length,c=h[d-1],p=c==="*"?"*":Wt(c);if(w[p]){i||(i=yt());var u=d>1?yi(F,h):[];w[p]=w[p].map(function(f){var E=r?f.method===r:!0;return E&&f.scope===i&&ss(f.mods,u)?{}:f})}})};function ui(s,t,e){var i;if(t.scope===e||t.scope==="all"){i=t.mods.length>0;for(var r in x)Object.prototype.hasOwnProperty.call(x,r)&&(!x[r]&&t.mods.indexOf(+r)>-1||x[r]&&t.mods.indexOf(+r)===-1)&&(i=!1);(t.mods.length===0&&!x[16]&&!x[18]&&!x[17]&&!x[91]||i||t.shortcut==="*")&&t.method(s,t)===!1&&(s.preventDefault?s.preventDefault():s.returnValue=!1,s.stopPropagation&&s.stopPropagation(),s.cancelBubble&&(s.cancelBubble=!0))}}function fi(s){var t=w["*"],e=s.keyCode||s.which||s.charCode;if(M.filter.call(this,s)){if((e===93||e===224)&&(e=91),v.indexOf(e)===-1&&e!==229&&v.push(e),["ctrlKey","altKey","shiftKey","metaKey"].forEach(function(u){var f=pi[u];s[u]&&v.indexOf(f)===-1?v.push(f):!s[u]&&v.indexOf(f)>-1?v.splice(v.indexOf(f),1):u==="metaKey"&&s[u]&&v.length===3&&(s.ctrlKey||s.shiftKey||s.altKey||(v=v.slice(v.indexOf(f))))}),e in x){x[e]=!0;for(var i in F)F[i]===e&&(M[i]=!0);if(!t)return}for(var r in x)Object.prototype.hasOwnProperty.call(x,r)&&(x[r]=s[pi[r]]);s.getModifierState&&!(s.altKey&&!s.ctrlKey)&&s.getModifierState("AltGraph")&&(v.indexOf(17)===-1&&v.push(17),v.indexOf(18)===-1&&v.push(18),x[17]=!0,x[18]=!0);var n=yt();if(t)for(var o=0;o<t.length;o++)t[o].scope===n&&(s.type==="keydown"&&t[o].keydown||s.type==="keyup"&&t[o].keyup)&&ui(s,t[o],n);if(e in w){for(var l=0;l<w[e].length;l++)if((s.type==="keydown"&&w[e][l].keydown||s.type==="keyup"&&w[e][l].keyup)&&w[e][l].key){for(var a=w[e][l],h=a.splitKey,d=a.key.split(h),c=[],p=0;p<d.length;p++)c.push(Wt(d[p]));c.sort().join("")===v.sort().join("")&&ui(s,a,n)}}}}function hs(s){return $i.indexOf(s)>-1}function M(s,t,e){v=[];var i=vi(s),r=[],n="all",o=document,l=0,a=!1,h=!0,d="+";for(e===void 0&&typeof t=="function"&&(e=t),Object.prototype.toString.call(t)==="[object Object]"&&(t.scope&&(n=t.scope),t.element&&(o=t.element),t.keyup&&(a=t.keyup),t.keydown!==void 0&&(h=t.keydown),typeof t.splitKey=="string"&&(d=t.splitKey)),typeof t=="string"&&(n=t);l<i.length;l++)s=i[l].split(d),r=[],s.length>1&&(r=yi(F,s)),s=s[s.length-1],s=s==="*"?"*":Wt(s),s in w||(w[s]=[]),w[s].push({keyup:a,keydown:h,scope:n,mods:r,shortcut:i[l],method:e,key:i[l],splitKey:d});typeof o<"u"&&!hs(o)&&window&&($i.push(o),ge(o,"keydown",function(c){fi(c)}),ge(window,"focus",function(){v=[]}),ge(o,"keyup",function(c){fi(c),ls(c)}))}var be={setScope:bi,getScope:yt,deleteScope:as,getPressedKeyCodes:rs,isPressed:os,filter:ns,unbind:cs};for(Gt in be)Object.prototype.hasOwnProperty.call(be,Gt)&&(M[Gt]=be[Gt]);var Gt;typeof window<"u"&&(mi=window.hotkeys,M.noConflict=function(s){return s&&window.hotkeys===M&&(window.hotkeys=mi),M},window.hotkeys=M);var mi,C=M;var vt=function(s,t,e,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,e):i,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,i);else for(var l=s.length-1;l>=0;l--)(o=s[l])&&(n=(r<3?o(n):r>3?o(t,e,n):o(t,e))||n);return r>3&&n&&Object.defineProperty(t,e,n),n},J=class extends j{constructor(){super(...arguments),this.placeholder="",this.hideBreadcrumbs=!1,this.breadcrumbHome="Home",this.breadcrumbs=[],this._inputRef=Vt()}render(){let t="";if(!this.hideBreadcrumbs){let e=[];for(let i of this.breadcrumbs)e.push(g`<button
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
          ${qt(this._inputRef)}
          placeholder="${this.placeholder}"
          class="search"
        />
      </div>
    `}setSearch(t){this._inputRef.value&&(this._inputRef.value.value=t)}focusSearch(){requestAnimationFrame(()=>this._inputRef.value.focus())}_handleInput(t){let e=t.target;this.dispatchEvent(new CustomEvent("change",{detail:{search:e.value},bubbles:!1,composed:!1}))}selectParent(t){this.dispatchEvent(new CustomEvent("setParent",{detail:{parent:t},bubbles:!0,composed:!0}))}firstUpdated(){this.focusSearch()}_close(){this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}};J.styles=O`
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
  `;vt([y()],J.prototype,"placeholder",void 0);vt([y({type:Boolean})],J.prototype,"hideBreadcrumbs",void 0);vt([y()],J.prototype,"breadcrumbHome",void 0);vt([y({type:Array})],J.prototype,"breadcrumbs",void 0);J=vt([N("ninja-header")],J);var _t=class extends k{constructor(t){if(super(t),this.et=m,t.type!==S.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===m||t==null)return this.vt=void 0,this.et=t;if(t===A)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.et)return this.vt;this.et=t;let e=[t];return e.raw=e,this.vt={_$litType$:this.constructor.resultType,strings:e,values:[]}}};_t.directiveName="unsafeHTML",_t.resultType=1;var Ai=P(_t);function*wi(s,t){let e=typeof t=="function";if(s!==void 0){let i=-1;for(let r of s)i>-1&&(yield e?t(i):t),i++,yield r}}function xi(s,t,e,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,e):i,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,i);else for(var l=s.length-1;l>=0;l--)(o=s[l])&&(n=(r<3?o(n):r>3?o(t,e,n):o(t,e))||n);return r>3&&n&&Object.defineProperty(t,e,n),n}var Ei=O`:host{font-family:var(--mdc-icon-font, "Material Icons");font-weight:normal;font-style:normal;font-size:var(--mdc-icon-size, 24px);line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale;font-feature-settings:"liga"}`;var Ae=class extends j{render(){return g`<span><slot></slot></span>`}};Ae.styles=[Ei];Ae=xi([N("mwc-icon")],Ae);var Ft=function(s,t,e,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,e):i,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,i);else for(var l=s.length-1;l>=0;l--)(o=s[l])&&(n=(r<3?o(n):r>3?o(t,e,n):o(t,e))||n);return r>3&&n&&Object.defineProperty(t,e,n),n},et=class extends j{constructor(){super(),this.selected=!1,this.hotKeysJoinedView=!0,this.addEventListener("click",this.click)}ensureInView(){requestAnimationFrame(()=>this.scrollIntoView({block:"nearest"}))}click(){this.dispatchEvent(new CustomEvent("actionsSelected",{detail:this.action,bubbles:!0,composed:!0}))}updated(t){t.has("selected")&&this.selected&&this.ensureInView()}render(){let t;this.action.mdIcon?t=g`<mwc-icon part="ninja-icon" class="ninja-icon"
        >${this.action.mdIcon}</mwc-icon
      >`:this.action.icon&&(t=Ai(this.action.icon||""));let e;this.action.hotkey&&(this.hotKeysJoinedView?e=this.action.hotkey.split(",").map(r=>{let n=r.split("+"),o=g`${wi(n.map(l=>g`<kbd>${l}</kbd>`),"+")}`;return g`<div class="ninja-hotkey ninja-hotkeys">
            ${o}
          </div>`}):e=this.action.hotkey.split(",").map(r=>{let o=r.split("+").map(l=>g`<kbd class="ninja-hotkey">${l}</kbd>`);return g`<kbd class="ninja-hotkeys">${o}</kbd>`}));let i={selected:this.selected,"ninja-action":!0};return g`
      <div
        class="ninja-action"
        part="ninja-action ${this.selected?"ninja-selected":""}"
        class=${ft(i)}
      >
        ${t}
        <div class="ninja-title">${this.action.title}</div>
        ${e}
      </div>
    `}};et.styles=O`
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
  `;Ft([y({type:Object})],et.prototype,"action",void 0);Ft([y({type:Boolean})],et.prototype,"selected",void 0);Ft([y({type:Boolean})],et.prototype,"hotKeysJoinedView",void 0);et=Ft([N("ninja-action")],et);var Si=g` <div class="modal-footer" slot="footer">
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
</div>`;var ji=O`
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
`;var $=function(s,t,e,i){var r=arguments.length,n=r<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,e):i,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,i);else for(var l=s.length-1;l>=0;l--)(o=s[l])&&(n=(r<3?o(n):r>3?o(t,e,n):o(t,e))||n);return r>3&&n&&Object.defineProperty(t,e,n),n},_=class extends j{constructor(){super(...arguments),this.placeholder="Type a command or search...",this.disableHotkeys=!1,this.hideBreadcrumbs=!1,this.openHotkey="cmd+k,ctrl+k",this.navigationUpHotkey="up,shift+tab",this.navigationDownHotkey="down,tab",this.closeHotkey="esc",this.goBackHotkey="backspace",this.selectHotkey="enter",this.hotKeysJoinedView=!1,this.noAutoLoadMdIcons=!1,this.data=[],this.visible=!1,this._bump=!0,this._actionMatches=[],this._search="",this._flatData=[],this._headerRef=Vt()}open(t={}){this._bump=!0,this.visible=!0,this._headerRef.value.focusSearch(),this._actionMatches.length>0&&(this._selected=this._actionMatches[0]),this.setParent(t.parent)}close(){this._bump=!1,this.visible=!1}setParent(t){t?this._currentRoot=t:this._currentRoot=void 0,this._selected=void 0,this._search="",this._headerRef.value.setSearch("")}get breadcrumbs(){var t;let e=[],i=(t=this._selected)===null||t===void 0?void 0:t.parent;if(i)for(e.push(i);i;){let r=this._flatData.find(n=>n.id===i);r?.parent&&e.push(r.parent),i=r?r.parent:void 0}return e.reverse()}connectedCallback(){super.connectedCallback(),this.noAutoLoadMdIcons||document.fonts.load("24px Material Icons","apps").then(()=>{}),this._registerInternalHotkeys()}disconnectedCallback(){super.disconnectedCallback(),this._unregisterInternalHotkeys()}_flattern(t,e){let i=[];return t||(t=[]),t.map(r=>{let n=r.children&&r.children.some(l=>typeof l=="string"),o={...r,parent:r.parent||e};return n||(o.children&&o.children.length&&(e=r.id,i=[...i,...o.children]),o.children=o.children?o.children.map(l=>l.id):[]),o}).concat(i.length?this._flattern(i,e):i)}update(t){t.has("data")&&!this.disableHotkeys&&(this._flatData=this._flattern(this.data),this._flatData.filter(e=>!!e.hotkey).forEach(e=>{C(e.hotkey,i=>{i.preventDefault(),e.handler&&e.handler(e)})})),super.update(t)}_registerInternalHotkeys(){this.openHotkey&&C(this.openHotkey,t=>{t.preventDefault(),this.visible?this.close():this.open()}),this.selectHotkey&&C(this.selectHotkey,t=>{this.visible&&(t.preventDefault(),this._actionSelected(this._actionMatches[this._selectedIndex]))}),this.goBackHotkey&&C(this.goBackHotkey,t=>{this.visible&&(this._search||(t.preventDefault(),this._goBack()))}),this.navigationDownHotkey&&C(this.navigationDownHotkey,t=>{this.visible&&(t.preventDefault(),this._selectedIndex>=this._actionMatches.length-1?this._selected=this._actionMatches[0]:this._selected=this._actionMatches[this._selectedIndex+1])}),this.navigationUpHotkey&&C(this.navigationUpHotkey,t=>{this.visible&&(t.preventDefault(),this._selectedIndex===0?this._selected=this._actionMatches[this._actionMatches.length-1]:this._selected=this._actionMatches[this._selectedIndex-1])}),this.closeHotkey&&C(this.closeHotkey,()=>{this.visible&&this.close()})}_unregisterInternalHotkeys(){this.openHotkey&&C.unbind(this.openHotkey),this.selectHotkey&&C.unbind(this.selectHotkey),this.goBackHotkey&&C.unbind(this.goBackHotkey),this.navigationDownHotkey&&C.unbind(this.navigationDownHotkey),this.navigationUpHotkey&&C.unbind(this.navigationUpHotkey),this.closeHotkey&&C.unbind(this.closeHotkey)}_actionFocused(t,e){this._selected=t,e.target.ensureInView()}_onTransitionEnd(){this._bump=!1}_goBack(){let t=this.breadcrumbs.length>1?this.breadcrumbs[this.breadcrumbs.length-2]:void 0;this.setParent(t)}render(){let t={bump:this._bump,"modal-content":!0},e={visible:this.visible,modal:!0},r=this._flatData.filter(l=>{var a;let h=new RegExp(this._search,"gi"),d=l.title.match(h)||((a=l.keywords)===null||a===void 0?void 0:a.match(h));return(!this._currentRoot&&this._search||l.parent===this._currentRoot)&&d}).reduce((l,a)=>l.set(a.section,[...l.get(a.section)||[],a]),new Map);this._actionMatches=[...r.values()].flat(),this._actionMatches.length>0&&this._selectedIndex===-1&&(this._selected=this._actionMatches[0]),this._actionMatches.length===0&&(this._selected=void 0);let n=l=>g` ${ci(l,a=>a.id,a=>{var h;return g`<ninja-action
            exportparts="ninja-action,ninja-selected,ninja-icon"
            .selected=${hi(a.id===((h=this._selected)===null||h===void 0?void 0:h.id))}
            .hotKeysJoinedView=${this.hotKeysJoinedView}
            @mouseover=${d=>this._actionFocused(a,d)}
            @actionsSelected=${d=>this._actionSelected(d.detail)}
            .action=${a}
          ></ninja-action>`})}`,o=[];return r.forEach((l,a)=>{let h=a?g`<div class="group-header">${a}</div>`:void 0;o.push(g`${h}${n(l)}`)}),g`
      <div @click=${this._overlayClick} class=${ft(e)}>
        <div class=${ft(t)} @animationend=${this._onTransitionEnd}>
          <ninja-header
            exportparts="ninja-input,ninja-input-wrapper"
            ${qt(this._headerRef)}
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
          <slot name="footer"> ${Si} </slot>
        </div>
      </div>
    `}get _selectedIndex(){return this._selected?this._actionMatches.indexOf(this._selected):-1}_actionSelected(t){var e;if(this.dispatchEvent(new CustomEvent("selected",{detail:{search:this._search,action:t},bubbles:!0,composed:!0})),!!t){if(t.children&&((e=t.children)===null||e===void 0?void 0:e.length)>0&&(this._currentRoot=t.id,this._search=""),this._headerRef.value.setSearch(""),this._headerRef.value.focusSearch(),t.handler){let i=t.handler(t);i?.keepOpen||this.close()}this._bump=!0}}async _handleInput(t){this._search=t.detail.search,await this.updateComplete,this.dispatchEvent(new CustomEvent("change",{detail:{search:this._search,actions:this._actionMatches},bubbles:!0,composed:!0}))}_overlayClick(t){var e;!((e=t.target)===null||e===void 0)&&e.classList.contains("modal")&&this.close()}};_.styles=[ji];$([y({type:String})],_.prototype,"placeholder",void 0);$([y({type:Boolean})],_.prototype,"disableHotkeys",void 0);$([y({type:Boolean})],_.prototype,"hideBreadcrumbs",void 0);$([y()],_.prototype,"openHotkey",void 0);$([y()],_.prototype,"navigationUpHotkey",void 0);$([y()],_.prototype,"navigationDownHotkey",void 0);$([y()],_.prototype,"closeHotkey",void 0);$([y()],_.prototype,"goBackHotkey",void 0);$([y()],_.prototype,"selectHotkey",void 0);$([y({type:Boolean})],_.prototype,"hotKeysJoinedView",void 0);$([y({type:Boolean})],_.prototype,"noAutoLoadMdIcons",void 0);$([y({type:Array,hasChanged(){return!0}})],_.prototype,"data",void 0);$([R()],_.prototype,"visible",void 0);$([R()],_.prototype,"_bump",void 0);$([R()],_.prototype,"_actionMatches",void 0);$([R()],_.prototype,"_search",void 0);$([R()],_.prototype,"_currentRoot",void 0);$([R()],_.prototype,"_flatData",void 0);$([R()],_.prototype,"breadcrumbs",null);$([R()],_.prototype,"_selected",void 0);_=$([N("ninja-keys")],_);return Hi(ds);})();
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
