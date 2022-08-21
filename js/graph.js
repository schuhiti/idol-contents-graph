import cytoscape from "./cytoscape.esm.min.js";
import { data } from "./data.js";


// https://gist.github.com/jlevy/c246006675becc446360a798e2b2d781
const simpleHash = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return new Uint32Array([hash])[0].toString(36);
};

const cvCount = {};
const filtered = data.filter(item => {
  if (!item.CV) return false;
  let re = /ミリオンライブ！|シャイニーカラーズ|シンデレラガールズ|ウマ娘|IDOL舞SHOW/;
  let regexed = re.test(item.Title);
  if (regexed) {
    cvCount[item.CV] = (cvCount[item.CV]) ? cvCount[item.CV] + 1 : 1;
    return true;
  }
});

const nodes = [];
const edges = [];
const checked = {};
filtered.forEach(item => {
  if (cvCount[item.CV] == 1) return;
  const addNode = (prefix, name, weight) => {
    if (!checked[prefix + name]) {
      const nid = simpleHash(prefix + name);
      const dat = { data: { id: nid, name: name }};
      if (weight) dat.weight = weight;
      nodes.push(dat);
      checked[prefix + name] = nid;
    }
  };
  const addEdge = (s, t) => {
    edges.push({ data: { source: checked[s], target: checked[t] }})
  }
  if (!checked[item.Title]) {
    addNode("", item.Title, 100);
  }
  addNode(item.Title, item.Name, 0);
  addNode("", item.CV, cvCount[item.CV]);
  addEdge(item.Title + item.Name, item.CV);
  addEdge(item.Title, item.Title + item.Name);
  /*
  if (item.Unit.length > 0) {
    const unit = item.Unit[0];
    addNode(item.Title, unit);
    addEdge(item.Title, item.Title + unit);
    addEdge(item.Title + unit, item.Title + item.Name);
  }
  */
  
});

const cy = cytoscape({
    container: document.getElementById('cy'),

    boxSelectionEnabled: false,
    autounselectify: true,
  
    style: cytoscape.stylesheet()
      .selector('node')
        .css({
          'content': 'data(name)',
          'text-valign': 'center',
          'color': 'white',
          'text-outline-width': 2,
          'text-outline-color': '#888',
          'background-color': '#888'
        })
      .selector(':selected')
        .css({
          'background-color': 'black',
          'line-color': 'black',
          'target-arrow-color': 'black',
          'source-arrow-color': 'black',
          'text-outline-color': 'black'
        }),
  
    elements: {
        nodes: nodes,
        edges: edges
    },
  
    layout: {
      name: 'cose',
    }
});