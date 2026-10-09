const outline='#344642',mint='#b9ceaa',cream='#fff6df';
const body=`<path d="M327 690 Q310 705 297 857 L277 1010 H747 L727 857 Q714 705 697 690" fill="#526d63" stroke="${outline}" stroke-width="14"/><path d="M388 699 L512 855 L636 699" fill="#df886d" stroke="${outline}" stroke-width="12"/><path d="M512 855 L490 972 L550 955 L551 837" fill="#df886d" stroke="${outline}" stroke-width="12"/><path d="M360 870 L350 975 M666 870 L677 975" stroke="#91aa8d" stroke-width="9" stroke-linecap="round"/>`;
const head=`<path d="M476 221 Q448 137 397 123 Q397 218 491 250" fill="#839b77" stroke="${outline}" stroke-width="12"/><path d="M514 236 Q533 120 611 100 Q621 220 514 253" fill="${mint}" stroke="${outline}" stroke-width="12"/><path d="M304 356 Q280 240 343 295 L401 331 M720 356 Q744 240 681 295 L623 331" fill="${mint}" stroke="${outline}" stroke-width="14"/><path d="M297 437 Q312 279 512 287 Q712 279 727 437 L744 541 Q756 731 512 761 Q268 731 280 541 Z" fill="${mint}" stroke="${outline}" stroke-width="14"/><path d="M341 524 Q353 410 512 420 Q671 410 683 524 L684 575 Q683 695 512 711 Q341 695 340 575 Z" fill="${cream}"/><ellipse cx="371" cy="578" rx="38" ry="22" fill="#e6aa8d" opacity=".65"/><ellipse cx="653" cy="578" rx="38" ry="22" fill="#e6aa8d" opacity=".65"/>`;
const eyes=`<ellipse cx="424" cy="524" rx="18" ry="25" fill="${outline}"/><ellipse cx="600" cy="524" rx="18" ry="25" fill="${outline}"/><circle cx="430" cy="517" r="6" fill="white"/><circle cx="606" cy="517" r="6" fill="white"/>`;
const blink=`<path d="M400 531 Q424 545 448 531 M576 531 Q600 545 624 531" fill="none" stroke="${outline}" stroke-width="12" stroke-linecap="round"/>`;
const smileEyes=`<path d="M401 533 Q424 503 447 533 M577 533 Q600 503 623 533" fill="none" stroke="${outline}" stroke-width="12" stroke-linecap="round"/>`;
const brows=`<path d="M405 466 L444 464 M580 464 L619 466" stroke="${outline}" stroke-width="10" stroke-linecap="round"/>`;
const raised=`<path d="M405 449 Q424 438 444 447 M580 447 Q600 438 619 449" fill="none" stroke="${outline}" stroke-width="10" stroke-linecap="round"/>`;
const mouth=`<path d="M486 611 Q512 632 538 611" fill="none" stroke="${outline}" stroke-width="11" stroke-linecap="round"/>`;
const talk=`<ellipse cx="512" cy="624" rx="30" ry="36" fill="${outline}"/><path d="M490 641 Q512 622 534 641 Q529 657 512 658 Q495 657 490 641" fill="#e39d90"/>`;
const mouthSmile=`<path d="M473 609 Q512 690 551 609 Z" fill="${outline}"/><path d="M480 610 L544 610 L534 626 L490 626 Z" fill="white"/>`;
const surprise=`<ellipse cx="512" cy="626" rx="24" ry="34" fill="${outline}"/>`;
const smileBlink=`<path d="M403 532 Q424 545 445 532 M579 532 Q600 545 621 532" fill="none" stroke="${outline}" stroke-width="12" stroke-linecap="round"/>`;
const smileTalk=`<path d="M470 608 Q512 595 554 608 Q556 667 512 671 Q468 667 470 608 Z" fill="${outline}"/><path d="M479 610 Q512 604 545 610 L538 626 L486 626 Z" fill="white"/><path d="M488 652 Q512 637 536 652 Q527 666 512 666 Q497 666 488 652" fill="#e39d90"/>`;
const surpriseTalk=`<ellipse cx="512" cy="626" rx="28" ry="42" fill="${outline}"/><path d="M493 652 Q512 638 531 652 Q524 664 512 664 Q500 664 493 652" fill="#e39d90"/>`;

