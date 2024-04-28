importScripts("./main.js")
onmessage = (e) => {
    let data = e.data
    switch (data.method) {
        case 'initCalc':
            initCalc(data.data.currentScene,data.data.newSituations,data.data.id)
            break;
        case 'startCalc':
            startCalc()
            break;
        default:
            postMessage('Unknown command: ' + data.method);
    }
}
var initData=null
function initCalc(currentScene,newSituations,id){
    initData={currentScene,newSituations,id}
}
function startCalc(){
    let {currentScene,newSituations,id}=initData
    let subCalc=new calc(currentScene.skillList,currentScene.condition.health,currentScene.condition.targetHealth)
    subCalc.calcSubTree(newSituations.length>0?newSituations:subCalc.calcTree(),(newSituations)=>{
        postMessage({method:"createSubWorker",data:{newSituations}})
    })
    postMessage({method:"calcComplete",data:{results:subCalc.getResult(),id}})
}