import * as echarts from "./echarts.esm.min.js";
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

const getNodeId = str => simpleHash(str);

const flags = {
  imas: true,
  ik: false,
  ll: true,
  bushi: true,
  uma: true,
  onsen: false,
  other: false,
}
const reImas = "ミリオンライブ！|シャイニーカラーズ|シンデレラガールズ";
const reLl = "ラブライブ！|サンシャイン!!|虹ヶ咲学園スクールアイドル同好会|スーパースター!!";
const reB = "バンドリ！|D4DJ|アサルトリリィ|少女☆歌劇レヴュースタァライト"
const reO = "IDOL舞SHOW|8 beat Story♪|Tokyo 7th シスターズ";
let re = "";
if (flags['imas']) { re = `|${re}|${reImas}`; }
if (flags['ik']) { re = `|${re}|アイカツ`; }
if (flags['ll']) { re = `|${re}|${reLl}`; }
if (flags['bushi']) { re = `|${re}|${reB}`; }
if (flags['uma']) { re = `|${re}|ウマ娘`; }
if (flags['onsen']) { re = `|${re}|温泉むすめ`; }
if (flags['other']) { re = `|${re}|${reO}`; }
const regex = new RegExp(re.replace(/^\|+/, ""));

const cvCount = {};
const filtered = data.characters.filter(item => {
  if (!item.CV) return false;
  let regexed = regex.test(item.Title);
  //if (true) {
  cvCount[item.Title + item.CV] = (cvCount[item.Title + item.CV]) ? cvCount[item.Title + item.CV] + 1 : 1;
  if (regexed & cvCount[item.Title + item.CV] == 1) {
    cvCount[item.CV] = (cvCount[item.CV]) ? cvCount[item.CV] + 1 : 1;
    return true;
  }
});

const categories = [
  {name : 'Title'},
  { name: 'Series'},
  {name: 'Name'},
  {name: 'CV'}
];

const nodes = [];
const edges = [];
const checked = {};

const addNode = (prefix, name, opt) => {
  if (!checked[prefix + name]) {
    const nid = getNodeId(prefix + name);
    const dat = { id: nid, name: name };
    for (const [k, v] of Object.entries(opt)) {
      dat[k] = v;
    }
    nodes.push(dat);
    checked[prefix + name] = nid;
    return nid;
  }
};

const addEdge = (s, t) => {
  edges.push({ source: checked[s], target: checked[t] })
}

if (flags['imas']) {
  addNode("", "アイドルマスター", { category: 'Series', symbolSize: 30});
  ["ミリオンライブ！", "シャイニーカラーズ", "シンデレラガールズ"].forEach(t => {
    addNode("", t, { category: 'Title', symbolSize: 20});
    addEdge("アイドルマスター", t);
  });
}

if (flags['ik']) {
  addNode("", "アイカツ！", { category: 'Series', symbolSize: 30});
  ["アイカツスターズ！", "アイカツフレンズ！", "アイカツオンパレード！"].forEach(t => {
    addNode("", t, { category: 'Title', symbolSize: 20});
    addEdge("アイカツ！", t);
  });
}

if (flags['ll']) {
  addNode("", "ラブライブ！", { category: 'Series', symbolSize: 30});
  ["サンシャイン!!", "虹ヶ咲学園スクールアイドル同好会", "スーパースター!!"].forEach(t => {
    addNode("", t, { category: 'Title', symbolSize: 20});
    addEdge("ラブライブ！", t);
  });
}

filtered.forEach(item => {
  if (cvCount[item.CV] == 1) return;
  if (!checked[item.Title]) {
    addNode("", item.Title, { category: 'Title', symbolSize: 20});
  }
  addNode(item.Title, item.Name, { category: 'Name', symbolSize: 10});
  addNode("", item.CV, { category: 'CV', symbolSize: (cvCount[item.CV]*4.5)+10, value: cvCount[item.CV]});
  addEdge(item.Title + item.Name, item.CV);
  addEdge(item.Title, item.Title + item.Name);
  /*
  if (item.Unit.length > 0) {
    const unit = item.Unit[0];
    addNode(item.Title, unit, { category: 'Unit'});
    addEdge(item.Title, item.Title + unit);
    addEdge(item.Title + unit, item.Title + item.Name);
  }
  */
  
});

const myChart = echarts.init(document.getElementById('main'))

const option = {
  title: {
    text: 'IDOL Contents Graph'
  },
  tooltip: {},
  legend: [{
    data: categories.map(c => c.name)
  }],
  series: [
    {
      name: '',
      type: 'graph',
      type: 'graph',
      initLayout: 'circular',
      layout: 'force',
      data: nodes,
      links: edges,
      categories: categories,
      roam: true,
      label: {
        show: true,
        position: 'right',
        formatter: '{b}'
      },
      labelLayout: {
        hideOverlap: true
      },
      scaleLimit: {
        min: 0.4,
        max: 2
      },
      lineStyle: {
        color: 'source',
        curveness: 0.3
      },
      force: {
        repulsion: 30
      }
    }
  ]
};

// Display the chart using the configuration items and data just specified.
myChart.setOption(option);