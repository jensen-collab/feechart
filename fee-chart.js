
(function(){
  var e = React.createElement;
  var useState = React.useState, useMemo = React.useMemo;
  var RC = Recharts;
  var LineChart = RC.LineChart, Line = RC.Line, XAxis = RC.XAxis, YAxis = RC.YAxis,
      CartesianGrid = RC.CartesianGrid, Tooltip = RC.Tooltip, Legend = RC.Legend, ResponsiveContainer = RC.ResponsiveContainer;

  function FeeChart() {
    var _useState = useState('scale1'), scale = _useState[0], setScale = _useState[1];
    var _useState2 = useState('percentage'), mode = _useState2[0], setMode = _useState2[1];

    function compactCurrency(val){
      if(val>=1000000) return '$'+(val/1000000).toFixed(1)+'m';
      if(val>=1000) return '$'+(val/1000).toFixed(0)+'k';
      return '$'+Math.round(val).toLocaleString();
    }
    function fullCurrency(val){
      return val.toLocaleString('en-AU',{style:'currency',currency:'AUD',minimumFractionDigits:0});
    }
    function computeCoeffs(startPct,endPct,minCost,maxCost){
      var denom=Math.log10(maxCost)-Math.log10(minCost);
      var b=(startPct-endPct)/denom;
      var a=startPct+b*Math.log10(minCost);
      return {a:a,b:b};
    }

    var S1_MIN=150000,S1_MAX=10000000;
    var archCoeffs1=computeCoeffs(20,3.5,S1_MIN,S1_MAX);
    var landCoeffs1=computeCoeffs(15,5.25,S1_MIN,S1_MAX);
    function archPct1(c){return Math.min(20,archCoeffs1.a-archCoeffs1.b*Math.log10(c));}
    function landPct1(c){return Math.min(15,landCoeffs1.a-landCoeffs1.b*Math.log10(c));}

    var S2_MIN=50000,S2_MAX=3000000;
    var archCoeffs2=computeCoeffs(20,8,S2_MIN,S2_MAX);
    var landCoeffs2=computeCoeffs(15,10,S2_MIN,S2_MAX);
    function archPct2(c){return archCoeffs2.a-archCoeffs2.b*Math.log10(c);}
    function landPct2(c){return landCoeffs2.a-landCoeffs2.b*Math.log10(c);}

    var curveData1=useMemo(function(){
      var n=240,step=(S1_MAX-S1_MIN)/(n-1),arr=[];
      for(var i=0;i<n;i++){var cost=S1_MIN+i*step;
        var a=archPct1(cost),l=landPct1(cost);
        arr.push({cost:cost,archPct:a,landPct:l,archFee:cost*a/100,landFee:cost*l/100});}
      return arr;
    },[]);
    var curveData2=useMemo(function(){
      var n=240,step=(S2_MAX-S2_MIN)/(n-1),arr=[];
      for(var i=0;i<n;i++){var cost=S2_MIN+i*step;
        var a=archPct2(cost),l=landPct2(cost);
        arr.push({cost:cost,archPct:a,landPct:l,archFee:cost*a/100,landFee:cost*l/100});}
      return arr;
    },[]);

    var ref1=[150000,500000,1000000,2500000,5000000,10000000].map(function(c){
      var a=archPct1(c),l=landPct1(c);return {cost:c,archPct:a,landPct:l,archFee:c*a/100,landFee:c*l/100};});
    var ref2=[50000,100000,250000,500000,1000000,2000000,3000000].map(function(c){
      var a=archPct2(c),l=landPct2(c);return {cost:c,archPct:a,landPct:l,archFee:c*a/100,landFee:c*l/100};});

    var dataset=scale==='scale1'?curveData1:curveData2;
    var refData=scale==='scale1'?ref1:ref2;
    var domain=scale==='scale1'?[S1_MIN,S1_MAX]:[S2_MIN,S2_MAX];

    function btnStyle(active){return{
      flex:1,padding:'10px 14px',fontSize:'14px',fontWeight:500,borderRadius:'6px',
      border:active?'none':'1px solid #d1d5db',
      backgroundColor:active?'#1f2937':'#ffffff',
      color:active?'#ffffff':'#374151',cursor:'pointer'};}

    return e('div',{style:{background:'#fff',padding:'20px',borderRadius:'8px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}},[
      e('h2',{style:{margin:'0 0 12px',fontSize:'24px',fontWeight:700,color:'#111827'}},'Fee Chart Scale'),

      e('div',{style:{display:'flex',gap:'8px',marginBottom:'10px',flexWrap:'wrap'}},[
        e('button',{style:btnStyle(scale==='scale1'),onClick:function(){return setScale('scale1');}},'Scale 1: $150k–$10m'),
        e('button',{style:btnStyle(scale==='scale2'),onClick:function(){return setScale('scale2');}},'Scale 2: $50k–$3m')
      ]),
      e('div',{style:{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}},[
        e('button',{style:btnStyle(mode==='percentage'),onClick:function(){return setMode('percentage');}},'Percentage (%)'),
        e('button',{style:btnStyle(mode==='fee'),onClick:function(){return setMode('fee');}},'Fee (AUD $)')
      ]),

      e('div',{style:{height:'380px',marginBottom:'18px',border:'1px solid #e5e7eb',borderRadius:'6px'}},[
        e(ResponsiveContainer,{width:'100%',height:'100%'},[
          e(LineChart,{data:dataset,margin:{top:8,right:12,left:8,bottom:12}},[
            e(CartesianGrid,{strokeDasharray:'3 3'}),
            e(XAxis,{dataKey:'cost',type:'number',domain:domain,tickFormatter:compactCurrency,style:{fontSize:'12px'}}),
            e(YAxis,{tickFormatter:function(v){return mode==='percentage'?v.toFixed(1)+'%':compactCurrency(v);},width:64,style:{fontSize:'12px'}}),
            e(Tooltip,{formatter:function(val){return mode==='percentage'?(+val).toFixed(2)+'%':fullCurrency(+val);},labelFormatter:function(c){return 'Cost: '+fullCurrency(c);},contentStyle:{fontSize:'13px'}}),
            e(Legend,{wrapperStyle:{fontSize:'12px'}}),
            mode==='percentage'
              ? e(Line,{type:'monotone',dataKey:'archPct',name:'Architecture %',stroke:'#1f2937',strokeWidth:3,dot:false})
              : e(Line,{type:'monotone',dataKey:'archFee',name:'Architecture Fee',stroke:'#1f2937',strokeWidth:3,dot:false}),
            mode==='percentage'
              ? e(Line,{type:'monotone',dataKey:'landPct',name:'Landscape %',stroke:'#a67c52',strokeWidth:3,dot:false})
              : e(Line,{type:'monotone',dataKey:'landFee',name:'Landscape Fee',stroke:'#a67c52',strokeWidth:3,dot:false})
          ])
        ])
      ]),

      e('div',{style:{overflowX:'auto'}},[
        e('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:'14px'}},[
          e('thead',{style:{background:'#f9fafb'}},[
            e('tr',null,[
              e('th',{style:th()},'Construction Cost'),
              e('th',{style:th()},'Architecture %'),
              e('th',{style:th()},'Landscape %'),
              e('th',{style:th()},'Arch Fee ($)'),
              e('th',{style:th()},'Land Fee ($)')
            ])
          ]),
          e('tbody',null,refData.map(function(row,i){
            return e('tr',{key:i,style:{background:i%2===0?'#fff':'#f9fafb'}},[
              e('td',{style:td()},fullCurrency(row.cost)),
              e('td',{style:td()},(row.archPct).toFixed(2)+'%'),
              e('td',{style:td()},(row.landPct).toFixed(2)+'%'),
              e('td',{style:td()},fullCurrency(row.archFee)),
              e('td',{style:td()},fullCurrency(row.landFee))
            ]);
          }))
        ])
      ])
    ]);
    function th(){return{padding:'10px 12px',textAlign:'left',borderBottom:'1px solid #e5e7eb',fontWeight:600,color:'#111827'};}
    function td(){return{padding:'10px 12px',borderBottom:'1px solid #e5e7eb',whiteSpace:'nowrap'};}
  }

  ReactDOM.render(e(FeeChart),document.getElementById('fee-chart-root'));
})();
