importScripts("./main.js")
onmessage = (e) => {
    let data = e.data
    switch (data.method) {
        case 'startCalc':
            startCalc(data.data.currentScene,data.data.newSituations,data.data.id)
            break;
        default:
            postMessage('Unknown command: ' + data.method);
    }
}
function startCalc(currentScene,newSituations,id){
    let subCalc=new calc(currentScene.skillList,currentScene.condition.health,currentScene.condition.targetHealth)
    subCalc.calcSubTree(newSituations.length>0?newSituations:subCalc.calcTree(),(newSituations)=>{
        postMessage({method:"createSubWorker",data:{newSituations}})
    })
    postMessage({method:"calcComplete",data:{results:subCalc.getResult(),id}})
}