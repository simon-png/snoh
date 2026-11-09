"""Build the portfolio with Python 3; no third-party packages required."""
import json, re, shutil, os, hashlib
from pathlib import Path
from html import escape, unescape
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'_site'
SITE=json.loads((ROOT/'content/site.json').read_text())
def read(name):return (ROOT/'content'/name).read_text()
def localize(text,root):
 text=text.replace('{{root}}',root)
 def link(m):
  href=unescape(m.group(1))
  href=re.sub(r'^https?://(?:www\.)?snoh\.co\.uk','',href)
  if href in ['/home','/home/','/']:href=root
  elif href.startswith('/contact'):href=SITE['linkedin']
  elif href.startswith('/') and not href.startswith('//'):href=root+href.lstrip('/').rstrip('/')+'/'
  return 'href="'+escape(href,quote=True)+'"'
 return re.sub(r'href="([^"]+)"',link,text)
def cards(projects,root):
 return '<div class="project-grid">'+''.join(f'''<article class="project-card"><a class="project-image" href="{root}{p['slug']}/" tabindex="-1" aria-hidden="true"><img src="{root}{p['thumbnail']}" alt="" loading="lazy" width="800" height="540"></a><h3><a href="{root}{p['slug']}/">{escape(p['cardTitle'])}</a></h3><a class="button" href="{root}{p['slug']}/">View case study<span class="sr-only">: {escape(p['cardTitle'])}</span><span aria-hidden="true"> ↗</span></a></article>''' for p in projects)+'</div>'
def layout(title,body,root='./',home=False,description='Product design, research and user experience. Selected work by Simon Coxon.'):
 version=hashlib.sha256((ROOT/'assets/styles.css').read_bytes()).hexdigest()[:8]
 active=' aria-current="page"' if home else ''
 return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(title)} — Simon Coxon</title><meta name="description" content="{escape(description,quote=True)}"><meta name="theme-color" content="#38383b"><meta property="og:title" content="{escape(title,quote=True)} — Simon Coxon"><meta property="og:description" content="{escape(description,quote=True)}"><meta property="og:type" content="website"><link rel="icon" href="{root}{SITE['logo']}"><link rel="stylesheet" href="{root}assets/fonts/fonts.css"><link rel="stylesheet" href="{root}assets/styles.css?v={version}"><script src="{root}assets/site.js" defer></script></head>
<body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="{root}" aria-label="Simon Coxon — Home"><img src="{root}{SITE['logo']}" width="54" height="54" alt=""></a><nav aria-label="Main navigation"><a href="{root}"{active}>Home</a><a href="{root}#work">Work</a><a href="#footer">Connect</a></nav></header>
<main id="main">{body}</main>
<footer id="footer" class="site-footer"><a href="{root}" class="brand" aria-label="Simon Coxon — Home"><img src="{root}{SITE['logo']}" width="60" height="60" alt=""></a><div><p class="footer-title">Thanks for visiting</p><p>If you’re interested in working with me,<br>let’s connect on <a href="{SITE['linkedin']}">LinkedIn</a>.</p><div class="social-links"><a href="{SITE['linkedin']}">LinkedIn ↗</a><a href="{SITE['medium']}">Medium ↗</a></div></div><a class="back-top" href="#">Back to top ↑</a></footer></body></html>'''
def build():
 OUT.mkdir(exist_ok=True)
 shutil.copytree(ROOT/'assets',OUT/'assets',dirs_exist_ok=True)
 shutil.copyfile(ROOT/'CNAME',OUT/'CNAME')
 intro=read('home.html')
 # Keep the original introduction; its supporting statements aren't section headings.
 intro=intro.replace('<h2>','<p class="intro-statement">').replace('</h2>','</p>')
 body=f'<section class="intro wrap">{intro}<a class="button" href="{SITE["linkedin"]}">Find me on LinkedIn ↗</a></section><section class="work wrap" id="work"><h2>Case studies</h2>{cards(SITE["projects"],"./")}</section><div class="resources wrap">{read("resources.html")}</div>'
 (OUT/'index.html').write_text(layout('Product Design, Research & UX',localize(body,'./'),home=True))
 for i,p in enumerate(SITE['projects']):
  root='../';others=[next(q for q in SITE['projects'] if q['slug']==slug) for slug in p['related']]
  body=f'''<section class="case-hero"><img src="{root}{p['hero']}" alt="" fetchpriority="high"><div class="hero-shade"></div><div class="hero-heading wrap"><p class="eyebrow">{escape(p['eyebrow'])}</p><h1>{escape(p['title']).replace('Notonthehighstreet','Notonthe<wbr>highstreet')}</h1></div></section><article class="case-body" aria-label="Case study">{localize(read(p['slug']+'.html'),root)}</article><section class="read-next wrap"><h2>Read next</h2>{cards(others,root)}</section>'''
  folder=OUT/p['slug'];folder.mkdir(exist_ok=True)
  (folder/'index.html').write_text(layout(p['title'],body,root,description=p['title']+' — a product design case study by Simon Coxon.'))
 base=os.environ.get('BASE_PATH','').rstrip('/')+'/'
 (OUT/'404.html').write_text(layout('Page not found','<section class="wrap error-page"><p class="eyebrow">404</p><h1>This page has moved.</h1><p>Explore my selected work from the home page.</p><a class="button" href="{base}">Back to home</a></section>'.replace("{base}",base),root=base))
 # Preserve old Squarespace links without keeping a contact form or page in navigation.
 for slug,target in [('home','../'),('contact-1','../#footer'),('ft-paywall-pt1','../ft-paywall-small-experiments/')]:
  folder=OUT/slug;folder.mkdir(exist_ok=True)
  (folder/'index.html').write_text(f'<!doctype html><html lang="en"><meta charset="utf-8"><title>Page moved</title><meta http-equiv="refresh" content="0;url={target}"><a href="{target}">Continue to portfolio</a></html>')
 (OUT/'.nojekyll').touch()
 print('Built Home, 4 case studies, 404 and legacy link redirects in',OUT)
if __name__=='__main__':build()