// A three-quarter view with a narrower far eye and its own hood silhouette,
// face opening, ears, cheeks, and leaves. All features share a 1024px canvas.
const leftHead=`
<path d="M457 238 Q414 192 417 131 Q470 153 487 244" fill="#839b77" stroke="${outline}" stroke-width="12"/>
<path d="M491 239 Q523 130 595 112 Q604 223 491 256" fill="${mint}" stroke="${outline}" stroke-width="12"/>
<path d="M303 362 Q284 268 329 298 L374 336 M660 327 Q730 253 722 371 L683 399" fill="${mint}" stroke="${outline}" stroke-width="14"/>
<path d="M290 441 Q301 286 489 291 Q686 276 717 434 L740 548 Q749 724 507 761 Q278 743 277 555 Z" fill="${mint}" stroke="${outline}" stroke-width="14"/>
<path d="M315 516 Q323 420 445 420 Q565 415 609 510 Q638 618 563 673 Q516 712 438 709 Q348 701 319 639 Q305 608 308 576 Q295 570 300 559 L312 544 Z" fill="${cream}"/>
<ellipse cx="335" cy="580" rx="24" ry="19" fill="#e6aa8d" opacity=".65"/>
<ellipse cx="560" cy="579" rx="35" ry="22" fill="#e6aa8d" opacity=".65"/>
<path d="M433 555 Q423 568 430 574" fill="none" stroke="#c1b69d" stroke-width="5" stroke-linecap="round"/>`;
const leftEyes=`<ellipse cx="370" cy="524" rx="12" ry="23" fill="${outline}"/><ellipse cx="515" cy="524" rx="18" ry="25" fill="${outline}"/><circle cx="369" cy="517" r="4.5" fill="white"/><circle cx="516" cy="517" r="6" fill="white"/>`;
const leftBlink=`<path d="M354 531 Q370 542 386 531 M491 531 Q515 545 539 531" fill="none" stroke="${outline}" stroke-width="12" stroke-linecap="round"/>`;
const leftSmileEyes=`<path d="M354 533 Q370 508 386 533 M492 533 Q515 503 538 533" fill="none" stroke="${outline}" stroke-width="12" stroke-linecap="round"/>`;
const leftSmileBlink=`<path d="M355 532 Q370 543 385 532 M494 532 Q515 545 536 532" fill="none" stroke="${outline}" stroke-width="12" stroke-linecap="round"/>`;
const leftBrows=`<path d="M357 466 L385 464 M496 464 L535 466" fill="none" stroke="${outline}" stroke-width="10" stroke-linecap="round"/>`;
const leftRaised=`<path d="M357 449 Q370 438 385 447 M496 447 Q515 438 535 449" fill="none" stroke="${outline}" stroke-width="10" stroke-linecap="round"/>`;
const leftMouth=content=>`<g transform="translate(30 0) scale(.8 1)">${content}</g>`;
const reflect=content=>`<g transform="translate(1024 0) scale(-1 1)">${content}</g>`;

const centerParts={body,head,eyes,'eyes-blink':blink,'eyes-smile':smileEyes,'eyes-smile-blink':smileBlink,brows,'brows-raised':raised,mouth,'mouth-talk':talk,'mouth-smile':mouthSmile,'mouth-surprise':surprise,'mouth-smile-talk':smileTalk,'mouth-surprise-talk':surpriseTalk};
const leftParts={head:leftHead,eyes:leftEyes,'eyes-blink':leftBlink,'eyes-smile':leftSmileEyes,'eyes-smile-blink':leftSmileBlink,brows:leftBrows,'brows-raised':leftRaised,mouth:leftMouth(mouth),'mouth-talk':leftMouth(talk),'mouth-smile':leftMouth(mouthSmile),'mouth-surprise':leftMouth(surprise),'mouth-smile-talk':leftMouth(smileTalk),'mouth-surprise-talk':leftMouth(surpriseTalk)};
const rightParts=Object.fromEntries(Object.entries(leftParts).map(([name,content])=>[name,reflect(content)]));
export const parts={center:centerParts,left:leftParts,right:rightParts};
export const art={...centerParts};
for(const facing of ['left','right'])for(const [name,content] of Object.entries(parts[facing]))art[`${facing}-${name}`]=content;
const legacyCenter={'neutral':'neutral','neutral.talk':'talk','neutral.blink':'blink','smile':'smile','surprise':'surprise'};
for(const facing of ['center','left','right'])for(const expression of ['neutral','smile','surprise'])for(const talking of [false,true])for(const blinking of [false,true]){
  const suffix=expression+(talking?'.talk':'')+(blinking?'.blink':'');
  const name=facing==='center'&&legacyCenter[suffix]?legacyCenter[suffix]:facing!=='center'&&suffix==='neutral'?facing:`${facing}-${suffix.replaceAll('.','-')}`;
  const p=parts[facing];
  const eyeKey=blinking?(expression==='smile'?'eyes-smile-blink':'eyes-blink'):expression==='smile'?'eyes-smile':'eyes';
  const mouthKey='mouth'+(expression==='neutral'?'':`-${expression}`)+(talking?'-talk':'');
  art[name]=body+p.head+p[eyeKey]+p[expression==='surprise'?'brows-raised':'brows']+p[mouthKey];
}
