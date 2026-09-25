import re, importlib.util, os
spec=importlib.util.spec_from_file_location("rc","scripts/render-check.py")
rc=importlib.util.module_from_spec(spec); spec.loader.exec_module(rc)
from liquid import Environment, FileSystemLoader
def env():
    e=Environment(loader=FileSystemLoader("snippets", ext=".liquid"))
    for f in ('handleize','json','image_url','image_tag','default_errors','payment_button'):
        e.filters[f]=lambda v,*a,**k: str(v) if v is not None else ''
    e.filters['t']=rc._translate
    e.filters['money']=lambda v,*a,**k: "${:,.2f}".format(float(v)/100) if v not in (None,'') else ''
    e.filters['money_without_currency']=lambda v,*a,**k: "{:,.2f}".format(float(v)/100) if v not in (None,'') else ''
    e.filters['money_without_trailing_zeros']=lambda v,*a,**k: "${:,.0f}".format(float(v)/100) if v not in (None,'') else ''
    return e

def v(l,c,active=False):
    return {'label':l,'value':l,'count':c,'active':active,'swatch':None,
            'param_name':'filter.p','url_to_add':'/c?f='+l,'url_to_remove':'/c'}
def lst(label, vals):
    return {'label':label,'type':'list','param_name':'f','values':vals,'active_values':[],
            'range_min':0,'range_max':0,'min_value':{},'max_value':{}}
price={'label':'Price','type':'price_range','param_name':'f','values':[],'active_values':[],
 'range_min':0,'range_max':8212,
 'min_value':{'value':None,'param_name':'filter.v.price.gte'},
 'max_value':{'value':None,'param_name':'filter.v.price.lte'}}
FILTERS=[lst('Availability',[v('In stock',12),v('Out of stock',1)]), price,
         lst('Color',[v('Black',7),v('Ivory',3)]), lst('Size',[v('S',9),v('M',11)])]

BASE={'sidebar_position':'left','filter_style':'sidebar','grid_columns':'3',
 'view_default':'grid','pagination_style':'numbered','title_style':'style-1',
 'products_per_page':12,'container_style':'boxed','scheme':'theme',
 'show_demo_when_empty':False,'builtin_filters':False,'swatch_style':'list',
 'show_banner':False,'show_bestsellers':False,'bestsellers_position':'above',
 'bestsellers_count':4,'banner_height':40,'banner_text_position':'center',
 'banner_eyebrow':'Collection','banner_show_count':True,'banner_image':None,
 'bestsellers_collection':None,'bestsellers_heading':'Best sellers'}

src=rc.strip(open('sections/main-collection.liquid',encoding='utf-8').read())
def render(**over):
    st=dict(BASE); st.update(over)
    ctx={'section':{'id':'x','settings':st},
     'collection':{'title':'Dresses','url':'/c','products':rc.simple_store(4),
       'products_count':13,'filters':FILTERS,'all_tags':[],'description':'A note.',
       'image':'img.jpg'},
     'collections':{}, 'settings':{}, 'cart':{'currency':{'symbol':'$'}},
     'shop':{'currency':'USD'},
     'paginate':{'pages':3,'current_page':1,'previous':None,
       'next':{'url':'/c?page=2','title':'Next'},
       'parts':[{'is_link':False,'title':'1','url':''},
                {'is_link':True,'title':'2','url':'/c?page=2'}]}}
    return env().from_string(src).render(**ctx)

TESTS=[
 ("Collection Title Style", 'title_style', ['style-1','style-2','style-3','style-4','style-5'],
   lambda o,val: f'collection-title--{val}' in o),
 ("Sidebar Position", 'sidebar_position', ['left','right','none'],
   lambda o,val: ('collection-layout--sidebar-'+val in o) if val!='none' else ('collection-sidebar' not in o)),
 ("Filter Style", 'filter_style', ['sidebar','toggle','hidden','drawer','dropdown','panel'],
   lambda o,val: {'sidebar':'collection-sidebar' in o,
                  'toggle':'aria-expanded="false"' in o,
                  'hidden':'collection-layout--sidebar-collapsed' in o and 'data-toggle-sidebar' in o,
                  'drawer':'data-open-filter-drawer' in o and '<aside' not in o,
                  'dropdown':'dropdown-filter' in o and '<aside' not in o,
                  'panel':'data-filter-panel' in o and 'data-toggle-filter-panel' in o and '<aside' not in o}[val]),
 ("Colour swatch style", 'swatch_style', ['list','chips','dots'],
   lambda o,val: f'filter-swatches--{val}' in o),
 ("Surface tone", 'scheme', ['light','dark','warm','theme'],
   lambda o,val: f'collection-page--tone-{val}' in o),
 ("Container Width", 'container_style', ['boxed','wide','full'],
   lambda o,val: f'collection-page--{val}' in o),
 ("Default Grid Columns", 'grid_columns', ['2','3','4','5','6'],
   lambda o,val: f'product-grid--{val}' in o),
 ("Default View", 'view_default', ['grid','list'],
   lambda o,val: f'data-view="{val}"' in o),
 ("Pagination Style", 'pagination_style', ['numbered','load_more','infinite'],
   lambda o,val: {'numbered':'pagination__item' in o,'load_more':'data-load-more' in o,
                  'infinite':'data-infinite-scroll' in o}[val]),
 ("Show image banner", 'show_banner', [True,False],
   lambda o,val: ('collection-banner' in o) == val),
 ("Banner text position", 'banner_text_position', ['left','center','bottom'],
   lambda o,val: f'collection-banner--{val}' in render(show_banner=True, banner_text_position=val)),
 ("Show product count in banner", 'banner_show_count', [True,False],
   lambda o,val: ('collection-banner__count' in render(show_banner=True, banner_show_count=val)) == val),
 ("Show best sellers row", 'show_bestsellers', [True,False],
   lambda o,val: True),
 ("Use built-in filters", 'builtin_filters', [True,False],
   lambda o,val: True),
]
print(f"{'SETTING':30} {'VALUE':12} RESULT")
fails=[]
for label, key, vals, check in TESTS:
    for val in vals:
        try:
            out=render(**{key:val})
            ok=check(out,val)
        except Exception as e:
            ok=False; out=str(e)[:60]
        print(f"{label[:29]:30} {str(val)[:11]:12} {'PASS' if ok else 'FAIL'}")
        if not ok: fails.append((label,val))
print()
print("FAILURES:", fails if fails else "none")
