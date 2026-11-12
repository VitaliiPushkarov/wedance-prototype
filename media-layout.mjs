// Apply the studio's new media without touching any hero section or manual HTML layout.
const photo = name => `assets/photos/${name}.webp`;
const setImage = (tag, src, alt) => tag.replace(/src="[^"]*"/, `src="${src}"`).replace(/alt="[^"]*"/, `alt="${alt}"`);
function gallery(items) {
 return `<section class="section studio-gallery" aria-label="Studio moments"><div class="container studio-gallery-grid">${items.map(([name,alt])=>`<figure><img src="${photo(name)}" alt="${alt}" loading="lazy" width="1440" height="960"></figure>`).join('')}</div></section>`;
}
export function applyStudioMedia(html, slug) {
 const heroes=[];
 let content=html.replace(/<section\b[^>]*class="(?:hero\b|page-hero\b)[^"]*"[^>]*>[\s\S]*?<\/section>/g,match=>`<!--PRESERVED_HERO_${heroes.push(match)-1}-->`);
 const about=slug==='about';
 const storyImages=about
  ? [['studio-workshop','Dancers taking part in a studio workshop'],['latin-coaching','Personal Latin coaching at We Dance'],['group-floor','Dancers learning together on the studio floor']]
  : [['shared-floor','Ballroom practice on the We Dance studio floor'],['partner-training','Dancers working on partnering and technique'],['group-floor','The We Dance community learning together']];
 content=content.replace(/<img\b[^>]*data-story-image="([0-2])"[^>]*>/g,(tag,i)=>setImage(tag,photo(storyImages[i][0]),storyImages[i][1]));
 content=content.replace(/(<section class="community-banner"[^>]*>)(\s*<img\b[^>]*>)/g,(_,start,img)=>start+setImage(img,photo(about?'shared-floor':'group-floor'),about?'Ballroom dancers practicing together':'A full studio floor at a We Dance group session'));
 content=content.replace(/<article class="program-card[^\"]*">[\s\S]*?<\/article>/g,card=>{
  if(card.includes('href="adults.html"')) return card.replace(/data-src="[^"]*"/,'data-src="assets/video/line-dance-preview.mp4"').replace(/data-src-mobile="[^"]*"/,'data-src-mobile="assets/video/line-dance-preview-mobile.mp4"').replace(/poster="[^"]*"/,'poster="assets/posters/line-dance.webp"');
  if(card.includes('href="kids.html"')) return card.replace(/poster="[^"]*"/,`poster="${photo('dance-practice')}"`);
  if(card.includes('href="competitive.html"')) return card.replace(/poster="[^"]*"/,`poster="${photo('ballroom-demonstration')}"`);
  return card;
 });
 const journeys={kids:['young-dancers-training','Young dancers practicing movement together'],competitive:['ballroom-partnership','A ballroom pair developing their partnering'],about:['studio-workshop','Dancers gathered for a workshop in the studio']};
 if(journeys[slug]) content=content.replace(/(<div class="journey-image">)(\s*<img\b[^>]*>)/g,(_,start,img)=>start+setImage(img,photo(journeys[slug][0]),journeys[slug][1]));
 if(slug==='adults') content=content.replace(/<div class="journey-image">[\s\S]*?<\/div>/,`<div class="journey-image editorial-film"><video class="editorial-video" data-src="assets/video/line-dance-preview.mp4" data-src-mobile="assets/video/line-dance-preview-mobile.mp4" poster="assets/posters/line-dance.webp" muted loop playsinline preload="none" aria-hidden="true"></video><button class="button button-outline" data-video="line-dance">Watch line dancing <svg><use href="#play"/></svg></button></div>`);
 if(slug==='gift-certificates') content=content.replace(/(<div class="journey-image">)(\s*<img\b[^>]*>)/g,(_,start,img)=>start+setImage(img,'assets/posters/line-dance.webp','Adults enjoying a dance together at the studio'));
 const schedulePhotos={adults:['assets/posters/line-dance.webp','Adults enjoying line dancing'],kids:[photo('future-dancers'),'Young students at a studio class'],competitive:[photo('ballroom-demonstration'),'A ballroom demonstration at We Dance']};
 content=content.replace(/(<article class="schedule-card" data-schedule="([^"]+)">)(\s*<img\b[^>]*>)/g,(_,start,key,img)=>start+(schedulePhotos[key]?setImage(img,...schedulePhotos[key]):img));
 const galleries={
  kids:[['dance-practice','Young dancers practicing in pairs'],['future-dancers','Children and teens listening during a studio lesson']],
  competitive:[['solo-expression','A dancer practicing Latin expression'],['latin-expression','Latin performance and expression at We Dance']],
  instructors:[['latin-coaching','Personal attention during a Latin dance lesson'],['ballroom-demonstration','Ballroom technique demonstrated on the studio floor']]
 };
 if(galleries[slug]&&!content.includes('class="section studio-gallery"')) content=content.replace(/<section class="section first-lesson"/,gallery(galleries[slug])+'<section class="section first-lesson"');
 return content.replace(/<!--PRESERVED_HERO_(\d+)-->/g,(_,i)=>heroes[i]);
}
