importScripts("./main.js")
onmessage = (e) => {
    let data = e.data
    switch (data.method) {
        case 'startCalc':
            startCalc(data.data)
            break;
        default:
            postMessage('Unknown command: ' + data.method);
    }
}
function startCalc(currentScene){
    let calc123=new calc(currentScene.skillList,currentScene.condition.health,currentScene.condition.targetHealth)
    calc123.calcTree((percentage)=>{postMessage({method:"percentageUpdate",data:{percentage}})})
    postMessage({method:"calcComplete",data:calc123.getResult()})
}